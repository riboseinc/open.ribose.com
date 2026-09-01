# 05 — Hub importer: NewsmlSpokeReader + spokes registry

## Registry (SSOT: the wire repo)

Extend `riboseinc/wire/registries/sites.yaml` — already synced to the hub —
with the spoke feed location:

    - id: pubid
      site: https://pubid.github.io
      newsml: https://pubid.github.io/news-data/newsml.xml

`scripts/sync-data.sh` already copies it; no new sync path.

## Reader: `src/lib/newsmlSpoke.ts`

Mirrors the existing `HttpWireReader` contract:

1. `GET newsml.xml` (cache-first: `.wire-cache/newsml/<spoke>/`, refresh
   with `If-None-Match`; offline → cache; empty cache → skip + build log).
2. Parse with `newsmlg2-ts`; for each item: skip withdrawn, compare
   guid+version against cache to avoid re-fetching bodies.
3. Fetch item `newsml.xml` + **prefer the `body.adoc` rendition** (exact
   AsciiDoc fidelity → existing ArticleShell pipeline), fallback to inline
   XHTML (rendered via `set:html`; TOC/anchors/copy-code already work on
   HTML bodies). Media fetched to the cache and referenced relatively.
4. Project each item onto the hub's `WireArticle` shape (id, headline,
   subheadline, published, originSite, canonical, authors, media) — the
   /news Network stream, cards, article pages, prev/next and search all
   work unchanged because they already consume that interface.

## Merge & dedup

- Local wire items take precedence when a guid collides (the hub's own
  announcements may supersede a spoke's copy — `editionOf` links the two).
- Merge order: wire items + spoke items, newest first (existing sort).
- Canonical stays the spoke's URL (`canonicalHref` prop already supported
   by BaseLayout/ArticleShell; the origin footer already renders the
   spoke label + license line).

## Build integration

- Build-time only; deterministic. `npm run news:sync` (wrapper around the
  reader's refresh step) runs in CI before `astro build` — CI never
  depends on spoke uptime (cache committed or cached in CI workspace).
- Failure modes: spoke down (use cache), item XML invalid (skip item,
  warn), index missing (skip spoke, warn). Build fails only when the
  registry references a spoke and *no* cache exists at all — explicit
  `--strict` opt-in for production builds.

## Out of scope (recorded, not built)

Live ingest of *external* partner NewsML — the same reader will do it, but
that's a separate decision about trust, licensing, and review workflow.

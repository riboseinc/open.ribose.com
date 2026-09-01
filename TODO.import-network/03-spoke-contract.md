# 03 — Spoke publishing contract v1 (static NewsML-G2)

Every spoke exposes the same static tree under its own origin:

    /news-data/newsml.xml                        NewsMessage index (all items)
    /news-data/articles/<YYYY-MM-DD>-<slug>/
        newsml.xml                              full NewsItem
        body.adoc                               AsciiDoc rendition (source)
        body.html                               XHTML rendition (optional convenience)
        media/<...>                              images referenced by renditions

## Index (`newsml.xml`)

A `NewsMessage` whose `itemSet` carries one `NewsItem` per article with
full metadata but **body-less** (metadata-only envelope). The hub uses it
to discover items and decide what to import (guid, versionCreated, title,
provider). A `link` to the item's full `newsml.xml` rides in `itemMeta`
(`altId` or `derivedFrom` per final codec choice — fixed by 02).

## Item (`articles/<id>/newsml.xml`)

- `guid`: `urn:ribose:news:YYYY-MM-DD:<spoke>:<slug>` — note the spoke
  segment, keeping IDs globally unique across the network and date-full
  (matches the wire's `IdFormatCheck` convention).
- `itemMeta`: itemClass `ninat:text`, provider `nprov:<spoke>`,
  `versionCreated`, ` embargo` if needed.
- `contentMeta`: headline, slugline, description, by (authors),
  located (dateline), subjects (`ribose:`-scheme topics once /news topics
  land), `contentCreated`.
- `contentSet`:
  - `inlineXML` — the body as XHTML ( AsciiDoc → HTML conversion at spoke
    build; the exact same renderer the spoke uses for its own pages).
  - `remoteContent` renditions — `body.adoc` (mimetype `text/asciidoc`)
    and each media asset with `mediatype:picture` + `rendition` refs.
- Canonical URL: `itemMeta/link @rel="canonical"` → the spoke's own
  article page. The hub republishes with `canonicalHref` to the spoke.

## Versioning & lifecycle

- Corrections bump `version` on the same guid; the hub re-imports by
  comparing `versionCreated`/`version` (never edits history silently).
- Retractions: `itemMeta@pubstatus="withdrawn"` → hub de-lists, keeps a
  stub noting the retraction (same policy as the wire's `retracted`).

## Guarantees

- Static, cacheable (`ETag`/`Last-Modified` honored by the host CDN).
- Deterministic byte-stable output per commit (pretty, canonical XML —
  same serialization rules as the Ruby gem) so diffs and caching behave.
- No secrets, no dynamic endpoints; any static host works.

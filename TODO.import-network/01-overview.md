# Import Network — spoke sites publish NewsML-G2, hub imports full articles

## Goal

Every spoke site in the Ribose network publishes its news as **static
NewsML-G2**. The hub (www.ribose.com) pulls their NewsML indexes over plain
HTTP at build time and imports **full articles** (body + media + metadata)
into the Network stream of /news, with the canonical URL pointing back to
the spoke.

## Non-goals

- Runtime aggregation / servers. Everything stays static; the hub rebuilds
  on a schedule or when a spoke pings it (GitHub `repository_dispatch`).
- Write-back. Federation is strictly one-way (spoke → hub). The hub never
  modifies spoke content.
- Replacing the central wire (`riboseinc/wire`). The wire remains the hub's
  own origin; spokes are additional origins. Both speak NewsML-G2.

## Decision records

1. **NewsML-G2 as the interchange envelope** (IPTC 2.35, power conformance).
   One standard for internal federation *and* external consumers/partners;
   symmetric with the ingest direction (importing a partner's NewsML later
   uses the same reader). The wire publisher already emits `newsml.xml`.

2. **AsciiDoc as a first-class rendition inside the envelope.**
   The spoke's NewsItem carries (a) an inline XHTML body for standards
   compliance and universal rendering, and (b) the AsciiDoc source as an
   attachment/rendition (`body.adoc`). The hub prefers the AsciiDoc
   rendition — preserving fidelity through our existing rendering pipeline
   (admonitions, cross-refs, TOC extraction, code copy) — and falls back to
   inline XHTML when absent. We lose nothing and interoperate with everyone.

3. **Pull, not push.** Spokes never write to the hub or the wire repo.
   Each spoke's own build emits its news files; the hub fetches them.
   (The rejected prexian model cloned git repos at build time — this is
   plain HTTP GET of static files, no git ops, no credentials.)

4. **Cache-first fetching.** The hub build reads from `.wire-cache/`
   (consumer working dir; never inside dependencies) and refreshes over
   HTTP with `If-None-Match`. Offline or spoke-down → build from cache;
   missing cache → skip spoke with a loud build warning, never a broken
   build. `npm run news:sync` warms the cache deterministically for CI.

5. **Scoped TS library, not a full port.** `newsmlg2-ts` covers the
   subset the network needs (NewsMessage + NewsItem, inline XHTML content,
   remoteContent renditions, the IPTC catalogs we actually reference).
   Declarative element mappings drive a generic XML codec — no per-class
   hand-rolled serialization. The Ruby gem remains the reference
   implementation; both are pinned together by shared golden files.

## Architecture

    ┌─────────────┐  static   ┌──────────────────────────────┐
    │ spoke site  │──build──▶ │ /news-data/newsml.xml        │◀─┐
    │ (any stack) │           │ /news-data/articles/<id>/    │  │ HTTP GET
    │  SSOT posts │           │   newsml.xml  body.adoc  media│  │ cache-first
    └─────────────┘           └──────────────────────────────┘  │
       metanorma.org, lutaml, pubid, …                           │
                                                       ┌─────────┴────────┐
                                                       │ hub build        │
                                                       │ NewsmlSpokeReader│
                                                       │ + LocalWireReader│
                                                       └────────┬─────────┘
                                          /news Network stream │ canonical → spoke
                                                                ▼
                                                          static site

## Phases (each phase ships independently)

1. `newsmlg2-ts` library (02) — pilot-ready codec + conformance suite
2. Spoke contract + first adapter, pilot on the smallest spoke (03, 04)
3. Hub importer + registry (05) — Network stream goes live
4. Roll out adapters across the network; QA harness (06); cutover (07)

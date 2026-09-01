# 02 — `newsmlg2-ts`: NewsML-G2 codec for TypeScript

## Purpose

Spoke sites are JS-built (Astro/11ty); the hub is Astro/TS. Both need to
read/write NewsML-G2 without Ruby. The Ruby gem (`lutaml/newsmlg2-ruby`)
stays the reference implementation; this is the network's TS codec.

## Repository

`lutaml/newsmlg2-ts` (sibling of the Ruby gem), MIT/BSD-2 like the gem,
published to npm as `newsmlg2-ts`.

## Scope (v1)

In: `NewsMessage`, `NewsItem`, `itemMeta` (guid, itemClass, provider,
versionCreated, embargo), `contentMeta` (headline, slugline, description,
by, located, subject, contentCreated), `contentSet` (inlineXML XHTML body;
`remoteContent` renditions incl. our `body.adoc` attachment), `rightsMeta`
basic, catalog/qcode resolution for the schemes we use (`ninat`, `nprov`,
`mediatype`, `drolg` if needed).

Out (v1): PackageItem, ConceptItem, KnowledgeItem, PlanningItem, hop
history, full XSD validation (CI-only, see below).

## Design rules

- **Declarative mappings.** Element/attribute tables (name, type,
  cardinality, wire name) drive one generic codec (parse + serialize).
  No per-class hand-rolled `toXml`/`fromXml` — same principle as
  lutaml-model's mapping blocks. Adding an element = adding a table row.
- **Typed models.** Plain TS interfaces generated from the tables;
  consumers never touch XML strings.
- **Catalogs.** The IPTC catalogs the network uses are vendored as JSON
  (converted once from the Ruby gem's vendored catalogs) so qcode ⇄ URI
  resolution is offline and deterministic.
- **No network, no side effects.** Pure library; no fs writes, no fetch.

## API sketch

```ts
import { parseNewsMessage, buildNewsItem, resolveQcode } from 'newsmlg2-ts'

const msg = parseNewsMessage(xml)              // NewsMessage
const item = buildNewsItem({ guid, lang, headline, bodyXhtml, renditions: [{ href: 'body.adoc', mimetype: 'text/asciidoc' }], provider: 'nprov:metanorma' })
const xml = msg.toXml()                        // canonical pretty XML
resolveQcode('ninat:text', msg)                // URI via vendored catalog
```

## Conformance (the pin between TS and Ruby)

1. IPTC official examples subset (vendored CC-BY fixtures, same files the
   Ruby gem vendors) — parse-only round-trip assertions.
2. **Golden files from the Ruby gem**: the wire publisher's `newsml.xml`
   output (already XSD-valid 2.35) is committed as fixtures; the TS parser
   must read them byte-semantically; TS-built documents must validate
   against the same XSD in CI (`libxmljs` or a maintained XSD runner).
3. Property tests: random field subsets → build → parse → deep-equal.

## Sizing

~3–5 focused days: codec + tables (1.5d), catalogs JSON (0.5d), conformance
suite + CI (1d), docs + npm publish (0.5–1d).

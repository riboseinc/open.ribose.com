# 03 — Wire: publisher

Status: DONE (implemented + specs green; publish/ generated)

Objective: Deterministic publish step producing the static news files:
news.json index, per-article folders (item.yaml, body.adoc, media/),
feed.json (ninjs), feed.xml (Atom). Clock injected (`now:`) for
testability. Embargoed/draft items excluded. Index and feed entries are
lutaml-models too (IndexEntry, NinjsItem) — projections are models,
not ad-hoc hashes.

Acceptance: publisher output layout matches wire/README.adoc contract.

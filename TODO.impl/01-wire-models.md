# 01 — Wire: Ruby models gem

Status: DONE (implemented + specs green)

Objective: Implement the NewsItem interchange model with lutaml-model only
(no hand-rolled serialization), matching models/*.lml.

- lib/wire.rb defines autoloads for immediate children; each namespace
  file defines its own children (lazy, no require_relative).
- All (de)serialization via `yaml`/`json` mapping blocks.
- Supporting classes: Dateline, Origin, BodySource, MediaAsset,
  MediaRendition, RelatedLink, Author, MediaContact, Rights,
  Timestamps, BoilerplateRef.

Acceptance: `bundle exec rspec` green; sample item round-trips.

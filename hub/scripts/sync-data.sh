#!/usr/bin/env bash
# Hub consumes registries; it never edits them (SSOT).
# Sources: ../portfolio (registry of record), ../wire (news source of record).
set -euo pipefail
cd "$(dirname "$0")/.."

PORTFOLIO="${PORTFOLIO_DIR:-../portfolio}"
WIRE="${WIRE_DIR:-../wire}"

mkdir -p data/wire public/news
cp "$PORTFOLIO"/platforms.yaml data/
cp "$PORTFOLIO"/domains.yaml data/
cp "$PORTFOLIO"/suites.yaml data/
cp "$WIRE"/registries/sites.yaml data/wire/
rm -rf data/wire/publish
cp -R "$WIRE"/publish data/wire/publish
# Feeds (/news-data/*, /news/feed.xml) are generated endpoints built from
# the site's news stream — they no longer mirror the wire publish output
# (which may be empty between wire releases).

cat > data/PROVENANCE.md <<PROV
# Data provenance

Copied by scripts/sync-data.sh -- do not edit here.

- platforms.yaml, domains.yaml, suites.yaml from riboseinc/portfolio
- wire/* publish output and sites registry from riboseinc/wire
- feeds under /news-data/ and /news/feed.xml are hub-generated endpoints
- audiences.yaml is hub-owned site content (edited here)

Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
PROV

echo "data synced from $PORTFOLIO and $WIRE"

# 08 — Hub: i18n content + translation rollout

Status: PARTIALLY DONE — EN-only routes by design for now

Done: astro i18n config (en, fr, ja, zh-hant, zh-hans), UI dictionary
(src/lib/i18n.ts) with all five locales, locale switcher hook,
zh-hant post archive live under /news/zh-hant/ with lang attributes
(migrated verbatim), OpenCC conversion noted for zh-hans derivation.

Decision: localized route trees for the marketing pages are NOT generated
until translated copy exists -- generating five identical English trees
would create duplicate-content SEO harm. When translations land, generate
/{locale}/ routes from the same registry data and add per-locale hreflang
alternates (BaseLayout already reserves x-default).

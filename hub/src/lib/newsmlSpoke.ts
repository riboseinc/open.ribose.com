// Pull-based spoke import (TODO.import-network/05): reads the NewsML-G2
// feeds declared in the wire sites registry, cache-first, and projects
// spoke articles onto the hub's news stream. The hub never writes back.
import { parse as parseYaml } from 'yaml'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { parseNewsMessage, parseNewsItem } from 'newsmlg2-ts'

interface SpokeSite { id: string; name: string; url: string; newsml?: string }

const registryRaw = import.meta.glob('../../data/wire/sites.yaml', {
  eager: true, import: 'default', query: '?raw',
}) as Record<string, string>

const spokeSites = (): SpokeSite[] => {
  const raw = Object.values(registryRaw)[0] ?? ''
  const sites = (parseYaml(raw) as { sites?: SpokeSite[] }).sites ?? []
  return sites.filter((s) => s.newsml)
}

const CACHE_ROOT = join(process.cwd(), '.wire-cache', 'newsml')

// Cache-first fetch: refresh over HTTP when possible, fall back to the
// cache when the spoke is unreachable, and never fail the build.
const fetchText = async (url: string, spokeId: string, rel: string): Promise<string | null> => {
  const cacheFile = join(CACHE_ROOT, spokeId, rel)
  let cached: string | null = null
  if (existsSync(cacheFile)) cached = readFileSync(cacheFile, 'utf8')
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${res.status}`)
    const text = await res.text()
    mkdirSync(dirname(cacheFile), { recursive: true })
    writeFileSync(cacheFile, text)
    return text
  } catch {
    if (cached) {
      console.warn(`[spoke] ${spokeId}: using cached ${rel} (fetch failed)`)
      return cached
    }
    console.warn(`[spoke] ${spokeId}: no cache and fetch failed for ${rel}; skipping`)
    return null
  }
}

export interface SpokeArticle {
  urn: string
  href: string
  date: string
  title: string
  description: string
  by: string
  origin: string
  canonical: string
  bodyXhtml: string
}

const stripHtmlWrapper = (xhtml: string): string =>
  xhtml.replace(/^\s*<html[^>]*>/, '').replace(/<\/html>\s*$/, '').trim()

export const spokeArticles = async (): Promise<SpokeArticle[]> => {
  const out: SpokeArticle[] = []
  for (const site of spokeSites()) {
    const indexXml = await fetchText(site.newsml!, site.id, 'newsml.xml')
    if (!indexXml) continue
    let items
    try {
      items = parseNewsMessage(indexXml).items
    } catch (e) {
      console.warn(`[spoke] ${site.id}: index parse failed: ${e}`)
      continue
    }
    for (const item of items) {
      if (!item.itemMeta.guid || item.itemMeta.pubStatus === 'withdrawn') continue
      const seg = item.itemMeta.guid.replace(/^urn:ribose:news:/, '').split(':')
      // urn:ribose:news:YYYY-MM-DD:<spoke>:<slug>
      const [date, , slug] = seg
      if (!date || !slug) continue
      const dirRel = `articles/${date}-${slug}`
      const itemXml = await fetchText(`${site.url}/news-data/${dirRel}/newsml.xml`, site.id, `${dirRel}/newsml.xml`)
      if (!itemXml) continue
      let full
      try {
        full = parseNewsItem(itemXml)
      } catch {
        continue
      }
      let bodyXhtml = full.contentMeta?.bodyXhtml ? stripHtmlWrapper(full.contentMeta.bodyXhtml) : ''
      // Spoke bodies use spoke-relative links; point them at the spoke origin
      bodyXhtml = bodyXhtml
        .replace(/(href|src)="\/(?!\/)/g, `$1="${site.url}/`)
      if (!bodyXhtml) continue
      out.push({
        urn: item.itemMeta.guid,
        href: `/news/${seg.join('-')}`,
        date,
        title: full.contentMeta?.headline ?? item.contentMeta?.headline ?? slug,
        description: full.contentMeta?.description ?? '',
        by: full.contentMeta?.by ?? site.name,
        origin: site.name,
        canonical: full.itemMeta.canonical ?? `${site.url}/blog/${date}-${slug}`,
        bodyXhtml,
      })
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date))
}

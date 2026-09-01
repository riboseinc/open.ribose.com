import { parse as parseYaml } from 'yaml'
import indexRaw from '../../data/wire/publish/news.json?raw'

// The wire reader contract. LocalAdapter consumes the synced publish
// output inlined at build time; the HTTP adapter at cutover implements
// the same interface against the live news host -- pages never change.
export interface WireArticle {
  id: string; version: number; status: string; headline: string
  language: string; originSite: string; canonical: string; path: string
  published: string | null; subjects: string[]; topics: string[]
}
export interface WireArticleFull extends WireArticle {
  subheadline?: string
  bodyAdoc: string
  authors: { name: string }[]
  media: { id: string; href: string; credit?: string; alt?: string }[]
  dateline?: { place?: string; country?: string; date?: string }
}
export interface WireReader {
  index(): WireArticle[]
  article(entry: WireArticle): WireArticleFull
}

const itemYamls = import.meta.glob('../../data/wire/publish/articles/**/item.yaml', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>
const bodyAdocs = import.meta.glob('../../data/wire/publish/articles/**/body.adoc', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>

const findKey = (map: Record<string, string>, suffix: string): string | undefined =>
  Object.keys(map).find((key) => key.includes(suffix))

export class LocalWireReader implements WireReader {
  index(): WireArticle[] {
    const parsed = JSON.parse(indexRaw) as { generatedAt: string; articles: WireArticle[] }
    return parsed.articles
  }

  article(entry: WireArticle): WireArticleFull {
    const itemKey = findKey(itemYamls, entry.path)
    const bodyKey = findKey(bodyAdocs, entry.path)
    if (!itemKey || !bodyKey) throw new Error(`wire article files missing for ${entry.id}`)
    const envelope = parseYaml(itemYamls[itemKey]) as any
    return {
      ...entry,
      subheadline: envelope.subheadline?.content,
      bodyAdoc: bodyAdocs[bodyKey],
      authors: envelope.authors ?? [],
      media: (envelope.media ?? []).map((m: any) => ({
        id: m.id,
        href: `/news-data/${entry.path.replace(/\/$/, '')}/${m.href}`.replace(/\/+/g, '/'),
        credit: m.credit, alt: m.altText?.content,
      })),
      dateline: envelope.dateline,
    }
  }
}

export const wire = (): WireReader => new LocalWireReader()

// HTTP reader for cutover: downloads the published news files over
// plain HTTPS, caching into the consumer's working directory (the
// package never writes into itself). Pages switch to it by selecting
// `WIRE_SOURCE=<url>` at build time; rendering code is unchanged.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export class HttpWireReader {
  readonly #base: string
  readonly #cache: string

  constructor(baseUrl: string, cacheDir = '.wire-cache') {
    this.#base = baseUrl.replace(/\/$/, '')
    this.#cache = path.join(process.cwd(), cacheDir)
  }

  async #fetchCached(rel: string): Promise<string> {
    const cacheFile = path.join(this.#cache, rel.replace(/^\//, '').replace(/\//g, '__'))
    if (fs.existsSync(cacheFile)) {
      return fs.readFileSync(cacheFile, 'utf8')
    }
    const response = await fetch(`${this.#base}/${rel.replace(/^\//, '')}`)
    if (!response.ok) throw new Error(`wire fetch failed: ${rel}: ${response.status}`)
    const body = await response.text()
    fs.mkdirSync(this.#cache, { recursive: true })
    fs.writeFileSync(cacheFile, body)
    return body
  }

  async index(): Promise<WireArticle[]> {
    const parsed = JSON.parse(await this.#fetchCached('/news.json')) as { articles: WireArticle[] }
    return parsed.articles
  }

  async article(entry: WireArticle): Promise<WireArticleFull> {
    const envelope = parseYaml(await this.#fetchCached(`/${entry.path}item.yaml`)) as any
    const bodyAdoc = await this.#fetchCached(`/${entry.path}body.adoc`)
    return {
      ...entry,
      subheadline: envelope.subheadline?.content,
      bodyAdoc,
      authors: envelope.authors ?? [],
      media: (envelope.media ?? []).map((m: any) => ({
        id: m.id, href: `${this.#base}/${entry.path}${m.href}`, credit: m.credit, alt: m.altText?.content,
      })),
      dateline: envelope.dateline,
    }
  }
}

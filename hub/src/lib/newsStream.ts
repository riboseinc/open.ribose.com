// The site's merged, publishable news stream: network (wire) articles plus
// corporate posts. Feeds and listings derive from this one source.
import { wire } from './wire'
import { newsPosts } from './posts'

export interface StreamItem {
  urn: string            // guid, e.g. urn:ribose:news:2023-04-25:press-cna
  href: string           // site path
  date: string           // ISO date
  title: string
  description: string
  by: string
  origin: string         // label, e.g. ribose.com / metanorma.org
  canonical: string      // absolute canonical URL
}

export const SITE = 'https://www.ribose.com'

export const newsStream = (): StreamItem[] => {
  const wireItems: StreamItem[] = wire().index().map((a) => ({
    urn: a.id,
    href: `/news/${a.id.replace(/^urn:ribose:news:/, '').replace(/:/g, '-')}`,
    date: a.published ? a.published.slice(0, 10) : '',
    title: a.headline,
    description: a.subheadline ?? '',
    by: a.authors?.map((x) => x.name).join(', ') ?? 'Ribose',
    origin: a.originSite.replace(/-/g, '.'),
    canonical: a.canonical ?? SITE,
  }))
  const postItems: StreamItem[] = newsPosts().map((p) => ({
    urn: `urn:ribose:news:${p.slug}`,
    href: `/news/${p.slug}`,
    date: p.date,
    title: p.title,
    description: p.excerpt ?? '',
    by: 'Ribose',
    origin: 'ribose.com',
    canonical: `${SITE}/news/${p.slug}`,
  }))
  return [...wireItems, ...postItems].sort((a, b) => b.date.localeCompare(a.date))
}

export const escapeXml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export interface SearchHit {
  title: string
  url: string
  section: string
}

// Pagefind assets exist only after the post-build indexing step, so the
// specifier is assembled at runtime — no bundler can try to resolve it.
const pagefindUrl = ['/pagefind', 'pagefind.js'].join('/')
let pagefind: any

export async function loadPagefind(): Promise<any> {
  if (pagefind !== undefined) return pagefind
  try {
    pagefind = await import(/* @vite-ignore */ pagefindUrl)
  } catch {
    pagefind = null
  }
  return pagefind
}

const SECTION_LABELS: Record<string, string> = {
  '': 'Home',
  platforms: 'Platform',
  technologies: 'Technology',
  news: 'News',
  company: 'Company',
  customers: 'Customers',
  security: 'Security',
  for: 'Audience',
  legal: 'Legal',
}

const sectionOf = (url: string): string => {
  const seg = url.replace(/(^\/|\/$)/g, '').split('/')[0]
  return SECTION_LABELS[seg] ?? 'Page'
}

export async function search(query: string, limit = 8): Promise<SearchHit[]> {
  const pf = await loadPagefind()
  if (!pf || !query.trim()) return []
  const results = await pf.search(query)
  const hits = await Promise.all(results.results.slice(0, limit).map((r: any) => r.data()))
  return hits.map((h: any) => ({
    title: h.meta?.title || decodeURIComponent(h.url),
    url: h.url,
    section: sectionOf(h.url),
  }))
}

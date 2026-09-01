import { parse as parseYaml } from 'yaml'

// Security advisories moved verbatim from the Jekyll _advisories tree.
export interface Advisory {
  slug: string; id: string; title: string; date: string
  cveId?: string; excerpt?: string; bodyAdoc: string
}

const files = import.meta.glob('../content/advisories/*.adoc', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export const advisories = (): Advisory[] =>
  Object.entries(files).map(([key, raw]) => {
    const match = raw.match(FM_RE)
    const fm = match ? (parseYaml(match[1]) ?? {}) : {}
    return {
      slug: key.split('/').pop()!.replace(/\.adoc$/, ''),
      id: String(fm.id ?? fm.title ?? key),
      title: String(fm.title ?? key),
      date: String(fm.date ?? '').slice(0, 10),
      cveId: fm.cve_id as string | undefined,
      excerpt: fm.excerpt as string | undefined,
      bodyAdoc: match ? raw.slice(match[0].length) : raw,
    }
  }).sort((a, b) => b.date.localeCompare(a.date))

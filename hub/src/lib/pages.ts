import { parse as parseYaml } from 'yaml'

// Legal/security pages moved verbatim from the Jekyll _pages tree.
// AsciiDoc bodies render unchanged; Jekyll-only frontmatter is ignored.
export interface LegalPage {
  slug: string
  title: string
  description?: string
  revisionDate?: string
  bodyAdoc: string
}

const files = import.meta.glob('../content/pages/*.adoc', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export const legalPages = (): LegalPage[] =>
  Object.entries(files).map(([key, raw]) => {
    const match = raw.match(FM_RE)
    const fm = match ? (parseYaml(match[1]) ?? {}) : {}
    const permalink = typeof fm.permalink === 'string' ? fm.permalink.replace(/^\//, '').replace(/\/$/, '') : null
    return {
      slug: permalink ?? key.split('/').pop()!.replace(/\.adoc$/, ''),
      title: String(fm.title ?? key),
      description: fm.description as string | undefined,
      revisionDate: fm.revision_date as string | undefined,
      bodyAdoc: match ? raw.slice(match[0].length) : raw,
    }
  })

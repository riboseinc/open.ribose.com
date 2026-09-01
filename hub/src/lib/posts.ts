import { parse as parseYaml } from 'yaml'

// Migrated posts: files moved verbatim from the Jekyll _posts tree
// (see TODO.impl/09). Only parsing happens here -- content is never
// rewritten. AsciiDoc rendering happens in the page via asciidoctor.
export interface Post {
  slug: string            // e.g. 2013-10-07-ribose-joins-calendaring-organization-calconnect
  date: string            // ISO date from the filename
  title: string
  lang: 'en' | 'zh-hant'
  archived?: boolean      // collaboration-platform era post (2012–2023)
  excerpt?: string
  categories: string[]
  bodyAdoc: string
}

const enFiles = import.meta.glob('../content/posts/*.adoc', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>
const zhFiles = import.meta.glob('../content/posts-zh-hant/*.adoc', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

function parsePost(fileKey: string, raw: string, lang: 'en' | 'zh-hant'): Post {
  const match = raw.match(FM_RE)
  const fm = match ? (parseYaml(match[1]) ?? {}) : {}
  const body = match ? raw.slice(match[0].length) : raw
  const base = fileKey.split('/').pop()!.replace(/\.adoc$/, '')
  const date = base.slice(0, 10)
  const slugTitle = base.slice(11)
  return {
    slug: `${date}-${slugTitle}`,
    date,
    title: (fm.title as string) ?? slugTitle,
    lang,
    archived: fm.archived === true,
    excerpt: fm.excerpt as string | undefined,
    categories: (fm.categories as string[]) ?? [],
    bodyAdoc: body,
  }
}

const parseGroup = (files: Record<string, string>, lang: 'en' | 'zh-hant'): Post[] =>
  Object.entries(files).map(([key, raw]) => parsePost(key, raw, lang))

export const posts: readonly Post[] = Object.freeze(
  [...parseGroup(enFiles, 'en'), ...parseGroup(zhFiles, 'zh-hant')]
    .sort((a, b) => b.date.localeCompare(a.date)),
)

export const englishPosts = (): Post[] => posts.filter((p) => p.lang === 'en')
export const newsPosts = (): Post[] => posts.filter((p) => p.lang === 'en' && !p.archived)
export const archivePosts = (): Post[] => posts.filter((p) => p.lang === 'en' && !!p.archived)
export const zhVariantOf = (post: Post): Post | undefined =>
  posts.find((p) => p.lang === 'zh-hant' && p.slug === post.slug)

// ninjs (IPTC News in JSON) projection of the news stream.
import { newsStream, SITE } from '../../lib/newsStream'
import type { APIRoute } from 'astro'

export const GET: APIRoute = () => {
  const body = JSON.stringify({
    uri: SITE,
    items: newsStream().map((i) => ({
      uri: i.canonical,
      type: 'text',
      headline: i.title,
      description: i.description,
      language: 'en',
      by: i.by,
      version: 1,
      versioncreated: i.date,
      subjectcodes: [] as string[],
    })),
  }, null, 2)
  return new Response(body + '\n', { headers: { 'Content-Type': 'application/json' } })
}

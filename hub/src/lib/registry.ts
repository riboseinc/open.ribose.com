import { parse as parseYaml } from 'yaml'
import suitesRaw from '../../data/suites.yaml?raw'
import domainsRaw from '../../data/domains.yaml?raw'
import platformsRaw from '../../data/platforms.yaml?raw'

export interface Software { name: string; note?: string }
export interface Suite {
  id: string; name: string; domain: string; org: string
  site?: string; tagline: string; powers?: string[]; uses?: string[]
  curated?: boolean; softwares: Software[]
}
export interface Domain { id: string; name: string; description: string }
export interface PlatformEdition { id: string; name: string; description: string }
export interface Platform {
  id: string; name: string; vendor?: string; tagline: string; story: string
  core?: string; suites: string[]; builds_on?: string; editions?: PlatformEdition[]
}

// Registries are inlined at build time from the synced data directory
// (SSOT: riboseinc/portfolio; see scripts/sync-data.sh).
const suitesFile = parseYaml(suitesRaw) as { suites: Suite[] }
const domainsFile = parseYaml(domainsRaw) as { domains: Domain[] }
const platformsFile = parseYaml(platformsRaw) as { platforms: Platform[] }

export const suites: readonly Suite[] = Object.freeze(suitesFile.suites)
export const domains: readonly Domain[] = Object.freeze(domainsFile.domains)
export const platforms: readonly Platform[] = Object.freeze(platformsFile.platforms)

export const suitesByDomain = (): Map<string, Suite[]> => {
  const map = new Map<string, Suite[]>()
  for (const suite of suites) {
    const bucket = map.get(suite.domain) ?? []
    bucket.push(suite)
    map.set(suite.domain, bucket)
  }
  return map
}

export const suiteById = (id: string): Suite | undefined =>
  suites.find((s) => s.id === id)

export const platformById = (id: string): Platform | undefined =>
  platforms.find((p) => p.id === id)

export const suitesOfPlatform = (platform: Platform): Suite[] =>
  platform.suites.map((id) => suiteById(id)).filter((s): s is Suite => Boolean(s))

export const platformConsumerSuites = (suite: Suite): Platform[] =>
  platforms.filter((p) => p.suites.includes(suite.id))

export const domainById = (id: string): Domain | undefined =>
  domains.find((d) => d.id === id)

export const githubOrgs = (): string[] => {
  const orgs = new Set(suites.map((s) => s.org))
  return [...orgs].sort()
}

export const stats = () => ({
  suites: suites.length,
  domains: domains.length,
  platforms: platforms.length,
  softwares: suites.reduce((n, s) => n + s.softwares.length, 0),
})

// Product identity for news chips: maps each news origin to its product
// logo and display name. The SSOT for spoke origins is the wire sites
// registry; this module adds the visual identity layer.
export interface ProductIdentity {
  name: string
  logo: string           // light-mode logo path
  logoDark?: string      // dark-mode variant
}

const IDENTITIES: Record<string, ProductIdentity> = {
  'Metanorma': {
    name: 'Metanorma',
    logo: '/suites/metanorma/symbol.svg',
    logoDark: '/suites/metanorma/symbol-dark.svg',
  },
  'PubID': {
    name: 'PubID',
    logo: '/logos/pubid.svg',
  },
  'Ribose': {
    name: 'Ribose',
    logo: '/brand/ribose-r.svg',
  },
}

export const identityFor = (origin: string): ProductIdentity | undefined =>
  IDENTITIES[origin]

// All products with logos (for the products page/filter)
export const PRODUCTS: Record<string, ProductIdentity> = IDENTITIES

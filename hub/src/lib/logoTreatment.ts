// Per-logo display treatments, verified by rendering every logo on light
// (#fcfcfa) and dark (#0d1117) backgrounds and measuring visibility.
// Files not listed here are legible in both modes as-is.

export interface LogoTreatment {
  // White artwork, invisible on paper: sit on a small ink chip in light mode.
  // Dark-mode variants for all other logos are real files (logo_dark).
  lightInk?: boolean
  // Marks that read better slightly larger than the wall default
  large?: boolean
}

// OGC's mark measures legible on both backgrounds; NGI's white artwork
// needs the light-mode ink chip until a light variant exists.
const LIGHT_INK = new Set([
  'ngi-zero-pet.svg',
  'expresslang.svg',
])

const LARGE = new Set(['thunderbird.svg', 'ogc.svg'])

export const treatmentFor = (file: string): LogoTreatment => ({
  lightInk: LIGHT_INK.has(file),
  large: LARGE.has(file),
})

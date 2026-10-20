import { glyphs, type GlyphName } from './glyphs.ts'

// Everything on a key is drawn here as one 144 × 144 SVG, so each key can show its live state:
//
//   ┌──────────────┐
//   │ LABEL        │  small caption
//   │    icon      │  icon, or a large value such as "3/12"
//   │   detail     │  one line of status, e.g. the name being spoken
//   │ ▓▓▓▓▓░░░░░░  │  optional progress bar
//   └──────────────┘

export const colors = {
  idle: '#1f2937',
  text: '#f9fafb',
  muted: '#9ca3af',
  disabled: '#4b5563',
  offline: '#111827',
  red: '#dc2626',
  blue: '#2563eb',
  green: '#16a34a',
  amber: '#d97706',
  purple: '#7c3aed',
  teal: '#0d9488'
}

export interface KeyView {
  label: string
  icon?: GlyphName
  value?: string
  detail?: string
  // 0..1
  progress?: number
  background?: string
  // Coloured frame around the key, e.g. to show the screens are blacked out
  outline?: string
  disabled?: boolean
  // Picture filling the key instead of the label and icon (data URL), e.g. the app icon
  image?: string
  // Colour of a status dot drawn before the detail text, with image keys
  status?: string
  // Background fades between its colour and a darker shade, e.g. while audio is playing
  pulse?: boolean
  // 16:9 screen preview (data URL) shown across the key, between the label and the detail
  preview?: string
  // Preview is stretched to fill the key below the label, instead of fitting with a detail
  previewFill?: boolean
  // Width / height of the preview image
  previewAspect?: number
  // Colour of a strip behind the label of a preview key, e.g. red for the frozen slide
  labelBackground?: string
  // Font size of the label, when it should stand out more than the usual caption
  labelSize?: number
  // Scroll the detail text when it is too long to fit, instead of cutting it off
  scrollDetail?: boolean
}

// Position of the key's animations, for keys that have them
export interface Frame {
  // Pulse position, 0..1 (0 = full colour, 1 = darkest)
  pulse?: number
  // Milliseconds since the scrolling detail text first appeared
  scrollTime?: number
}

// Characters of detail text that fit across a key
const DETAIL_CHARS = 14
// Scrolling: hold the start, move one character at a time, hold the end, start over
const SCROLL_HOLD = 1500
const SCROLL_STEP = 200

const cleanText = (text: string): string => text.replace(/\s+/g, ' ').trim()

const scrolls = (view: KeyView): boolean =>
  !!view.scrollDetail && cleanText(view.detail ?? '').length > DETAIL_CHARS

// Whether the key needs redrawing over time
export const isAnimated = (view: KeyView): boolean => !!view.pulse || scrolls(view)

// First character shown of a scrolling text `length` characters long, `time` ms after it appeared
function scrollOffset(length: number, time: number): number {
  const steps = length - DETAIL_CHARS
  const cycle = SCROLL_HOLD + steps * SCROLL_STEP + SCROLL_HOLD
  const t = time % cycle
  if (t < SCROLL_HOLD) return 0
  return Math.min(steps, Math.floor((t - SCROLL_HOLD) / SCROLL_STEP) + 1)
}

// Darken a #rrggbb colour by `amount` (0..1)
function darken(hex: string, amount: number): string {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `#${channels
    .map((c) =>
      Math.round(c * (1 - amount))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`
}

const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif'

const escape = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Rough fit: shorten text that would run past the edge of the key
export function fit(text: string, maxChars: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > maxChars ? `${clean.slice(0, maxChars - 1).trimEnd()}…` : clean
}

const text = (value: string, y: number, size: number, color: string, weight = 'bold'): string =>
  `<text x="72" y="${y}" text-anchor="middle" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${color}">${escape(value)}</text>`

// Pick a font size that fits the value text across the key
const valueSize = (value: string, hasDetail: boolean): number => {
  const max = hasDetail ? 44 : 52
  return Math.min(max, Math.floor(250 / Math.max(value.length, 1)))
}

export function renderKey(view: KeyView, frame: Frame = {}): string {
  const base = view.disabled ? colors.offline : (view.background ?? colors.idle)
  const background = view.pulse ? darken(base, (frame.pulse ?? 0) * 0.55) : base
  const foreground = view.disabled ? colors.disabled : colors.text
  const caption = view.disabled ? colors.disabled : view.background ? '#ffffffcc' : colors.muted
  const parts: string[] = [`<rect width="144" height="144" fill="${background}"/>`]

  if (view.outline) {
    parts.push(
      `<rect x="4" y="4" width="136" height="136" rx="10" fill="none" stroke="${view.outline}" stroke-width="8"/>`
    )
  }

  if (view.image) return svgUrl(parts.concat(imageKeyParts(view)))
  if (view.preview) return svgUrl(parts.concat(previewKeyParts(view, caption, foreground)))

  const label = fit(view.label.toUpperCase(), 14)
  parts.push(text(label, 30, view.labelSize ?? (label.length > 11 ? 14 : 17), caption))

  const hasDetail = !!view.detail
  const centerY = hasDetail ? 72 : 82

  if (view.value !== undefined) {
    const size = valueSize(view.value, hasDetail)
    parts.push(text(view.value, centerY + size * 0.36, size, foreground))
  } else if (view.icon) {
    const iconSize = hasDetail ? 48 : 60
    const scale = iconSize / 48
    parts.push(
      `<g transform="translate(${72 - iconSize / 2} ${centerY - iconSize / 2}) scale(${scale})">${glyphs[view.icon](foreground)}</g>`
    )
  }

  if (view.detail) {
    const detail = cleanText(view.detail)
    const shown = scrolls(view)
      ? detail.slice(scrollOffset(detail.length, frame.scrollTime ?? 0)).slice(0, DETAIL_CHARS)
      : fit(detail, DETAIL_CHARS)
    parts.push(text(shown, view.progress !== undefined ? 116 : 122, 17, foreground, '600'))
  }

  if (view.progress !== undefined) {
    const width = Math.round(112 * Math.min(Math.max(view.progress, 0), 1))
    parts.push(`<rect x="16" y="126" width="112" height="8" rx="4" fill="#ffffff33"/>`)
    if (width > 0) {
      parts.push(`<rect x="16" y="126" width="${width}" height="8" rx="4" fill="${foreground}"/>`)
    }
  }

  return svgUrl(parts)
}

const svgUrl = (parts: string[]): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="144" height="144" viewBox="0 0 144 144">${parts.join('')}</svg>`
  return `data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}`
}

// Picture in the upper part of the key, with one line of status beneath it
function imageKeyParts(view: KeyView): string[] {
  const parts = [
    `<image x="22" y="4" width="100" height="100" href="${view.image}" xlink:href="${view.image}" opacity="${view.disabled ? 0.45 : 1}"/>`
  ]
  if (view.detail) {
    const detail = fit(view.detail, 12)
    const color = view.disabled ? colors.muted : colors.text
    if (view.status) {
      // Centre the dot and text together; about 9.5px per bold character at this size
      const width = 18 + detail.length * 9.5
      const x = 72 - width / 2
      parts.push(`<circle cx="${x + 6}" cy="124" r="6" fill="${view.status}"/>`)
      parts.push(
        `<text x="${x + 18}" y="130" font-family="${FONT}" font-size="17" font-weight="bold" fill="${color}">${escape(detail)}</text>`
      )
    } else {
      parts.push(text(detail, 130, 17, color))
    }
  }
  return parts
}

// The preview image. Placed by position and size alone, as Stream Deck's SVG renderer ignores
// preserveAspectRatio. To fill, it is stretched across the whole space below the label; to fit, it
// is as wide as the key at its own aspect ratio, centred between the label and the detail.
function previewImage(view: KeyView): string {
  const aspect = view.previewAspect || 16 / 9
  const [x, y, width, height] = view.previewFill
    ? [0, 33, 144, 111]
    : [0, 33 + (81 - 144 / aspect) / 2, 144, 144 / aspect]
  const r = (n: number): string => n.toFixed(1)
  return `<image x="${r(x)}" y="${r(y)}" width="${r(width)}" height="${r(height)}" preserveAspectRatio="none" href="${view.preview}" xlink:href="${view.preview}"/>`
}

// Screen preview filling the width of the key, with the label above and the detail below
function previewKeyParts(view: KeyView, caption: string, foreground: string): string[] {
  const parts = [
    ...(view.labelBackground
      ? [`<rect width="144" height="33" fill="${view.labelBackground}"/>`]
      : []),
    text(fit(view.label.toUpperCase(), 16), 24, 15, view.labelBackground ? colors.text : caption),
    previewImage(view)
  ]
  if (view.detail && !view.previewFill) {
    parts.push(text(fit(view.detail, 14), 136, 16, foreground, '600'))
  }
  return parts
}

// Small icon for the dial touch strip
export function renderGlyph(name: GlyphName, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">${glyphs[name](color)}</svg>`
  return `data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}`
}

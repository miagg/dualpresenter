// Icons drawn on a 48 × 48 grid. Each returns SVG markup in the given colour. This file is also
// used by scripts/icons.ts to produce the static icons listed in the manifest, so it must not
// import anything.

export type GlyphName =
  | 'play'
  | 'stop'
  | 'pause'
  | 'next'
  | 'prev'
  | 'skipNext'
  | 'skipPrev'
  | 'blackout'
  | 'monitor'
  | 'freeze'
  | 'flip'
  | 'speaker'
  | 'speakerOff'
  | 'auto'
  | 'reload'
  | 'pageNext'
  | 'pagePrev'
  | 'plus'
  | 'minus'
  | 'slides'
  | 'goto'
  | 'dial'
  | 'edit'
  | 'launch'
  | 'more'
  | 'folder'
  | 'close'
  | 'gear'
  | 'transition'
  | 'numpad'
  | 'search'
  | 'backspace'
  | 'loop'

const stroke = (c: string, w = 4): string =>
  `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`

export const glyphs: Record<GlyphName, (c: string) => string> = {
  play: (c) => `<path d="M15 9 L38 24 L15 39 Z" fill="${c}"/>`,
  stop: (c) => `<rect x="12" y="12" width="24" height="24" rx="3" fill="${c}"/>`,
  pause: (c) =>
    `<rect x="12" y="10" width="9" height="28" rx="2" fill="${c}"/><rect x="27" y="10" width="9" height="28" rx="2" fill="${c}"/>`,
  next: (c) => `<path d="M17 8 L33 24 L17 40" ${stroke(c, 6)}/>`,
  prev: (c) => `<path d="M31 8 L15 24 L31 40" ${stroke(c, 6)}/>`,
  skipNext: (c) =>
    `<path d="M10 10 L30 24 L10 38 Z" fill="${c}"/><rect x="32" y="10" width="6" height="28" rx="2" fill="${c}"/>`,
  skipPrev: (c) =>
    `<path d="M38 10 L18 24 L38 38 Z" fill="${c}"/><rect x="10" y="10" width="6" height="28" rx="2" fill="${c}"/>`,
  blackout: (c) =>
    `<rect x="5" y="8" width="38" height="26" rx="3" fill="${c}"/><path d="M18 42 H30 M24 34 V42" ${stroke(c)}/>`,
  monitor: (c) =>
    `<rect x="6" y="9" width="36" height="24" rx="3" ${stroke(c)}/><path d="M18 41 H30 M24 33 V41" ${stroke(c)}/>`,
  freeze: (c) =>
    `<path d="M24 4 V44 M6.7 14 L41.3 34 M6.7 34 L41.3 14 M18 7 L24 12 L30 7 M18 41 L24 36 L30 41" ${stroke(c, 3.5)}/>`,
  flip: (c) =>
    `<path d="M8 16 H38 M30 8 L38 16 L30 24 M40 32 H10 M18 24 L10 32 L18 40" ${stroke(c)}/>`,
  speaker: (c) =>
    `<path d="M6 18 H14 L25 9 V39 L14 30 H6 Z" fill="${c}"/><path d="M31 17 Q36 24 31 31 M36 11 Q45 24 36 37" ${stroke(c, 3.5)}/>`,
  speakerOff: (c) =>
    `<path d="M6 18 H14 L25 9 V39 L14 30 H6 Z" fill="${c}"/><path d="M31 18 L43 30 M43 18 L31 30" ${stroke(c, 3.5)}/>`,
  auto: (c) =>
    `<path d="M40 24 A16 16 0 1 1 33 10.8" ${stroke(c, 3.5)}/><path d="M33 4 V11 H40" ${stroke(c, 3.5)}/><path d="M17 32 L24 15 L31 32 M19.5 26 H28.5" ${stroke(c, 3.5)}/>`,
  reload: (c) =>
    `<path d="M39 24 A15 15 0 1 1 33.6 12.4" ${stroke(c)}/><path d="M34 3 V13 H24" ${stroke(c)}/>`,
  pageNext: (c) =>
    `<rect x="6" y="6" width="24" height="36" rx="3" ${stroke(c, 3.5)}/><path d="M28 24 H44 M37 17 L44 24 L37 31" ${stroke(c, 3.5)}/>`,
  pagePrev: (c) =>
    `<rect x="18" y="6" width="24" height="36" rx="3" ${stroke(c, 3.5)}/><path d="M20 24 H4 M11 17 L4 24 L11 31" ${stroke(c, 3.5)}/>`,
  plus: (c) => `<path d="M24 8 V40 M8 24 H40" ${stroke(c, 6)}/>`,
  minus: (c) => `<path d="M8 24 H40" ${stroke(c, 6)}/>`,
  slides: (c) =>
    `<rect x="4" y="12" width="32" height="24" rx="3" ${stroke(c, 3.5)}/><path d="M12 6 H41 A3 3 0 0 1 44 9 V30" ${stroke(c, 3.5)}/>`,
  goto: (c) =>
    `<rect x="4" y="10" width="28" height="28" rx="3" ${stroke(c, 3.5)}/><path d="M24 24 H44 M37 17 L44 24 L37 31" ${stroke(c, 3.5)}/>`,
  folder: (c) =>
    `<path d="M4 12 A3 3 0 0 1 7 9 H18 L22 14 H41 A3 3 0 0 1 44 17 V37 A3 3 0 0 1 41 40 H7 A3 3 0 0 1 4 37 Z" ${stroke(c, 3.5)}/>`,
  close: (c) =>
    `<path d="M8 4 H28 L38 14 V44 H8 Z" ${stroke(c, 3.5)}/><path d="M16 22 L30 36 M30 22 L16 36" ${stroke(c, 4)}/>`,
  search: (c) =>
    `<circle cx="20" cy="20" r="13" ${stroke(c, 4)}/><path d="M30 30 L43 43" ${stroke(c, 5)}/>`,
  numpad: (c) =>
    `<rect x="5" y="5" width="10" height="10" rx="2" fill="${c}"/><rect x="19" y="5" width="10" height="10" rx="2" fill="${c}"/><rect x="33" y="5" width="10" height="10" rx="2" fill="${c}"/><rect x="5" y="19" width="10" height="10" rx="2" fill="${c}"/><rect x="19" y="19" width="10" height="10" rx="2" fill="${c}"/><rect x="33" y="19" width="10" height="10" rx="2" fill="${c}"/><rect x="5" y="33" width="10" height="10" rx="2" fill="${c}"/><rect x="19" y="33" width="10" height="10" rx="2" fill="${c}"/><rect x="33" y="33" width="10" height="10" rx="2" fill="${c}"/>`,
  loop: (c) =>
    `<path d="M10 28 V20 A8 8 0 0 1 18 12 H38 M32 6 L38 12 L32 18 M38 20 V28 A8 8 0 0 1 30 36 H10 M16 30 L10 36 L16 42" ${stroke(c, 3.5)}/>`,
  backspace: (c) =>
    `<path d="M16 9 H42 A2 2 0 0 1 44 11 V37 A2 2 0 0 1 42 39 H16 L4 24 Z" ${stroke(c, 3.5)}/><path d="M22 18 L34 30 M34 18 L22 30" ${stroke(c, 3.5)}/>`,
  transition: (c) =>
    `<rect x="4" y="10" width="22" height="22" rx="3" ${stroke(c, 3.5)} stroke-dasharray="4 4"/><rect x="20" y="16" width="24" height="24" rx="3" fill="${c}"/>`,
  gear: (c) =>
    `<circle cx="24" cy="24" r="12" ${stroke(c, 4)}/><circle cx="24" cy="24" r="4.5" fill="${c}"/><path d="M37.0 24.0 L43.0 24.0 M33.2 33.2 L37.4 37.4 M24.0 37.0 L24.0 43.0 M14.8 33.2 L10.6 37.4 M11.0 24.0 L5.0 24.0 M14.8 14.8 L10.6 10.6 M24.0 11.0 L24.0 5.0 M33.2 14.8 L37.4 10.6" ${stroke(c, 6)}/>`,
  more: (c) =>
    `<circle cx="9" cy="24" r="5" fill="${c}"/><circle cx="24" cy="24" r="5" fill="${c}"/><circle cx="39" cy="24" r="5" fill="${c}"/>`,
  launch: (c) =>
    `<rect x="5" y="9" width="30" height="30" rx="4" ${stroke(c, 3.5)}/><path d="M24 24 L42 6 M30 6 H42 V18" ${stroke(c, 3.5)}/>`,
  edit: (c) =>
    `<rect x="4" y="6" width="30" height="36" rx="3" ${stroke(c, 3.5)}/><path d="M10 16 H28 M10 24 H22 M10 32 H16" ${stroke(c, 3)}/><path d="M40 14 L44 18 L28 34 L22 36 L24 30 Z" fill="${c}"/>`,
  dial: (c) =>
    `<circle cx="24" cy="24" r="17" ${stroke(c, 3.5)}/><path d="M24 24 L24 11" ${stroke(c, 4)}/>`
}

// Standalone SVG document for one glyph, for the manifest icons
export function glyphSvg(
  name: GlyphName,
  size: number,
  color: string,
  background?: string
): string {
  const bg = background ? `<rect width="48" height="48" fill="${background}"/>` : ''
  const pad = background ? 'translate(9.6 9.6) scale(0.6)' : 'translate(0 0)'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">${bg}<g transform="${pad}">${glyphs[name](color)}</g></svg>`
}

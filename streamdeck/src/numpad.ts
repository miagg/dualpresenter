// Slide number being typed on the numpad keys. Shared by all numpad keys; cleared after a jump,
// or when left untouched for a while so a half-typed number isn't used by mistake later.

const IDLE_CLEAR_DELAY = 15000

let value = ''
let idleTimer: ReturnType<typeof setTimeout> | null = null
let listener: () => void = () => undefined

export const numpad = {
  get value(): string {
    return value
  },

  set(next: string): void {
    value = next
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = value ? setTimeout(() => numpad.set(''), IDLE_CLEAR_DELAY) : null
    listener()
  },

  onChange(callback: () => void): void {
    listener = callback
  }
}

// Number typed after pressing `digit`. Starts a new number when the current one already has as
// many digits as the slide count, e.g. with 61 slides, "12" followed by 3 gives "3".
export function withDigit(digit: string, slideCount: number): string {
  const maxLength = String(slideCount).length
  const next = value.length >= maxLength ? digit : value + digit
  return next.replace(/^0+/, '') || ''
}

export const NAMES_PER_PAGE = 16

// When balancing, a last page with fewer names than this borrows from the page before it
const MIN_LAST_PAGE_NAMES = 3
// How many names the page before the last keeps when it gives names to the last page
const BALANCED_PAGE_NAMES = 13

/**
 * Number of names shown on each page. With `balance` enabled, a last page that would only
 * hold one or two names takes names from the previous page instead (e.g. 17 names become
 * 13 + 4 rather than 16 + 1).
 */
export function getNamesPageSizes(totalNames: number, balance = false): number[] {
  if (totalNames <= 0) return []

  const sizes: number[] = Array(Math.floor(totalNames / NAMES_PER_PAGE)).fill(NAMES_PER_PAGE)
  const remainder = totalNames % NAMES_PER_PAGE
  if (remainder > 0) sizes.push(remainder)

  if (balance && sizes.length > 1 && remainder > 0 && remainder < MIN_LAST_PAGE_NAMES) {
    sizes[sizes.length - 2] = BALANCED_PAGE_NAMES
    sizes[sizes.length - 1] = remainder + NAMES_PER_PAGE - BALANCED_PAGE_NAMES
  }

  return sizes
}

/**
 * Names shown on the given page
 */
export function paginateNames<T>(names: T[], page: number, balance = false): T[] {
  const sizes = getNamesPageSizes(names.length, balance)
  const start = sizes.slice(0, page).reduce((sum, size) => sum + size, 0)
  return names.slice(start, start + (sizes[page] ?? 0))
}

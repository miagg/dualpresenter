/**
 * Text normalization utilities for improved searching
 */

/**
 * Normalizes Greek text by removing accents and converting to lowercase
 * This allows for searching without needing to match accents exactly
 *
 * @param text The text to normalize
 * @returns Normalized text (lowercase with no accents)
 */
export function normalizeGreekText(text: string): string {
  if (!text) return ''

  // Convert to lowercase first
  const lowercased = text.toLowerCase()

  // Use Unicode normalization to decompose characters, then remove diacritics
  // NFD splits characters and their diacritics, then we remove the diacritical marks
  return lowercased.normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
}

/**
 * Normalizes any text for search purposes
 * Currently handles Greek character normalization
 *
 * @param text The original text
 * @returns Search-optimized text
 */
export function normalizeForSearch(text: string): string {
  if (!text) return ''
  return normalizeGreekText(text).trim()
}

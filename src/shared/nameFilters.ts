import { Name } from '../main/models/Name'
import { Card } from '../main/models/Card'
import { CardType } from '../main/enums/CardType'

/**
 * Filter names based on card properties (group, from, until, attending status)
 * This ensures consistent filtering logic across the application
 */
export function filterNamesForCard(names: Name[], card: Card): Name[] {
  // Only filter for Names cards
  if (!card.group || card.type !== CardType.Names) {
    return []
  }

  // Start with names in the right group and attending, sorted alphabetically
  let filtered = names
    .filter((name) => name.group === card.group && name.attending)
    .sort((a, b) => a.name.localeCompare(b.name))

  // Apply from/until filters if present (alphabetical range)
  if (card.from && card.until) {
    filtered = filtered.filter(
      (name) =>
        name.name.localeCompare(card.from!, 'el') >= 0 &&
        name.name.localeCompare(card.until!, 'el') <= 0
    )
  }

  return filtered
}

/**
 * Filter unattended names (for Unattended cards)
 */
export function filterUnattendedNames(names: Name[]): Name[] {
  return names.filter((name) => !name.attending).sort((a, b) => a.name.localeCompare(b.name))
}

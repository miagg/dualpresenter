import { Name } from '../main/models/Name'
import { Card } from '../main/models/Card'
import { CardType } from '../main/enums/CardType'

/**
 * Filter names based on card properties (group, from, until, attending status)
 * This ensures consistent filtering logic across the application
 */
export function filterNamesForCard(names: Name[], card: Card, allCards?: Card[], distributeNames?: boolean): Name[] {
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
  } else if (distributeNames && allCards) {
    // Distribute names across no-range cards if enabled
    filtered = distributeNamesForCard(names, card, allCards)
  }

  return filtered
}

/**
 * Distribute names across all no-range names cards of the same group
 * Maintains alphabetical order by assigning names based on card position and ranged card boundaries
 */
function distributeNamesForCard(names: Name[], currentCard: Card, allCards: Card[]): Name[] {
  // Only distribute if current card has no range
  if (currentCard.from || currentCard.until) {
    return [] // Ranged cards are handled by the main filter logic
  }

  // Get all names cards of the same group, sorted by ID (which represents their order)
  const sameGroupCards = allCards
    .filter((card) => card.type === CardType.Names && card.group === currentCard.group)
    .sort((a, b) => a.id - b.id)

  // Get all names in this group that are attending, sorted alphabetically
  const groupNames = names
    .filter((name) => name.group === currentCard.group && name.attending)
    .sort((a, b) => a.name.localeCompare(b.name))

  // Find the current card's position in the group
  const currentCardIdx = sameGroupCards.findIndex((c) => c.id === currentCard.id)
  if (currentCardIdx === -1) return []

  // Determine alphabetical boundaries for this card
  let lowerBound: string | null = null  // Exclusive lower bound
  let upperBound: string | null = null  // Exclusive upper bound

  // Look backwards to find the last ranged card (sets lower bound)
  for (let i = currentCardIdx - 1; i >= 0; i--) {
    if (sameGroupCards[i].from && sameGroupCards[i].until) {
      lowerBound = sameGroupCards[i].until!
      break
    }
  }

  // Look forwards to find the next ranged card (sets upper bound)
  for (let i = currentCardIdx + 1; i < sameGroupCards.length; i++) {
    if (sameGroupCards[i].from && sameGroupCards[i].until) {
      upperBound = sameGroupCards[i].from!
      break
    }
  }

  // Filter names within the alphabetical boundaries
  const namesInRange = groupNames.filter((name) => {
    const afterLower = lowerBound === null || name.name.localeCompare(lowerBound, 'el') > 0
    const beforeUpper = upperBound === null || name.name.localeCompare(upperBound, 'el') < 0
    return afterLower && beforeUpper
  })

  // Find all no-range cards that share the same alphabetical boundaries (same segment)
  const noRangeCardsInSegment: Card[] = []
  
  for (let i = 0; i < sameGroupCards.length; i++) {
    const card = sameGroupCards[i]
    
    // Skip ranged cards
    if (card.from || card.until) continue
    
    // Find this card's boundaries
    let cardLowerBound: string | null = null
    let cardUpperBound: string | null = null
    
    for (let j = i - 1; j >= 0; j--) {
      if (sameGroupCards[j].from && sameGroupCards[j].until) {
        cardLowerBound = sameGroupCards[j].until!
        break
      }
    }
    
    for (let j = i + 1; j < sameGroupCards.length; j++) {
      if (sameGroupCards[j].from && sameGroupCards[j].until) {
        cardUpperBound = sameGroupCards[j].from!
        break
      }
    }
    
    // If boundaries match, this card is in the same segment
    if (cardLowerBound === lowerBound && cardUpperBound === upperBound) {
      noRangeCardsInSegment.push(card)
    }
  }

  // Find position of current card within its segment
  const positionInSegment = noRangeCardsInSegment.findIndex((c) => c.id === currentCard.id)
  if (positionInSegment === -1) return namesInRange // Fallback: give all names

  // Distribute names within segment more evenly
  const totalCardsInSegment = noRangeCardsInSegment.length
  const totalNames = namesInRange.length
  const baseNamesPerCard = Math.floor(totalNames / totalCardsInSegment)
  const remainder = totalNames % totalCardsInSegment
  
  // First 'remainder' cards get one extra name
  let startIdx = 0
  for (let i = 0; i < positionInSegment; i++) {
    startIdx += baseNamesPerCard + (i < remainder ? 1 : 0)
  }
  
  const namesForThisCard = baseNamesPerCard + (positionInSegment < remainder ? 1 : 0)
  const endIdx = startIdx + namesForThisCard

  return namesInRange.slice(startIdx, endIdx)
}

/**
 * Filter unattended names (for Unattended cards)
 */
export function filterUnattendedNames(names: Name[]): Name[] {
  return names.filter((name) => !name.attending).sort((a, b) => a.name.localeCompare(b.name))
}

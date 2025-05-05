import { CardType } from '../enums/CardType'
import { Card } from '../models/Card'
import { Name } from '../models/Name'
import xlsx from 'node-xlsx'
import path from 'path'

interface ParsedData {
  cards: Card[]
  names: Name[]
}

const parseExcel = function (excelPath: string): ParsedData {
  try {
    const xls = xlsx.parse(excelPath)
    const cards =
      xls[0]?.data
        ?.slice(1)
        ?.map((card: string[], index) => {
          return Card.fromArray([(index + 1).toString(), ...card])
        })
        // Filter out cards with invalid type
        ?.filter((card: Card) => {
          const validCardTypes = Object.values(CardType)
          const isValidType = validCardTypes.includes(card.type)
          return isValidType
        }) || []

    // Add excel path to images cards
    cards.forEach((card) => {
      if (card.type === CardType.Image) {
        // Extract the directory from the excel path and join with the image filename
        const directory = path.dirname(excelPath)
        const imagePath = path.join(directory, card.title)
        if (card.title?.length) {
          card.title = imagePath
        }
      }
    })
    const names =
      xls[1]?.data?.slice(1)?.map((name: string[], index) => {
        return Name.fromArray([(index + 1).toString(), ...name])
      }) || []
    return { cards, names }
  } catch (error) {
    console.error(error)
    return { cards: [], names: [] }
  }
}

export { parseExcel }

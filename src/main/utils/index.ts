import { Card } from '../models/Card'
import { Name } from '../models/Name'
import xlsx from 'node-xlsx'

const parseExcel = function (excelPath: string): Card[] {
  try {
    const xls = xlsx.parse(excelPath)
    const cards = xls[0].data.slice(1).map((card: string[], index) => {
      return Card.fromArray([(index + 1).toString(), ...card])
    })
    const names = xls[1].data.slice(1).map((name: string[], index) => {
      return Name.fromArray([(index + 1).toString(), ...name])
    })
    return cards
  } catch (error) {
    console.error(error)
    return []
  }
}

export { parseExcel }

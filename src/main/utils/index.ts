import { Card } from '../models/Card'
import { Data } from '../interfaces/Data'
import { Name } from '../models/Name'
import xlsx from 'node-xlsx'

const parseExcel = function (excelPath: string): Data {
  try {
    const xls = xlsx.parse(excelPath)
    return {
      cards: xls[0].data.slice(1).map((card: string[], index) => {
        return Card.fromArray([(index + 1).toString(), ...card])
      }),
      names: xls[1].data.slice(1).map((name: string[], index) => {
        return Name.fromArray([(index + 1).toString(), ...name])
      })
    }
  } catch (error) {
    console.error(error)
    return {
      cards: [],
      names: []
    }
  }
}

export { parseExcel }

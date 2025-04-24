import { Card } from '../models/Card'
import { Name } from '../models/Name'
import { Config } from '../interfaces/Config'
import { State } from '../interfaces/State'

// Extend the Electron.Display type to include our isPrimary flag
interface ExtendedDisplay extends Electron.Display {
  isPrimary: boolean
}

export interface Data {
  cards: Card[]
  names: Name[]
  config: Config
  state: State
  monitors?: ExtendedDisplay[]
}

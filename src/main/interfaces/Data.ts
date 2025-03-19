import { Card } from '../models/Card'
import { Config } from '../interfaces/Config'
import { State } from '../interfaces/State'

export interface Data {
  cards: Card[]
  config: Config
  state: State
}

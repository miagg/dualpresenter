import { CardType } from '../enums/CardType'
import { DisplayType } from '../enums/DisplayType'

export class Card {
  constructor(
    public id: number,
    public type: CardType,
    public title: string | null,
    public subtitle: string | null,
    public group: string | null,
    public from: string | null,
    public until: string | null,
    public display: DisplayType,
    public precedence: number | null
  ) {}

  static fromArray(array: number | string[]): Card {
    return new Card(
      parseInt(array[0]),
      CardType[array[2] as keyof typeof CardType],
      array[3] || null,
      array[4] || null,
      array[5] || null,
      array[6] || null,
      array[7] || null,
      array[8] === undefined
        ? DisplayType.Auto
        : Object.values(DisplayType).find((value) => value === array[8]) || DisplayType.Auto,
      parseInt(array[9]) >= 0 ? parseInt(array[9]) : null
    )
  }
}

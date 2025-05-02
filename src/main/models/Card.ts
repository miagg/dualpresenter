import { CardType } from '../enums/CardType'

export class Card {
  constructor(
    public id: number,
    public type: CardType,
    public title: string | null,
    public subtitle: string | null,
    public group: string | null,
    public from: string | null,
    public until: string | null,
    public main_only: boolean | null,
    public precedence: number | null
  ) {}

  static fromArray(array: number | string[]): Card {
    return new Card(
      parseInt(array[0]),
      CardType[array[1] as keyof typeof CardType],
      array[2] || null,
      array[3] || null,
      array[4] || null,
      array[5] || null,
      array[6] || null,
      array[7] === 'Yes' ? true : array[7] === 'No' ? false : null,
      parseInt(array[8]) >= 0 ? parseInt(array[8]) : null
    )
  }
}

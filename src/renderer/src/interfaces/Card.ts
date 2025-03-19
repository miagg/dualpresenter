export enum CardType {
  Blank = 'Blank',
  Title = 'Title',
  Names = 'Names'
}

export interface Card {
  id: number
  type: CardType
  title: string | null
  subtitle: string | null
  group: string | null
  from: string | null
  until: string | null
}

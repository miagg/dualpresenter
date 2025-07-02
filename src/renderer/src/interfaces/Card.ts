export enum CardType {
  Blank = 'Blank',
  Category = 'Category',
  Title = 'Title',
  Names = 'Names',
  Unattended = 'Unattended',
  Image = 'Image'
}

export interface Card {
  id: number
  type: CardType
  title: string | null
  subtitle: string | null
  group: string | null
  from: string | null
  until: string | null
  main_only: boolean
  precedence: number | null
}

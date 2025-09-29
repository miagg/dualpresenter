export enum CardType {
  Blank = 'Blank',
  Category = 'Category',
  Title = 'Title',
  Names = 'Names',
  Unattended = 'Unattended',
  Image = 'Image'
}

export enum DisplayType {
  Auto = 'Auto',
  MainOnly = 'Main Only',
  SideOnly = 'Side Only',
  Both = 'Both'
}

export interface Card {
  id: number
  type: CardType
  title: string | null
  subtitle: string | null
  group: string | null
  from: string | null
  until: string | null
  display: DisplayType
  precedence: number | null
}

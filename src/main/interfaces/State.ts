export interface State {
  excelPath: string | undefined
  currentSlideIndex: number
  mainScreen: string | null
  sideScreen: string | null
  freezeMonitors: boolean
  blackOutScreens: boolean
  frozenSlideIndex: number | null
  currentMainNamesPage?: number
  currentMainUnattendedPage?: number
  currentSideNamesPage?: number
  currentSideUnattendedPage?: number
  windowBounds?: {
    x: number
    y: number
    width: number
    height: number
  }
  isMaximized?: boolean
  lastOpenedTab?: string
}

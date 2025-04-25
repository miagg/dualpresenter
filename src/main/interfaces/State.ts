export interface State {
  excelPath: string | undefined
  currentSlideIndex: number
  mainScreen: string | null
  sideScreen: string | null
  freezeMonitors: boolean
  windowBounds?: {
    x: number
    y: number
    width: number
    height: number
  }
  isMaximized?: boolean
}

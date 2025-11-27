export interface Config {
  colors: {
    primaryBackground: string
    primaryText: string
    secondaryBackground: string
    secondaryText: string
  }
  assets: {
    background: string
    backgroundNames: string
    logo: string
    logoInverted: string
    maxLogoSize: number
    logoVerticalPosition: number
  }
  fonts: {
    slidesFont: string
  }
  audibleNames: {
    enabled: boolean
    delayBeforePlayback: number
    gapBetweenNames: number
    autoPlayback: boolean
    continuousPlayback: boolean
    showNamesOnSideOnly: boolean
  }
  namesPrecedence: number
  distributeNames: boolean
}

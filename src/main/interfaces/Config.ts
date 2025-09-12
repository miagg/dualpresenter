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
  }
  namesPrecedence: number
}

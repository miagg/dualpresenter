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
    useDefaultAssets: boolean
  }
  fonts: {
    slidesFont: string
    useBoldTitles: boolean
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

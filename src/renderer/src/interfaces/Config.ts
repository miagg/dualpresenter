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
  namesPrecedence: number
}

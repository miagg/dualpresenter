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
  namesPrecedence: number
}

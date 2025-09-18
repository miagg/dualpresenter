import Store from 'electron-store'
import schema from './config_schema.json'

const config = new Store({
  schema,
  migrations: {
    '1.0.9': (store): void => {
      store.set('config.audibleNames.enabled', false)
      store.set('config.audibleNames.delayBeforePlayback', 200)
      store.set('config.audibleNames.gapBetweenNames', 200)
      store.set('config.audibleNames.autoPlayback', true)
    },
    '1.1.2': (store): void => {
      store.set('config.audibleNames.continuousPlayback', true)
    },
    '1.1.3': (store): void => {
      store.set('config.assets.maxLogoSize', 60)
      store.set('config.assets.logoVerticalPosition', 0)
      store.set('state.lastOpenedTab', 'appearance')
    }
  }
})
export default config

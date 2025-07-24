import Store from 'electron-store'
import schema from './config_schema.json'

const config = new Store({
  schema,
  migrations: {
    '1.0.9': (store): void => {
      store.set('audibleNames.enabled', false)
      store.set('audibleNames.delayBeforePlayback', 200)
      store.set('audibleNames.gapBetweenNames', 200)
      store.set('audibleNames.autoPlayback', true)
    }
  }
})
export default config

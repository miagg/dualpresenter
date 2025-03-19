import Store from 'electron-store'
import schema from './config_schema.json'

const config = new Store({
  schema,
  migrations: {
    '1.0.1': (store): void => {
      // store.set('newkey', 'value')
      // store.delete('oldkey')
    }
  }
})
export default config

import Store from 'electron-store'
import schema from './config_schema.json'
const config = new Store({ schema })

export default config

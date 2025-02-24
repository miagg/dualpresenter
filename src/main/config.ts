import Store from 'electron-store'
import schema from './config_schema.json'
const store = new Store({ schema })

export default store

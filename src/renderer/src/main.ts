import './assets/main.css'

import { createApp, h } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import Display from './components/Display.vue'
import Settings from './components/Settings.vue'
import ExcelStructure from './components/ExcelStructure.vue'

// Create router instance
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: App },
    { path: '/mainscreen', name: 'mainscreen', component: Display },
    { path: '/sidescreen', name: 'sidescreen', component: Display },
    { path: '/settings', name: 'settings', component: Settings },
    { path: '/excel-structure', name: 'excelstructure', component: ExcelStructure }
  ]
})

// Create the app
const app = createApp({
  render: () => h(router.currentRoute.value.matched[0].components.default)
})

// Install the router instance
app.use(router)

// Mount the app
router.isReady().then(() => {
  app.mount('#app')
})

import './assets/main.css'

import { createApp, h } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import Display from './components/Display.vue'
import Settings from './components/Settings.vue'

// Create router instance
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: App },
    { path: '/display', name: 'display', component: Display },
    { path: '/settings', name: 'settings', component: Settings }
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

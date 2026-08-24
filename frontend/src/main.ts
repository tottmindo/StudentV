import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { restoreSocket } from './shared/composables/socket'
import { i18n } from './i18n'
import { initializeTheme } from './shared/composables/theme'

initializeTheme()

const app = createApp(App)

app.use(router)
app.use(i18n)

// Recreate the authenticated real-time connection after a full page reload.
restoreSocket()

app.mount('#app')

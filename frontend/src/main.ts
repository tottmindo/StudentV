import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { restoreSocket } from './composables/socket'

const app = createApp(App)

app.use(router)

// Recreate the authenticated real-time connection after a full page reload.
restoreSocket()

app.mount('#app')

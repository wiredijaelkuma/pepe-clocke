import './assets/main.css'
import '@appwrite.io/pink-icons'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')

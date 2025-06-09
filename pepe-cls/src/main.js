import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// Add this for debugging
console.log('App starting with router mode:', router.options.history.constructor.name);
console.log('Base URL:', window.location.origin);

createApp(App).use(router).mount('#app')
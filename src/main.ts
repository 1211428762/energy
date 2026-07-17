import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.scss'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.mount('#app')

requestAnimationFrame(() => {
  const loading = document.getElementById('app-loading')
  if (!loading) return
  loading.classList.add('loading-hide')
  window.setTimeout(() => loading.remove(), 320)
})

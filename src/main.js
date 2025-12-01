import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@/styles/app.css'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate' // 建议使用完整名称，更清晰

import App from './App.vue'
import router from './router'

// 1. 创建Pinia实例
const pinia = createPinia()

// 2. 为Pinia实例安装持久化插件
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

// 3. 按顺序使用插件：先Pinia，后Router
app.use(pinia)
app.use(router)

app.mount('#app')

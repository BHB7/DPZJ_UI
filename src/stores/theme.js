import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore(
  'themeStore',
  () => {
    const theme = ref('light') // 定义主题变量

    const changeTheme = () => {
      theme.value = theme.value === 'light' ? 'dark' : 'light'
      return theme.value
    }

    // 正确监听 ref 对象（而非 ref.value）
    watch(
      theme,
      (newVal) => {
        document.documentElement.setAttribute('data-theme', newVal)
        console.log('当前主题：', newVal)
      },
      { immediate: true },
    ) // immediate: true 表示立即执行一次（初始化时应用主题）

    return { theme, changeTheme }
  },
  {
    persist: true, // 持久化（需配合 pinia-plugin-persistedstate 插件）
  },
)

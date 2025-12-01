import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useUserStore = defineStore(
  'user',
  () => {
    // 初始化响应式对象（建议用更语义化的结构）
    const userInfo = reactive({
      username: '',
      token: '',
      avatar: '',
      // 其他用户信息字段
    })

    // 正确修改reactive对象的方式：更新属性而非替换整个对象
    const setUserInfo = (newInfo) => {
      // 合并新数据到响应式对象中
      Object.assign(userInfo, newInfo)
      return { ...userInfo } // 返回副本，避免外部直接修改响应式对象
    }

    // 清空用户信息
    const clearUserInfo = () => {
      Object.assign(userInfo, {
        username: '',
        token: '',
        avatar: '',
      })
    }

    return { userInfo, setUserInfo, clearUserInfo }
  },
  {
    persist: {
      enabled: true,
      strategies: [
        {
          key: 'user-store', // 自定义存储键名，避免冲突
          storage: localStorage, // 指定存储方式（localStorage/sessionStorage）
          // paths: ['userInfo.token'] // 可选：只持久化特定字段
        },
      ],
    },
  },
)

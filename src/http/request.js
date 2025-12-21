import { alertWarning } from '@/utils/alertPopup'
import axios from 'axios'
// 核心修改1：不直接在拦截器中调用useRouter，而是导入router实例
import router from '@/router' // 导入你项目中创建的router实例（关键！）
import { useUserStore } from '@/stores/user'

const instance = axios.create({
  baseURL: '/',
  timeout: 100000,
  withCredentials: true,
})

// 请求拦截器：携带token（补充你的token逻辑）
instance.interceptors.request.use(
  (config) => {
    // TODO: 从本地存储/Pinia中获取token并携带（示例）
    const token = localStorage.getItem('token') || ''
    if (token) {
      config.headers.Authorization = `Bearer ${token}` // 按后端要求格式调整
    }
    return config
  },
  (err) => Promise.reject(err),
)

// 响应拦截器
instance.interceptors.response.use(
  (res) => {
    console.log(res.data)

    // 处理业务失败（非200/自定义失败逻辑）
    if (!res.data.success) {
      console.log('业务请求失败:', res.data.msg)
      return Promise.reject(res.data.msg || '请求失败')
    }

    // 摘取核心数据（建议返回res.data，减少业务层冗余）
    return res.data // 优化：直接返回核心数据，业务层不用再.res.data
  },
  (err) => {
    // 核心修改2：容错处理（避免err.response/err.response.data不存在导致崩溃）
    const resData = err.response?.data || {}

    // 处理401/登录过期逻辑
    if (!resData.success || err.response?.status === 401) {
      alertWarning('登录过期，请重新登录!', 6000)
      // 改用导入的router实例跳转，而非useRouter()
      useUserStore().clearUserInfo()
      router.replace('/login')
    }

    // 统一错误提示（可选）
    const errMsg = resData.msg || err.message || '请求出错'
    alertWarning(errMsg, 3000)

    return Promise.reject(err)
  },
)

export default instance

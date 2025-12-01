import axios from 'axios'

// const baseURL = 'http://big-event-vue-api-t.itheima.net'?

const instance = axios.create({
  // TODO 1. 基础地址，超时时间
  baseURL: '/',
  timeout: 100000,
  withCredentials: true,
})

instance.interceptors.request.use(
  (config) => {
    // TODO 2. 携带token
    return config
  },
  (err) => Promise.reject(err),
)

instance.interceptors.response.use(
  (res) => {
    // TODO 3. 处理业务失败
    if (!res.data.success) {
      return Promise.reject(res.data.msg)
    }

    // TODO 4. 摘取核心响应数据
    return res
  },
  (err) => {
    // TODO 5. 处理401错误
    return Promise.reject(err)
  },
)

export default instance

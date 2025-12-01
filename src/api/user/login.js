import request from '@/http/request'

export const loginApi = async ({ username, password }) => {
  const formData = new FormData()
  formData.append('username', username)
  formData.append('password', password)
  return request.post('/api?s=/api/public/login', formData)
}

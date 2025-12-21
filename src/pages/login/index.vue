<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { loginApi } from '@/api/index'
import { useUserStore } from '@/stores/user'
import { alertSuccess } from '@/utils/alertPopup'

const userStore = useUserStore()
const router = useRouter()
// 表单数据
const form = reactive({
  username: '',
  password: '',
})

// 状态管理
const errors = reactive({})
const loading = ref(false)
const showPassword = ref(false)

// 表单验证
const validateForm = () => {
  const newErrors = {}

  if (!form.username.trim()) {
    newErrors.username = '用户名不能为空'
  }

  if (!form.password) {
    newErrors.password = '密码不能为空'
  } else if (form.password.length < 6) {
    newErrors.password = '密码长度不能少于6位'
  }

  Object.assign(errors, newErrors)
  return Object.keys(newErrors).length === 0
}

// 登录处理
const handleLogin = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    // 模拟登录请求
    const userInfo = await loginApi(form)
    console.log(userInfo)

    // 登录成功逻辑
    alertSuccess('登录成功！')
    // 这里可以添加路由跳转逻辑
    userStore.setUserInfo(userInfo.msg.data)
    router.push('/')
  } catch (error) {
    alert(error)
  } finally {
    loading.value = false
  }
}
defineOptions({
  name: 'loginPage',
})
</script>
<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4"
  >
    <div
      class="card w-full max-w-md shadow-2xl bg-white rounded-xl overflow-hidden border border-gray-100"
    >
      <div class="card-body p-8">
        <!-- 登录标题 -->
        <div class="text-center mb-8">
          <div class="inline-block p-3 bg-primary/10 rounded-full mb-4">
            <i class="fa-solid fa-user-lock text-2xl text-primary"></i>
          </div>
          <h2 class="text-[clamp(1.5rem,3vw,2rem)] font-bold text-gray-800">欢迎登录</h2>
          <p class="text-gray-500 mt-2">请输入账号密码进行登录</p>
        </div>

        <!-- 登录表单 -->
        <form @submit.prevent="handleLogin">
          <!-- 用户名输入框 -->
          <div class="form-control mb-5">
            <label class="label mb-1">
              <span class="label-text font-medium text-gray-700">用户名</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <i class="fa-solid fa-user"></i>
              </span>
              <input
                v-model="form.username"
                type="text"
                placeholder="请输入用户名"
                class="input input-bordered w-full pl-10 pr-4 py-3 rounded-lg border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                :class="{
                  'border-red-500 focus:border-red-500 focus:ring-red-200': errors.username,
                }"
              />
            </div>
            <label class="label mt-1">
              <span class="label-text-alt text-red-500 text-sm" v-if="errors.username">
                {{ errors.username }}
              </span>
            </label>
          </div>

          <!-- 密码输入框 -->
          <div class="form-control mb-4">
            <label class="label mb-1">
              <span class="label-text font-medium text-gray-700">密码</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <i class="fa-solid fa-lock"></i>
              </span>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                class="input input-bordered w-full pl-10 pr-10 py-3 rounded-lg border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                :class="{
                  'border-red-500 focus:border-red-500 focus:ring-red-200': errors.password,
                }"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                @click="showPassword = !showPassword"
              >
                <i class="fa-solid" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
            <label class="label mt-1">
              <span class="label-text-alt text-red-500 text-sm" v-if="errors.password">
                {{ errors.password }}
              </span>
            </label>
          </div>

          <!-- 记住我和忘记密码 -->
          <div class="flex items-center justify-between mt-2 mb-6">
            <label class="label cursor-pointer flex items-center gap-2">
              <input type="checkbox" class="checkbox checkbox-primary rounded-sm h-4 w-4" />
              <span class="label-text text-gray-600">记住我</span>
            </label>
            <a
              href="#"
              class="text-primary text-sm hover:text-primary/80 hover:underline transition-colors"
              >忘记密码?</a
            >
          </div>

          <!-- 登录按钮 -->
          <div class="form-control mt-2">
            <button
              type="submit"
              class="btn btn-primary btn-block py-6 rounded-lg text-lg font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
              :disabled="loading"
            >
              <span v-if="loading" class="loading loading-spinner mr-2"></span>
              {{ loading ? '登录中...' : '登录' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style>
/* 引入Font Awesome图标 */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>

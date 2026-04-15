import { useUserStore } from '@/stores/user'
import { reactive } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
// 配置：不显示小圆圈、更流畅
NProgress.configure({
  showSpinner: false,
  speed: 500,
  trickleSpeed: 200,
})

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/layout',
      component: () => import('@/pages/layout/index.vue'),
      redirect: '/layout/home',
      children: [
        {
          path: 'home',
          component: () => import('@/pages/home/index.vue'),
        },
        {
          path: 'search',
          component: () => import('@/pages/search/index.vue'),
          children: [],
        },
        {
          path: 'tools',
          component: () => import('@/pages/tools/index.vue'),
        },
        {
          path: 'time',
          component: () => import('@/pages/timeLine/index.vue'),
        },
      ],
    },
    {
      path: '/',
      redirect: '/layout',
      component: () => import('@/App.vue'),
    },
    {
      path: '/login',
      component: () => import('@/pages/login/index.vue'),
    },
  ],
})
// 路由跳转开始
router.beforeEach((to, from, next) => {
  NProgress.start()
  next()
})

// 路由跳转结束
router.afterEach(() => {
  setTimeout(() => {
    NProgress.done()
  }, 1000)
})
// 全局前置守卫：校验登录状态
router.beforeEach((to, from, next) => {
  const isLogin = useUserStore().userInfo
  // 需登录的路由，未登录则跳登录页
  if (to.meta.requiresAuth && !isLogin) {
    next({ path: '/login' })
  }
  next() // 必须有
})
export default router

import { useUserStore } from '@/stores/user'
import { reactive } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

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
        },
        {
          path: 'tools',
          component: () => import('@/pages/tools/index.vue'),
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

// 全局前置守卫：校验登录状态
router.beforeEach((to, from, next) => {
  const isLogin = useUserStore().userInfo
  // 需登录的路由，未登录则跳登录页
  if (to.meta.requiresAuth && !isLogin) {
    next({ path: '/login' })
  } else {
    next() // 放行
  }
})
export default router

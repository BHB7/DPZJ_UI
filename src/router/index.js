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

export default router

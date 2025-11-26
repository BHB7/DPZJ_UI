import { reactive } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/layout',
      component: () => import('@/pages/layout/index.vue'),
    },
    {
      path: '/',
      redirect: '/layout',
      component: () => import('@/App.vue'),
    },
  ],
})

export default router

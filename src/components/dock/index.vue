<script setup>
import { useRouter } from 'vue-router'
import LineMdHomeMd from '~icons/line-md/home-md'
import LineMdSearchTwotone from '~icons/line-md/search-twotone'
import LineMdCogLoop from '~icons/line-md/cog-loop'
const router = useRouter()

// 导航配置
const navItems = [
  { path: '/layout/home', label: '首页', icon: LineMdHomeMd },
  { path: '/layout/search', label: '搜索', icon: LineMdSearchTwotone },
  { path: '/layout/toolBox', label: '工具箱', icon: LineMdCogLoop },
]

const navigateTo = (path) => {
  router.push(path)
}

defineOptions({
  name: 'dockPage',
})
</script>

<template>
  <div class="dock">
    <button
      v-for="item in navItems"
      :key="item.path"
      :class="{ 'dock-active': $route.path === item.path }"
      @click="navigateTo(item.path)"
    >
      <component :is="item.icon" class="size-[1.2em]" />
      <span class="dock-label">{{ item.label }}</span>
    </button>
  </div>
</template>

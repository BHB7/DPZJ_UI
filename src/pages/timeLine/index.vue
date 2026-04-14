<script setup>
import { useRoute } from 'vue-router'
defineOptions({
  name: 'timeLinePage',
})

// const route = useRoute()
// console.log(route.query('name'))

// 模拟时间线数据
const timelineData = [
  {
    id: 1,
    title: '吉安达',
    time: '2024-01-15',
    content: '+400',
    status: 'completed', // completed / progress / pending
  },
  {
    id: 2,
    title: '核心功能开发',
    time: '2024-02-20',
    content: '完成用户认证、数据管理等核心模块的开发和单元测试',
    status: 'completed',
  },
  {
    id: 3,
    title: 'UI 优化与联调',
    time: '2024-03-10',
    content: '基于 daisyUI 优化界面样式，与后端进行接口联调',
    status: 'progress',
  },
  {
    id: 4,
    title: '系统测试与上线',
    time: '2024-04-05',
    content: '进行系统全面测试，修复已知问题，准备生产环境部署',
    status: 'pending',
  },
]
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <h1 class="text-3xl font-bold mb-8 text-center">{{}}时间线</h1>

    <!-- 时间线主体 -->
    <div class="relative">
      <!-- 时间线竖线 -->
      <div
        class="absolute left-0 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 transform md:-translate-x-1/2"
      ></div>

      <!-- 时间线节点循环 -->
      <div v-for="(item, index) in timelineData" :key="item.id" class="mb-8 relative">
        <!-- 偶数项在右侧，奇数项在左侧（移动端全部居中） -->
        <div class="flex flex-col md:flex-row items-center md:justify-between">
          <!-- 左侧内容（移动端居中） -->
          <div class="md:w-[calc(50%-2rem)] mb-6 md:mb-0 md:text-right order-2 md:order-1">
            <h3
              class="text-xl font-semibold mb-1"
              :class="{
                'text-primary': item.status === 'completed',
                'text-warning': item.status === 'progress',
                'text-gray-500': item.status === 'pending',
              }"
            >
              {{ item.title }}
            </h3>
            <p class="text-sm text-gray-600 mb-2">{{ item.time }}</p>
            <p class="text-gray-700">{{ item.content }}</p>
          </div>

          <!-- 时间节点 -->
          <div class="w-12 h-12 flex items-center justify-center z-10 order-1 md:order-2">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center"
              :class="{
                'bg-primary text-white': item.status === 'completed',
                'bg-warning text-white': item.status === 'progress',
                'bg-gray-200 text-gray-500': item.status === 'pending',
              }"
            >
              <i v-if="item.status === 'completed'" class="fa-solid fa-check"></i>
              <i v-if="item.status === 'progress'" class="fa-solid fa-spinner fa-spin"></i>
              <i v-if="item.status === 'pending'" class="fa-solid fa-clock"></i>
            </div>
          </div>

          <!-- 右侧占位（保持布局对称） -->
          <div class="md:w-[calc(50%-2rem)] order-3"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 可选：自定义滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 3px;
}
</style>

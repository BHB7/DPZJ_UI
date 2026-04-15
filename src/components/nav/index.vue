<script setup>
import ThemeBtn from '@/components/theme/index.vue'
import evBus from '@/utils/evBus'
import { ref } from 'vue'
import { isArray } from 'lodash-es'

const msgList = ref([])
evBus.on('navMsg', (data) => {
  if (isArray(data)) {
    msgList.value = data
  } else {
    msgList.value = [data]
  }
})
defineOptions({
  name: 'navPage',
})
</script>
<template>
  <div class="navbar a fixed top-0 z-50 bg-base-100 shadow-sm">
    <div class="flex items-center justify-between w-full">
      <div></div>
      <span class="text-rotate">
        <span>
          <span v-for="msgItem in msgList" :key="msgItem">{{ msgItem }}</span>
        </span>
      </span>
      <ThemeBtn></ThemeBtn>
    </div>
  </div>
</template>

<style scoped>
.a {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background-color: rgba(255, 255, 255, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 9999;
  transition: all 0.3s ease;
}
/* 深色模式磨砂 */
html.dark .a {
  background-color: rgba(17, 24, 39, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
</style>

<script setup>
import LineMdCloseToMenuAltTransition from '~icons/line-md/close-to-menu-alt-transition'
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
  <div class="navbar fixed top-0 z-50 bg-base-100 shadow-sm">
    <div class="flex items-center justify-between w-full">
      <span class="text-rotate">
        <span>
          <span v-for="msgItem in msgList" :key="msgItem">{{ msgItem }}</span>
        </span>
      </span>
      <ThemeBtn></ThemeBtn>
    </div>
  </div>
</template>

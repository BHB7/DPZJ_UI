<script setup>
import LineMdCloseToMenuAltTransition from '~icons/line-md/close-to-menu-alt-transition'
import ThemeBtn from '@/components/theme/index.vue'
</script>
<template>
  <div class="navbar bg-base-100 shadow-sm">
    <div class="flex-1">
      <a class="btn btn-ghost text-xl">
        <LineMdCloseToMenuAltTransition></LineMdCloseToMenuAltTransition>DPZJ-UI</a
      >
    </div>
    <ThemeBtn></ThemeBtn>
    <div class="flex gap-2"></div>
  </div>
</template>

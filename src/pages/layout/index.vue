<script setup>
import { RouterView } from 'vue-router'
import Navbar from '@/components/nav/index.vue'
import Dock from '@/components/dock/index.vue'
defineOptions({
  name: 'layoutPage',
})
</script>
<template>
  <main class="pb-20">
    <Navbar></Navbar>
    <RouterView />
    <Dock></Dock>
  </main>
</template>
<style scoped></style>

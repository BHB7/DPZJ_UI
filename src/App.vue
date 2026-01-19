<script setup></script>

<template>
  <!-- 作用域插槽写法 + 精准缓存 -->
  <router-view v-slot="{ Component }">
    <!-- 过渡动画 + 缓存 -->
    <transition name="route-fade" mode="out-in">
      <keep-alive include="search" :max="3">
        <component :is="Component" />
      </keep-alive>
    </transition>
  </router-view>
</template>

<style scoped></style>

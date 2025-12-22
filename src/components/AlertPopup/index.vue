<template>
  <!-- 弹窗容器：固定定位右上角，支持堆叠 -->
  <div class="alert-wrapper" v-if="visible">
    <div
      :class="[
        'alert-outline',
        'alert',
        `alert-${props.type}`,
        'shadow-md',
        'transition-all',
        'duration-300',
        'ease-in-out',
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
      ]"
      role="alert"
    >
      <!-- DaisyUI 原生图标 -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 shrink-0 stroke-current"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="iconPath"></path>
      </svg>
      <!-- 提示文本 -->
      <span>{{ message }}</span>
      <!-- 关闭按钮（DaisyUI 风格） -->
      <button
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        @click="close"
        aria-label="Close alert"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

// 接收 props
const props = defineProps({
  // 弹窗类型：success/info/warning/error（对应 DaisyUI 类）
  type: {
    type: String,
    default: 'info',
    validator: (val) => ['success', 'info', 'warning', 'error'].includes(val),
  },
  // 提示消息
  message: {
    type: String,
    required: true,
  },
  // 自动关闭时间（毫秒），0 不关闭
  duration: {
    type: Number,
    default: 3000,
  },
})

// 显示状态
const visible = ref(true)
// 关闭弹窗
const close = () => {
  visible.value = false
  // 动画完成后触发销毁
  setTimeout(() => emit('close'), 300)
}

// 匹配 DaisyUI 原生图标路径
const iconPath = ref('')
const iconMap = {
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', // 成功（绿色）
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', // 信息（蓝色）
  warning:
    'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', // 警告（黄色）
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', // 错误（红色）
}

// 监听类型切换图标
watch(
  () => props.type,
  (newType) => {
    iconPath.value = iconMap[newType]
  },
  { immediate: true },
)

// 自动关闭逻辑
onMounted(() => {
  console.log(props.type)
  if (props.duration > 0) {
    setTimeout(close, props.duration)
  }
})

// 透传关闭事件
const emit = defineEmits(['close'])

defineOptions({
  name: 'alertPopup',
})
</script>

<style scoped>
/* 弹窗容器：固定右上角，避免遮挡 */
.alert-wrapper {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  width: 320px;
  max-width: calc(100vw - 40px);
  margin-bottom: 10px;
}
</style>

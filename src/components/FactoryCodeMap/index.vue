<script setup>
import { ref } from 'vue'

// 厂家代码映射数据
import factoryCodeMap from '@/stores/jfcodes.json'

// 反向映射（代码到名称），处理重复代码的情况（如DN对应两个名称）
const codeToFactories = {}
Object.entries(factoryCodeMap).forEach(([name, code]) => {
  if (!codeToFactories[code]) {
    codeToFactories[code] = []
  }
  codeToFactories[code].push(name)
})

const ipt = ref('')
const result = ref('') // 存储转换结果

// 初始化主题
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (
    savedTheme === 'dark' ||
    (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.documentElement.classList.add('dark')
  }
}
// 页面加载时初始化主题
initTheme()

// 转换核心函数
const sToC = (input) => {
  if (!input.trim()) {
    result.value = '请输入要转换的内容'
    return
  }
  const inputStr = input.trim().toUpperCase() // 统一转大写，避免大小写问题

  // 1. 先匹配代码（如输入DH、dn都能匹配）
  if (codeToFactories[inputStr]) {
    result.value = codeToFactories[inputStr].join(' / ') // 多个名称用/分隔
    return
  }

  // 2. 匹配厂家名称（模糊匹配）
  const matchedNames = Object.keys(factoryCodeMap).filter(
    (name) => name.includes(inputStr) || name.toUpperCase().includes(inputStr),
  )

  if (matchedNames.length === 0) {
    result.value = '未找到匹配的厂家或代码'
  } else if (matchedNames.length === 1) {
    result.value = factoryCodeMap[matchedNames[0]]
  } else {
    // 多个匹配结果，展示名称和对应代码
    result.value = matchedNames.map((name) => `${name} → ${factoryCodeMap[name]}`).join('\n')
  }
}
defineOptions({
  name: 'factoryCodeMapPage',
})
</script>

<template>
  <!-- 主卡片 -->
  <div
    class="card w-full max-w-2xl shadow-xl rounded-xl bg-base-200 dark:bg-gray-800 transition-all duration-300 hover:shadow-2xl"
  >
    <!-- 卡片头部 -->
    <div
      class="card-header bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 text-white p-6 rounded-t-xl"
    >
      <h2 class="card-title text-2xl font-bold flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        厂家代码互转工具
      </h2>
      <p class="text-blue-100 dark:text-blue-200 mt-1 text-sm">
        支持代码转名称、名称模糊匹配转代码
      </p>
    </div>

    <!-- 卡片主体 -->
    <div class="card-body p-6">
      <!-- 输入区域 -->
      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          v-model="ipt"
          class="input input-bordered input-primary w-full flex-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          placeholder="输入厂家名称或代码（如：正辉、DH）"
          @keyup.enter="sToC(ipt)"
        />
        <button
          @click="sToC(ipt)"
          class="btn btn-primary transition-all duration-200 hover:btn-secondary active:scale-95 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          立即转换
        </button>
      </div>

      <!-- 结果展示区域 -->
      <div class="result-container relative">
        <label class="label block text-base-content dark:text-gray-200 font-medium mb-2">
          转换结果：
        </label>
        <div
          class="card bg-base-300 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 min-h-[80px] whitespace-pre-line font-mono text-base transition-all duration-200 animate-fadeIn"
        >
          {{ result || '请输入内容并点击转换按钮' }}
        </div>
      </div>

      <!-- 示例提示 -->
      <div class="mt-4 text-sm text-gray-600 dark:text-gray-400 italic">
        示例：输入「正辉」→ 输出「DH」；输入「DH」→ 输出「正辉汽配」；输入「景文」→ 输出匹配结果
      </div>
    </div>

    <!-- 卡片底部 -->
    <div
      class="card-footer bg-base-300 dark:bg-gray-800/50 p-4 text-center text-gray-600 dark:text-gray-400 text-sm rounded-b-xl border-t border-gray-200 dark:border-gray-700"
    >
      © 2025 厂家代码查询工具 | 精准匹配 · 快速转换
    </div>
  </div>
</template>

<style scoped>
/* 主题切换过渡 */
html.dark {
  color-scheme: dark;
}

/* 淡入动画 */
.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式适配 */
@media (max-width: 640px) {
  .card-header {
    padding: 4rem !important;
  }
  .card-body {
    padding: 4rem !important;
  }
}
</style>

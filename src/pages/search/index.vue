<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- 页面标题 -->
    <header class="mb-8 text-center animate-fade-in">
      <h1 class="text-3xl md:text-4xl font-bold text-primary mb-2 tracking-tight">
        汽配入库订单搜索
      </h1>
      <p class="text-base-content/70 max-w-md mx-auto">
        输入订单号、配件编码、车型等关键词快速检索入库记录
      </p>
    </header>

    <!-- 操作栏：主题切换 + 导出按钮 -->
    <div class="flex justify-between items-center mb-4">
      <!-- 导出Excel按钮 -->
      <button
        class="btn btn-sm btn-success"
        @click="exportExcel"
        :disabled="!hasSearched || searchResults.length === 0"
      >
        <i class="fa-solid fa-file-excel-o mr-2"></i> 导出Excel
      </button>
    </div>

    <!-- 高级搜索条件（适配导出参数） -->
    <div
      class="mb-6 p-4 bg-base-100 dark:bg-base-300 rounded-xl border border-base-200 dark:border-base-400"
    >
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <!-- 配件编码 -->
        <div class="form-control">
          <label class="label text-sm">配件编码</label>
          <input
            v-model="searchParams.jfcode"
            type="text"
            class="input input-sm bg-base-100 dark:bg-base-400 text-base-content dark:text-white"
            placeholder="如：AD-C0001"
          />
        </div>
        <!-- 配件名称 -->
        <div class="form-control">
          <label class="label text-sm">配件名称</label>
          <input
            v-model="searchParams.name"
            type="text"
            class="input input-sm bg-base-100 dark:bg-base-400 text-base-content dark:text-white"
            placeholder="如：控制臂前下左"
          />
        </div>
        <!-- 开始时间 -->
        <div class="form-control">
          <label class="label text-sm">开始时间</label>
          <input
            v-model="searchParams.start"
            type="date"
            class="input input-sm bg-base-100 dark:bg-base-400 text-base-content dark:text-white"
          />
        </div>
        <!-- 结束时间 -->
        <div class="form-control">
          <label class="label text-sm">结束时间</label>
          <input
            v-model="searchParams.end"
            type="date"
            class="input input-sm bg-base-100 dark:bg-base-400 text-base-content dark:text-white"
          />
        </div>
        <!-- 订单号 -->
        <div class="form-control">
          <label class="label text-sm">订单号</label>
          <input
            v-model="searchParams.order"
            type="text"
            class="input input-sm bg-base-100 dark:bg-base-400 text-base-content dark:text-white"
            placeholder="如：ZR20251212"
          />
        </div>
        <!-- 代理商/仓库 -->
        <div class="form-control">
          <label class="label text-sm">代理商/仓库</label>
          <input
            v-model="searchParams.agent"
            type="text"
            class="input input-sm bg-base-100 dark:bg-base-400 text-base-content dark:text-white"
            placeholder="如：哈尔滨仓"
          />
        </div>
      </div>
      <div class="mt-4 flex justify-center">
        <button class="btn btn-primary" @click="handleAdvancedSearch">
          <i class="fa-solid fa-search mr-2"></i> 高级搜索
        </button>
      </div>
    </div>

    <!-- 快速搜索区域 -->
    <div class="relative mb-8 group">
      <div
        class="flex items-center shadow-lg rounded-full overflow-hidden transition-all duration-300 hover:shadow-xl bg-base-100 dark:bg-base-300"
      >
        <div class="pl-4 text-primary/70">
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="请输入订单号/配件编码/车型/配件名称..."
          class="search-input input w-full py-6 px-4 bg-transparent border-0 focus:ring-0 text-lg text-base-content dark:text-white"
          @input="handleInputDebounced"
          @keyup.enter="handleSearch"
          @keyup.down="navigateSuggestions(1)"
          @keyup.up="navigateSuggestions(-1)"
          @keyup.esc="closeSuggestions"
        />
        <!-- 清空按钮 -->
        <button
          v-if="searchKeyword"
          class="pr-4 text-base-content/50 dark:text-white/50 hover:text-base-content dark:hover:text-white transition-colors"
          @click="clearKeyword"
          aria-label="清空输入"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <button
          class="btn btn-primary py-6 px-8 rounded-r-full hover:bg-primary/90 transition-colors"
          @click="handleSearch"
        >
          搜索
        </button>
      </div>
      <div class="flex justify-around items-center h-10">
        <h2>所有供应商代码</h2>
        <div class="codes flex flex-wrap justify-center items-center">
          <div
            v-for="(item, index) in codeKeys"
            :key="item.rtime"
            class="badge badge-soft py-1 mx-1"
            :class="index % 2 === 0 ? 'badge-info' : 'badge-primary'"
          >
            {{ jscodes[item.username] || item.username }}
          </div>
        </div>
      </div>
      <!-- 搜索建议/历史 -->
      <div
        v-if="showSuggestions && (searchSuggestions.length > 0 || searchHistory.length > 0)"
        class="absolute top-full left-0 right-0 mt-2 bg-base-100 dark:bg-base-300 rounded-xl shadow-xl z-50 overflow-hidden animate-slide-down border border-base-200 dark:border-base-400"
      >
        <!-- 搜索建议 -->
        <div v-if="searchSuggestions.length > 0" class="p-2 border-b dark:border-base-200">
          <p class="text-sm text-base-content/70 dark:text-white/70 mb-1 px-1">搜索建议</p>
          <div
            v-for="(suggestion, index) in searchSuggestions"
            :key="`suggest-${index}`"
            class="px-3 py-3 hover:bg-base-200 dark:hover:bg-base-200 cursor-pointer rounded-lg m-1 transition-colors text-base-content dark:text-white"
            :class="{ 'bg-primary/10 dark:bg-primary/20': activeSuggestionIndex === index }"
            @click="selectSuggestion(suggestion)"
            @mouseenter="activeSuggestionIndex = index"
          >
            <span v-html="highlightMatch(suggestion)"></span>
          </div>
        </div>

        <!-- 搜索历史 -->
        <div v-if="searchHistory.length > 0" class="p-2">
          <div class="flex justify-between items-center mb-1 px-1">
            <p class="text-sm text-base-content/70 dark:text-white/70">最近搜索</p>
            <button
              class="text-xs text-primary hover:text-primary/80 transition-colors"
              @click="clearHistory"
            >
              清空历史
            </button>
          </div>
          <div
            v-for="(history, index) in searchHistory"
            :key="`history-${index}`"
            class="px-3 py-3 hover:bg-base-200 dark:hover:bg-base-200 cursor-pointer rounded-lg m-1 transition-colors flex justify-between items-center text-base-content dark:text-white"
            @click="selectSuggestion(history)"
          >
            <span v-html="highlightMatch(history)"></span>
            <button
              class="text-xs text-base-content/50 dark:text-white/50 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20"
              @click.stop="deleteHistory(index)"
              aria-label="删除记录"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索结果区域 -->
    <div v-if="isSearching" class="py-10">
      <!-- 骨架屏 -->
      <div
        v-for="i in 3"
        :key="i"
        class="mb-6 p-6 rounded-xl border border-base-200 dark:border-base-400 animate-pulse bg-base-100 dark:bg-base-300"
      >
        <div class="flex justify-between mb-4">
          <div class="h-6 bg-base-200 dark:bg-base-400 rounded w-1/4"></div>
          <div class="h-5 bg-base-200 dark:bg-base-400 rounded w-1/6"></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="h-4 bg-base-200 dark:bg-base-400 rounded w-3/4"></div>
          <div class="h-4 bg-base-200 dark:bg-base-400 rounded w-2/3"></div>
          <div class="h-4 bg-base-200 dark:bg-base-400 rounded w-1/2"></div>
          <div class="h-4 bg-base-200 dark:bg-base-400 rounded w-1/3"></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="h-4 bg-base-200 dark:bg-base-400 rounded w-2/5"></div>
          <div class="h-4 bg-base-200 dark:bg-base-400 rounded w-1/4"></div>
          <div class="h-4 bg-base-200 dark:bg-base-400 rounded w-1/5"></div>
        </div>
      </div>
    </div>

    <!-- 订单结果列表 -->
    <div v-else-if="searchResults.length > 0" class="space-y-6">
      <!-- 结果统计和排序 -->
      <div
        class="flex flex-wrap justify-between items-center mb-6 gap-3 p-4 bg-base-100 dark:bg-base-300 rounded-xl border border-base-200 dark:border-base-400"
      >
        <div>
          <p class="text-base-content dark:text-white font-medium">
            找到 <span class="text-primary text-lg">{{ searchResults.length }}</span> 条入库订单
          </p>
          <p class="text-sm text-base-content/60 dark:text-white/60 mt-1">
            关键词："{{ searchKeyword }}"
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-base-content/70 dark:text-white/70">排序方式：</span>
          <select
            class="select select-sm select-bordered rounded-lg bg-base-100 dark:bg-base-400 text-base-content dark:text-white border-base-200 dark:border-base-500"
            v-model="sortType"
            @change="sortResults"
          >
            <option value="relevance">按相关性</option>
            <option value="time">按入库时间 ↓</option>
            <option value="price">按单价 ↓</option>
          </select>
        </div>
      </div>

      <!-- 订单卡片列表 -->
      <div class="grid grid-cols-1 gap-6">
        <div
          v-for="(order, index) in searchResults"
          :key="index"
          class="result-card rounded-xl border border-base-200 dark:border-base-400 shadow-sm hover:shadow-md transition-all duration-300 bg-base-100 dark:bg-base-300 overflow-hidden"
        >
          <!-- 卡片头部 -->
          <div
            class="bg-primary/5 dark:bg-primary/10 px-6 py-4 border-b border-base-200 dark:border-base-400 flex flex-wrap justify-between items-center gap-3"
          >
            <div>
              <h3 class="text-lg font-semibold text-primary flex items-center gap-2">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                {{ order.order_id }}
              </h3>
              <p class="text-sm text-base-content/60 dark:text-white/60 mt-1">
                <span class="mr-4"
                  ><i class="fa-solid fa-clock mr-1"></i> 入库时间：{{ order.rtime }}</span
                >
                <span><i class="fa-solid fa-warehouse mr-1"></i> 仓库：{{ order.username }}</span>
              </p>
            </div>
            <div class="flex items-center gap-4">
              <span class="badge badge-lg badge-success">{{ order.orderstate }}</span>
              <span class="badge badge-outline">{{ order.type }}</span>
            </div>
          </div>

          <!-- 卡片主体 -->
          <div class="px-6 py-5 text-base-content dark:text-white">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="space-y-2">
                <h4 class="text-sm text-base-content/60 dark:text-white/60 font-medium">
                  配件编码
                </h4>
                <p class="text-lg font-medium">{{ order.jfcode }}</p>
              </div>
              <div class="space-y-2">
                <h4 class="text-sm text-base-content/60 dark:text-white/60 font-medium">
                  配件名称
                </h4>
                <p class="text-lg font-medium">{{ order.name }}</p>
              </div>
              <div class="space-y-2">
                <h4 class="text-sm text-base-content/60 dark:text-white/60 font-medium">
                  品牌/规格
                </h4>
                <p class="text-base">{{ order.pp }} / {{ order.description }}</p>
              </div>
              <div class="space-y-2">
                <h4 class="text-sm text-base-content/60 dark:text-white/60 font-medium">
                  车型关联
                </h4>
                <p class="text-base truncate">{{ order.mcode }}</p>
              </div>
            </div>

            <div class="my-4 border-t border-base-200 dark:border-base-400"></div>

            <!-- 价格库存信息 -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div class="space-y-2">
                <h4 class="text-sm text-base-content/60 dark:text-white/60 font-medium">
                  采购数量
                </h4>
                <p class="text-xl font-bold text-primary">{{ order.rsum }} 件</p>
              </div>
              <div class="space-y-2">
                <h4 class="text-sm text-base-content/60 dark:text-white/60 font-medium">
                  单价（元）
                </h4>
                <p class="text-xl font-bold">{{ parseFloat(order.price).toFixed(2) }}</p>
              </div>
              <div class="space-y-2">
                <h4 class="text-sm text-base-content/60 dark:text-white/60 font-medium">
                  库存数量
                </h4>
                <p
                  class="text-xl font-bold"
                  :class="
                    order.inventory < 10
                      ? 'text-red-500 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  "
                >
                  {{ order.inventory }} 件
                </p>
              </div>
            </div>

            <!-- 总价信息 -->
            <div class="mt-4 text-right">
              <p class="text-base-content/70 dark:text-white/70 text-sm">合计金额</p>
              <p class="text-2xl font-bold text-primary">
                {{ parseFloat(order.total_moeny).toFixed(2) }} 元
              </p>
            </div>
          </div>

          <!-- 卡片底部 -->
          <div
            class="px-6 py-3 bg-base-50 dark:bg-base-400 border-t border-base-200 dark:border-base-400 flex justify-end gap-3"
          >
            <button class="btn btn-sm btn-outline btn-primary text-base-content dark:text-white">
              <i class="fa-solid fa-eye mr-1"></i> 查看详情
            </button>
            <button class="btn btn-sm btn-outline btn-secondary text-base-content dark:text-white">
              <i class="fa-solid fa-download mr-1"></i> 导出
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 无结果提示 -->
    <div
      v-else-if="hasSearched"
      class="text-center py-16 bg-base-100 dark:bg-base-300 rounded-2xl border border-base-200 dark:border-base-400"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-20 w-20 mx-auto text-base-content/20 dark:text-white/20 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 class="text-xl font-medium mb-2 text-base-content dark:text-white">未找到相关入库订单</h3>
      <p class="text-base-content/70 dark:text-white/70 mb-6 max-w-md mx-auto">
        抱歉，没有找到 "{{ searchKeyword }}"
        相关的汽配入库订单，你可以尝试更换关键词（如订单号、配件编码、车型）或检查拼写。
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <button
          class="btn btn-primary hover:bg-primary/90 transition-colors text-white"
          @click="clearAll"
        >
          重新搜索
        </button>
        <button
          class="btn btn-outline text-base-content dark:text-white"
          @click="showHotKeywords = true"
        >
          查看热门搜索
        </button>
      </div>

      <!-- 热门关键词 -->
      <div v-if="showHotKeywords" class="mt-8">
        <p class="text-sm text-base-content/70 dark:text-white/70 mb-3">热门搜索</p>
        <div class="flex flex-wrap justify-center gap-2">
          <button
            v-for="keyword in hotKeywords"
            :key="keyword"
            class="btn btn-xs btn-ghost bg-base-200 dark:bg-base-400 hover:bg-base-300 dark:hover:bg-base-500 text-base-content dark:text-white"
            @click="selectSuggestion(keyword)"
          >
            {{ keyword }}
          </button>
        </div>
      </div>
    </div>

    <!-- 初始提示 -->
    <div
      v-else
      class="text-center py-16 bg-base-100 dark:bg-base-300 rounded-2xl border border-base-200 dark:border-base-400"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-20 w-20 mx-auto text-primary/20 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <h3 class="text-xl font-medium mb-2 text-base-content dark:text-white">检索汽配入库订单</h3>
      <p class="text-base-content/70 dark:text-white/70 mb-6 max-w-md mx-auto">
        输入订单号、配件编码、车型、配件名称等关键词，快速查询入库订单信息
      </p>
      <!-- 快捷搜索标签 -->
      <div class="flex flex-wrap justify-center gap-2">
        <button
          v-for="keyword in hotKeywords.slice(0, 6)"
          :key="keyword"
          class="btn btn-sm btn-ghost hover:bg-base-200 dark:hover:bg-base-400 transition-colors text-base-content dark:text-white"
          @click="selectSuggestion(keyword)"
        >
          {{ keyword }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { debounce } from 'lodash-es'
import jscodes from '@/stores/jfcodes.json'
import { searchApi } from '@/api'
// 假设已引入jQuery和layer（如果项目中已存在，可忽略）
// import $ from 'jquery'
// import layer from 'layui-layer'

/**
 * @file SearchPage.vue
 * @description 汽配入库订单搜索页面（集成Excel导出功能）
 * @author 豆包编程助手
 * @date 2025-12-14
 * @features Excel导出、高级搜索、暗黑主题适配、卡片式展示
 */

// 响应式数据 - 搜索关键词
const searchKeyword = ref('')
// 响应式数据 - 高级搜索参数（对应导出接口参数）
const searchParams = ref({
  jfcode: '', // 配件编码
  name: '', // 配件名称
  start: '', // 开始时间
  end: '', // 结束时间
  order: '', // 订单号
  agent: '', // 代理商/仓库
})
// 供应商去重后的搜索列表
const codeKeys = ref([])
// 响应式数据 - 搜索建议列表
const searchSuggestions = ref([])
// 响应式数据 - 搜索历史记录
const searchHistory = ref([])
// 响应式数据 - 搜索结果列表
const searchResults = ref([])
// 响应式数据 - 搜索加载状态
const isSearching = ref(false)
// 响应式数据 - 是否已执行搜索
const hasSearched = ref(false)
// 响应式数据 - 排序类型
const sortType = ref('relevance')
// 响应式数据 - 是否为深色主题
const isDarkTheme = ref(false)
// 响应式数据 - 是否显示搜索建议框
const showSuggestions = ref(true)
// 响应式数据 - 键盘导航选中的建议索引
const activeSuggestionIndex = ref(-1)
// 响应式数据 - 是否显示热门关键词
const showHotKeywords = ref(false)

// 热门关键词（业务定制）
const hotKeywords = ref([
  'ZR20251212',
  'AD-C0001',
  '奥迪Q7L',
  '控制臂',
  '哈尔滨仓',
  '独立采购入库',
  '中性配件',
  '已入库',
])

// 模拟搜索建议数据
const mockSuggestions = [
  'ZR20251212',
  'AD-C0001',
  '奥迪Q7L',
  '控制臂前下左',
  '哈尔滨仓',
  '独立采购入库',
  'VW-B0001',
  '大众途观L',
]

/**
 * 高亮匹配文本
 * @param {string} text - 原始文本
 * @returns {string} 高亮后的HTML文本
 */
const highlightMatch = (text) => {
  if (!searchKeyword.value) return text
  const reg = new RegExp(`(${searchKeyword.value})`, 'gi')
  return text.replace(
    reg,
    `<span class="text-primary font-medium dark:text-primary">${searchKeyword.value}</span>`,
  )
}

/**
 * 处理快速搜索输入事件
 * @returns {void}
 */
const handleInput = () => {
  if (!searchKeyword.value.trim()) {
    searchSuggestions.value = []
    activeSuggestionIndex.value = -1
    return
  }
  // 过滤匹配的建议
  searchSuggestions.value = mockSuggestions.filter((item) =>
    item.toLowerCase().includes(searchKeyword.value.toLowerCase()),
  )
}

// 防抖处理后的输入事件
const handleInputDebounced = debounce(handleInput, 300)

/**
 * 键盘导航搜索建议
 * @param {number} direction - 导航方向（1:下，-1:上）
 * @returns {void}
 */
const navigateSuggestions = (direction) => {
  const total = searchSuggestions.value.length + searchHistory.value.length
  if (total === 0) return

  activeSuggestionIndex.value += direction

  // 循环导航边界处理
  if (activeSuggestionIndex.value >= total) activeSuggestionIndex.value = 0
  if (activeSuggestionIndex.value < 0) activeSuggestionIndex.value = total - 1

  // 滚动到选中项
  const activeEl = document.querySelector(
    `[class*="activeSuggestionIndex === ${activeSuggestionIndex.value}"]`,
  )
  if (activeEl) {
    activeEl.scrollIntoView({ block: 'nearest' })
  }
}

/**
 * 关闭搜索建议框
 * @returns {void}
 */
const closeSuggestions = () => {
  showSuggestions.value = false
  setTimeout(() => {
    showSuggestions.value = true
    activeSuggestionIndex.value = -1
  }, 100)
}

/**
 * 清空快速搜索关键词
 * @returns {void}
 */
const clearKeyword = () => {
  searchKeyword.value = ''
  searchSuggestions.value = []
  activeSuggestionIndex.value = -1
}

/**
 * 清空所有搜索条件
 * @returns {void}
 */
const clearAll = () => {
  searchKeyword.value = ''
  searchParams.value = {
    jfcode: '',
    name: '',
    start: '',
    end: '',
    order: '',
    agent: '',
  }
  searchSuggestions.value = []
  activeSuggestionIndex.value = -1
  hasSearched.value = false
  searchResults.value = []
}

/**
 * 选择搜索建议
 * @param {string} keyword - 选中的关键词
 * @returns {void}
 */
const selectSuggestion = (keyword) => {
  searchKeyword.value = keyword
  showSuggestions.value = false
  setTimeout(() => {
    handleSearch()
    showSuggestions.value = true
  }, 100)
}

/**
 * 执行快速搜索
 * @returns {void}
 */
const handleSearch = () => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) return

  // 历史记录逻辑（保留）
  updateSearchHistory(keyword)

  hasSearched.value = true
  isSearching.value = true
  showHotKeywords.value = false

  searchApi(1, 10, keyword)
    .then((res) => {
      console.log(res.data.length)
      let netArr = []
      searchResults.value =
        res.data.data.map((item, index) => {
          if (Number(res.data[index].rsum) > 0) {
            codeKeys.value.push(res.data[index])
          }

          return {
            ...item,
            price: res.data[index].price,
            total_moeny: res.data[index].total_moeny,
          }
        }) || []

      console.log(netArr)
    })
    .catch((err) => {
      console.error('快速搜索失败：', err)
      alert('搜索出错，请稍后重试')
      searchResults.value = []
    })
    .finally(() => {
      isSearching.value = false
    })
}

// 抽离历史记录更新逻辑（复用）
const updateSearchHistory = (keyword) => {
  const historyIndex = searchHistory.value.indexOf(keyword)
  if (historyIndex > -1) searchHistory.value.splice(historyIndex, 1)
  searchHistory.value.unshift(keyword)
  if (searchHistory.value.length > 8) searchHistory.value.pop()
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

/**
 * 执行高级搜索
 * @returns {void}
 */
const handleAdvancedSearch = async () => {
  hasSearched.value = true
  isSearching.value = true
  try {
    // 真实接口请求（替换模拟逻辑）
    const res = await searchApi(1, 10, searchParams.value.jfcode)
    let filteredResults = res.data || []

    console.log(filteredResults)

    // 条件过滤逻辑（保留）
    if (searchParams.value.jfcode) {
      filteredResults = filteredResults.filter((item) =>
        item.jfcode.toLowerCase().includes(searchParams.value.jfcode.toLowerCase()),
      )
    }
    // ... 其他过滤条件

    searchResults.value = filteredResults
  } catch (error) {
    // 新增错误处理
    console.error('高级搜索失败：', error)
    alert('搜索失败，请重试！') // 可替换为 UI 组件提示
  } finally {
    isSearching.value = false // 无论成功/失败都关闭加载
  }
}

/**
 * 排序搜索结果
 * @returns {void}
 */
const sortResults = () => {
  if (sortType.value === 'relevance') {
    handleSearch()
  } else if (sortType.value === 'time') {
    // 按入库时间降序
    searchResults.value = [...searchResults.value].sort(
      (a, b) => new Date(b.rtime) - new Date(a.rtime),
    )
  } else if (sortType.value === 'price') {
    // 按单价降序
    searchResults.value = [...searchResults.value].sort(
      (a, b) => parseFloat(b.price) - parseFloat(a.price),
    )
  }
}

/**
 * 清空搜索历史
 * @returns {void}
 */
const clearHistory = () => {
  if (confirm('确定要清空搜索历史吗？')) {
    searchHistory.value = []
    localStorage.removeItem('searchHistory')
  }
}

/**
 * 删除单条搜索历史
 * @param {number} index - 历史记录索引
 * @returns {void}
 */
const deleteHistory = (index) => {
  searchHistory.value.splice(index, 1)
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

/**
 * 导出Excel功能（适配你的原有接口）
 * @description 完全兼容原有导出逻辑，先校验数据再跳转导出接口
 * @returns {void}
 */
const exportExcel = () => {
  // 获取导出参数
  const { jfcode, name, start, end, order, agent } = searchParams.value

  // 1. 先调用校验接口
  const checkUrl = '/order/api.php?s=/api/warehouse/export_warehousing_excel'

  // 模拟AJAX请求（实际项目中替换为jQuery的$.post）
  // 这里使用fetch模拟，如需jQuery可替换为注释中的代码
  fetch(checkUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      jfcode,
      name,
      start,
      end,
      order,
      agent,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      // 2. 校验数据是否存在
      if (data.data && data.data.length > 0) {
        // 3. 拼接导出URL并打开
        const exportUrl = `/api/home/warehouse/export_warehousing_excel&${new URLSearchParams({
          jfcode,
          name,
          start,
          end,
          order,
          agent,
        }).toString()}`

        // 打开新窗口下载
        window.open(exportUrl, '_blank')
      } else {
        // 无数据提示（使用layer或原生alert）
        if (window.layer) {
          alert('无数据！请选择条件后导出')
        } else {
          alert('无数据！请选择条件后导出')
        }
      }
    })
    .catch((error) => {
      console.error('导出校验失败：', error)
      if (window.layer) {
        alert('导出失败，请重试！')
      } else {
        alert('导出失败，请重试！')
      }
    })

  // ---- 如果你项目中使用jQuery，可替换为以下代码 ----
  /*
  $.post('/order/api.php?s=/api/warehouse/export_warehousing_excel',
    {
      'jfcode': jfcode,
      'name': name,
      'start': start,
      'end': end,
      'order': order,
      'agent': agent
    }, function (data) {
      if(data.data.length > 0){
        var urls = '/order/api.php?s=/home/warehouse/export_warehousing_excel' + 
          '&jfcode=' + jfcode + 
          '&name=' + name + 
          '&start=' + start + 
          '&end=' + end + 
          '&order=' + order + 
          '&agent=' + agent;
        window.open(urls);
      }else{
        layer.msg('无数据！请选择条件后导出');
      }
    })
  */
}

/**
 * 点击空白处关闭建议框
 * @param {MouseEvent} e - 鼠标事件对象
 * @returns {void}
 */
const handleClickOutside = (e) => {
  const searchContainer = document.querySelector('.group')
  if (searchContainer && !searchContainer.contains(e.target)) {
    showSuggestions.value = false
    setTimeout(() => {
      showSuggestions.value = true
      activeSuggestionIndex.value = -1
    }, 100)
  }
}

/**
 * 组件挂载钩子
 * @returns {void}
 */
onMounted(() => {
  // 恢复历史记录
  const savedHistory = localStorage.getItem('searchHistory')
  if (savedHistory) {
    searchHistory.value = JSON.parse(savedHistory)
  }

  // 恢复主题设置
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDarkTheme.value = true
    document.documentElement.classList.add('dark')
  }

  // 绑定全局点击事件
  document.addEventListener('click', handleClickOutside)

  // 引入Font Awesome图标
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css'
    document.head.appendChild(link)
  }
})

/**
 * 组件卸载钩子
 * @returns {void}
 */
onUnmounted(() => {
  // 移除全局点击监听
  document.removeEventListener('click', handleClickOutside)
  // 取消防抖函数
  handleInputDebounced.cancel()
})

/**
 * 监听搜索关键词变化
 * @param {string} newVal - 新的关键词值
 * @returns {void}
 */
watch(searchKeyword, (newVal) => {
  if (newVal) {
    showSuggestions.value = true
  }
})

defineOptions({
  name: 'searchPage',
})
</script>

<style scoped>
/* 基础动画 */
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

.animate-slide-down {
  animation: slideDown 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 暗黑主题高亮样式 */
:deep(.text-primary) {
  color: var(--daisy-primary) !important;
  font-weight: 500;
}

/* 订单卡片交互效果 */
.result-card {
  transform: translateY(0);
}

.result-card:hover {
  transform: translateY(-2px);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .search-input {
    font-size: 16px !important;
  }

  .result-card .grid {
    gap: 4px !important;
  }

  .result-card h4 {
    font-size: 12px !important;
  }

  .result-card p {
    font-size: 14px !important;
  }
}

/* 滚动条优化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background-color: var(--daisy-base-400) !important;
  border-radius: 4px;
}

::-webkit-scrollbar-track {
  background-color: var(--daisy-base-200) !important;
}

/* 暗黑主题变量覆盖 */
:deep(.dark) {
  --daisy-primary: #3b82f6;
  --daisy-base-100: #1f2937;
  --daisy-base-200: #111827;
  --daisy-base-300: #374151;
  --daisy-base-400: #4b5563;
  --daisy-base-500: #6b7280;
  --daisy-content: #f9fafb;
}

/* 确保暗黑模式文本可见 */
:deep(.dark textarea),
:deep(.dark input),
:deep(.dark select),
:deep(.dark button),
:deep(.dark span),
:deep(.dark p),
:deep(.dark h1),
:deep(.dark h2),
:deep(.dark h3),
:deep(.dark h4) {
  color: var(--daisy-content) !important;
}

/* 暗黑模式背景色 */
:deep(.dark .bg-base-100) {
  background-color: var(--daisy-base-300) !important;
}
:deep(.dark .bg-base-200) {
  background-color: var(--daisy-base-400) !important;
}
:deep(.dark .bg-base-300) {
  background-color: var(--daisy-base-200) !important;
}
:deep(.dark .bg-base-400) {
  background-color: var(--daisy-base-100) !important;
}

/* 暗黑模式边框色 */
:deep(.dark .border-base-200) {
  border-color: var(--daisy-base-400) !important;
}
:deep(.dark .border-base-400) {
  border-color: var(--daisy-base-500) !important;
}
</style>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { debounce } from 'lodash-es'
import jscodes from '@/stores/jfcodes.json'
import { searchApi, searchInfoApi, searchApi2 } from '@/api'
import { alertError } from '@/utils/alertPopup'
import { useRoute, useRouter } from 'vue-router'
import evBus from '@/utils/evBus'

/**
 * @file SearchPage.vue
 * @description 汽配入库订单搜索页面（集成Excel导出功能）
 * @author 7z
 * @date 2025-12-14
 * @features Excel导出、高级搜索、暗黑主题适配、卡片式展示
 */

// 响应式数据 - 搜索关键词
const searchKeyword = ref('')
// 响应式数据 - 高级搜索参数（对应导出接口参数）
const searchParams = ref({
  jfcode: '', // 配件编码
  start: '', // 开始时间
  end: '', // 结束时间
  order: '', // 订单号
  agent: '', // 代理商/仓库
})
// 供应商去重后的搜索列表（初始化为空对象）
const codeKeys = ref({
  uniqueCodes: [],
  codeCount: {},
})
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

// 库位信息
const numInfo = ref({})
// 编码信息 产品详细信息
const carInfoList = ref([])

// 热门关键词（业务定制）
const hotKeywords = ref(['正辉', '全贸', '飞众', '展基'])

// 模拟搜索建议数据
const mockSuggestions = ['XD-C0042']
// 是否启用搜索api2 深度搜索
const isApi2 = ref(true)

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

  // 滚动到选中项（修复选择器语法错误）
  const activeEl = document.querySelector(`[data-index="${activeSuggestionIndex.value}"]`)
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
    start: '',
    end: '',
    order: '',
    agent: '',
  }
  searchSuggestions.value = []
  activeSuggestionIndex.value = -1
  hasSearched.value = false
  searchResults.value = []
  // 清空codeKeys
  codeKeys.value = { uniqueCodes: [], codeCount: {} }
  numInfo.value = {}
}

/**
 * 选择搜索建议
 * @param {string} keyword - 选中的关键词
 * @returns {void}
 */
const selectSuggestion = (keyword) => {
  searchParams.value.agent = keyword // 修复：选中建议赋给搜索关键词，更符合用户直觉
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
const handleSearch = async () => {
  const keyword = searchKeyword.value.trim()

  // 空关键词且无代理/厂家条件时，不执行搜索
  if (!searchParams.value.agent && !searchParams.value.factory && !keyword) return

  // 历史记录逻辑（保留）
  updateSearchHistory(keyword)

  hasSearched.value = true
  isSearching.value = true
  showHotKeywords.value = false

  // 接口1：获取搜索结果
  const p1 = searchApi(
    1,
    10,
    keyword,
    searchParams.value.start,
    searchParams.value.end,
    searchParams.value.agent, // 传代理商参数
  )
    .then((res) => {
      // 临时数组：收集所有符合条件的username
      const tempCodeList = []

      // 处理搜索结果
      searchResults.value = res.data.map((item, index) => {
        // 仅收集rsum>0的username
        if (Number(item.rsum) > 0) {
          tempCodeList.push(item.username)
        }
        return {
          ...item,
          price: res[index].price,
          total_moeny: res[index].total_moeny,
        }
      })

      // 核心逻辑：生成去重代码列表 + 次数统计
      const uniqueCodes = [...new Set(tempCodeList)]
      const codeCount = {}
      tempCodeList.forEach((code) => {
        codeCount[code] = (codeCount[code] || 0) + 1
      })

      // 赋值给codeKeys
      codeKeys.value = { uniqueCodes, codeCount }
    })
    .catch((err) => {
      console.error('快速搜索失败：', err)
      alertError('搜索出错，请稍后重试')
      searchResults.value = []
      codeKeys.value = { uniqueCodes: [], codeCount: {} }
    })
    .finally(() => {
      isSearching.value = false
    })

  // 接口2：获取搜索统计信息
  const p2 = searchInfoApi(keyword)
    .then((res) => {
      console.log(res.data)
      carInfoList.value = res.data
      console.log(carInfoList.value)
      numInfo.value = res.data.map((item) => {
        return item?.number !== '未入库只有商品资料' ? item : false
      })
    })
    .catch((err) => {
      console.error('获取搜索统计信息失败：', err)
      numInfo.value = {}
    })
  // 并行执行两个接口
  await Promise.all([p1, p2])

  evBus.emit('navMsg', numInfo.value[0]?.mcode?.split('/'))
}

// 抽离历史记录更新逻辑（复用）
const updateSearchHistory = (keyword) => {
  if (!keyword) return // 空关键词不记录
  const historyIndex = searchHistory.value.indexOf(keyword)
  if (historyIndex > -1) searchHistory.value.splice(historyIndex, 1)
  searchHistory.value.unshift(keyword)
  if (searchHistory.value.length > 8) searchHistory.value.pop()
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

/**
 * 排序搜索结果
 * @returns {void}
 */
const sortResults = () => {
  if (sortType.value === 'relevance') {
    handleSearch()
  } else if (sortType.value === 'time' && searchResults.value.length) {
    // 按入库时间降序
    searchResults.value = [...searchResults.value].sort(
      (a, b) => new Date(b.rtime || 0) - new Date(a.rtime || 0), // 兼容无时间字段
    )
  } else if (sortType.value === 'price' && searchResults.value.length) {
    // 按单价降序
    searchResults.value = [...searchResults.value].sort(
      (a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0), // 兼容无价格字段
    )
  }
}

/**
 * 导出Excel功能（适配你的原有接口）
 * @returns {void}
 */
const exportExcel = () => {
  if (!searchResults.value.length) {
    alertError('暂无数据可导出')
    return
  }
  // 获取导出参数
  const { jfcode, start, end, order, agent } = searchParams.value
  console.log('导出参数：', {
    jfcode,
    start,
    end,
    agent,
    order,
    keyword: searchKeyword.value,
  })
  // 此处补充实际的导出逻辑，例如：
  // window.open(`/api/export?jfcode=${jfcode}&factory=${factory}&start=${start}&end=${end}&agent=${agent}&order=${order}&keyword=${searchKeyword.value}`)
}

/**
 * 点击空白处关闭建议框
 * @param {MouseEvent} e - 鼠标事件对象
 * @returns {void}
 */
const handleClickOutside = (e) => {
  const searchContainer = document.querySelector('.search-container') // 修复选择器
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
  try {
    const savedHistory = localStorage.getItem('searchHistory')
    if (savedHistory) {
      searchHistory.value = JSON.parse(savedHistory)
    }
  } catch (e) {
    console.error('恢复搜索历史失败：', e)
    searchHistory.value = []
  }

  // 恢复主题设置
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDarkTheme.value = true
    document.documentElement.classList.add('dark')
  }

  // 绑定全局点击事件
  document.addEventListener('click', handleClickOutside)

  // 引入Font Awesome 4.x图标（修复图标不显示问题）
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
  name: 'SearchPage',
})
</script>

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
        <i class="fa fa-file-excel-o mr-2"></i> 导出Excel
        <!-- 修复图标类名 -->
      </button>
    </div>

    <!-- 高级搜索条件（修复重复绑定问题） -->
    <div
      class="mb-6 p-4 bg-base-100 dark:bg-base-300 rounded-xl border border-base-200 dark:border-base-400"
    >
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
        <!-- 代理商/仓库（绑定agent字段） -->
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
      <fieldset class="fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4">
        <legend class="fieldset-legend">深度搜索</legend>
        <label class="label">
          <input type="checkbox" checked="isApi2" disabled v-model="isApi2" class="toggle" />
          开启后可通过车型搜索，默认编码
        </label>
      </fieldset>
    </div>

    <!-- 快速搜索区域（添加search-container类） -->
    <div class="relative mb-8 group search-container">
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

      <!-- 库位和供应商代码展示（修复codeKeys渲染逻辑） -->
      <div class="card shadow m-4">
        <div class="card-body">
          <!-- 库位信息 -->
          <!-- <div v-if="Object.keys(numInfo).length">
            <p class="font-bold text-primary">库位:{{ numInfo.number || '未知' }}</p>
            <p class="font-bold text-primary">库存:{{ numInfo.avl_sum || 0 }}</p>
            <p class="font-bold text-primary">商品名称:{{ numInfo.name || '未知' }}</p>
          </div> -->
          <ul class="list bg-base-100 rounded-box shadow-md">
            <li class="p-4 pb-2 text-xs opacity-60 tracking-wide" v-if="numInfo[0]?.number">
              <p class="text-xl">产品信息</p>
            </li>
            <div class="card p-2">
              <p class="px-4 texl-md font-bold">车型关联</p>
              <div class="flex flex-wrap w-full p-2">
                <button
                  v-for="(item, index) in numInfo[0]?.mcode?.split('/')"
                  :key="item"
                  class="btn btn-sm m-1 btn-dash flex items-center gap-2"
                  :class="index % 2 === 0 ? 'btn-secondary' : 'btn-warning'"
                >
                  {{ item }}
                </button>
              </div>
              <p class="px-4 texl-md font-bold">库位信息</p>
              <li class="list-row" v-for="item in numInfo" :key="item.name" v-show="item.sum >= 1">
                <div v-if="item.sum >= 1">
                  <div>
                    <!-- <img
                  class="size-10 rounded-box"
                  src="https://img.daisyui.com/images/profile/demo/1@94.webp"
                /> -->
                    <div className=" bg-base-300 text-neutral-content  w-fit rounded-full">
                      <span className="text-3xl w-full font-bold text-accent text-shadow-2xs"
                        >{{ item.sum }} PCS</span
                      >
                    </div>
                  </div>
                  <div>
                    <div>{{ item.number }}</div>
                    <div class="text-xs uppercase font-semibold opacity-60">{{ item.name }}</div>
                  </div>
                </div>
              </li>

              <!-- 供应商代码展示（核心修复：遍历uniqueCodes数组） -->
              <p class="px-4 texl-md font-bold">所有供应商代码</p>
              <h2 class="w-full font-bold py-1"></h2>
              <div class="codes flex-1 flex-wrap gap-2 justify-center items-center">
                <div class="flex w-fit p-4 items-center flex-wrap">
                  <button
                    v-for="(code, index) in codeKeys.uniqueCodes"
                    :key="code"
                    @click="useRouter().push({ path: '/time', param: { name: code } })"
                    class="btn btn-sm m-1 btn-dash flex items-center gap-2"
                    :class="index % 2 === 0 ? 'btn-info' : 'btn-primary'"
                  >
                    {{ jscodes[code] || code }}
                    <!-- 显示次数 -->
                    <div class="badge badge-sm badge-secondary">
                      {{ codeKeys.codeCount[code] || 0 }}
                    </div>
                  </button>
                </div>
                <router-view></router-view>
                <!-- 优先取映射值，无则显示原代码 -->
                <p v-if="!codeKeys.uniqueCodes.length" class="text-base-content/50">
                  暂无供应商代码
                </p>
              </div>
            </div>
          </ul>
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
    <div v-else-if="searchResults.length || carInfoList.length > 0" class="space-y-6">
      <!-- 结果统计和排序 -->
      <div
        class="flex flex-wrap justify-between items-center mb-6 gap-3 p-4 bg-base-100 dark:bg-base-300 rounded-xl border border-base-200 dark:border-base-400"
      >
        <div>
          <p class="text-base-content dark:text-white font-medium">
            找到
            <span class="text-primary text-lg">{{
              searchResults.length || carInfoList.length
            }}</span>
            条{{ searchResults.length ? '入库订单' : '车型记录' }}
          </p>
          <p class="text-sm text-base-content/60 dark:text-white/60 mt-1">
            关键词："{{ searchKeyword || '无' }}"
          </p>
        </div>
        <div class="flex items-center w-[50%] gap-3">
          <span class="text-sm w-full text-base-content/70 dark:text-white/70">排序方式：</span>
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
          v-for="(order, index) in searchResults.length ? searchResults : carInfoList"
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
                {{ order.order_id || '未知订单号' }}
              </h3>
              <p class="text-sm text-base-content/60 dark:text-white/60 mt-1">
                <span class="mr-4"
                  ><i class="fa fa-clock-o mr-1"></i> 入库时间：{{ order.rtime || '未知' }}</span
                >
                <span
                  ><i class="fa fa-warehouse mr-1"></i> 仓库：{{ order.username || '未知' }}</span
                >
              </p>
            </div>
            <div class="flex items-center gap-4">
              <span class="badge badge-lg badge-success">{{ order.orderstate || '未知状态' }}</span>
              <span class="badge badge-outline">{{ order.type || '未知类型' }}</span>
            </div>
          </div>

          <!-- 卡片主体 -->
          <div class="px-6 py-5 text-base-content dark:text-white">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="space-y-2">
                <h4 class="text-sm text-base-content/60 dark:text-white/60 font-medium">
                  配件编码
                </h4>
                <p class="text-lg font-medium">{{ order.jfcode || '未知' }}</p>
              </div>
              <div class="space-y-2">
                <h4 class="text-sm text-base-content/60 dark:text-white/60 font-medium">
                  配件名称
                </h4>
                <p class="text-lg font-medium">{{ order.name || '未知' }}</p>
              </div>
              <div class="space-y-2">
                <h4 class="text-sm text-base-content/60 dark:text-white/60 font-medium">
                  品牌/规格
                </h4>
                <p class="text-base">{{ order.pp || '未知' }} / {{ order.description || '无' }}</p>
              </div>
              <div class="space-y-2">
                <h4 class="text-sm text-base-content/60 dark:text-white/60 font-medium">
                  车型关联
                </h4>
                <p class="text-base truncate">{{ order.mcode || '无' }}</p>
              </div>
            </div>

            <div class="my-4 border-t border-base-200 dark:border-base-400"></div>

            <!-- 价格库存信息 -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div class="space-y-2">
                <h4 class="text-sm text-base-content/60 dark:text-white/60 font-medium">
                  采购数量
                </h4>
                <p class="text-xl font-bold text-primary">{{ order.rsum || 0 }} 件</p>
              </div>
              <div class="space-y-2">
                <h4 class="text-sm text-base-content/60 dark:text-white/60 font-medium">
                  单价（元）
                </h4>
                <p class="text-xl font-bold">{{ parseFloat(order.price || 0).toFixed(2) }}</p>
              </div>
              <div class="space-y-2">
                <h4 class="text-sm text-base-content/60 dark:text-white/60 font-medium">
                  库存数量
                </h4>
                <p
                  class="text-xl font-bold"
                  :class="
                    (order.inventory || 0) < 10
                      ? 'text-red-500 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  "
                >
                  {{ order.inventory || 0 }} 件
                </p>
              </div>
            </div>

            <!-- 总价信息 -->
            <div class="mt-4 text-right">
              <p class="text-base-content/70 dark:text-white/70 text-sm">合计金额</p>
              <p class="text-2xl font-bold text-primary">
                {{ parseFloat(order.total_moeny || 0).toFixed(2) }} 元
              </p>
            </div>
          </div>

          <!-- 卡片底部 -->
          <div
            class="px-6 py-3 bg-base-50 dark:bg-base-400 border-t border-base-200 dark:border-base-400 flex justify-end gap-3"
          >
            <button class="btn btn-sm btn-outline btn-primary text-base-content dark:text-white">
              <i class="fa fa-eye mr-1"></i> 查看详情
            </button>
            <button class="btn btn-sm btn-outline btn-secondary text-base-content dark:text-white">
              <i class="fa fa-download mr-1"></i> 导出
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
      <div class="flex flex-wrap justify-center">
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
</style>

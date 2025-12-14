<template>
  <div class="bom-charts-wrapper">
    <!-- 自适应容器：根据屏幕宽度自动调整列数 -->
    <div class="echarts-grid" ref="gridRef">
      <!-- 1. 成品/零件SKU数量对比 -->
      <div class="chart-card" ref="skuChartRef"></div>
      <!-- 2. 制单人单据量统计 -->
      <div class="chart-card" ref="makerChartRef"></div>
      <!-- 3. 出库状态分布 -->
      <div class="chart-card" ref="outboundChartRef"></div>
      <!-- 4. 零件下单数量TOP5 -->
      <div class="chart-card" ref="orderQtyChartRef"></div>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { ref, onMounted, onUnmounted, nextTick, watchEffect } from 'vue'

// ========== 1. 基础引用 & 实例管理 ==========
const gridRef = ref(null)
const skuChartRef = ref(null)
const makerChartRef = ref(null)
const outboundChartRef = ref(null)
const orderQtyChartRef = ref(null)

// 存储图表实例
let chartInstances = {
  sku: null,
  maker: null,
  outbound: null,
  orderQty: null,
}

// 防抖函数：避免resize频繁触发
function debounce(fn, delay = 300) {
  let timer = null
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

// ========== 2. 原始数据 ==========
const bomData = [
  {
    id: 1,
    type: 'BOM生产加工单',
    orderNo: 'BOM201344512065979',
    createTime: '2025-12-06 15:48:54',
    remark: '戈尔德N-692合肥加货',
    productSkuCount: 27,
    partSkuCount: 47,
    partOrderQty: 398,
    maker: '邵碗',
    outboundStatus: '出库中',
    preStartDate: '2025-12-06',
    preFinishDate: '2025-12-07',
  },
  {
    id: 2,
    type: 'BOM生产加工单',
    orderNo: 'BOM201344512065138',
    createTime: '2025-12-06 09:23:41',
    remark: 'KKJ-艾莫瑞N-862武汉杨哲',
    productSkuCount: 104,
    partSkuCount: 105,
    partOrderQty: 754,
    maker: '叶宁静',
    outboundStatus: '待出库',
    preStartDate: '2025-12-06',
    preFinishDate: '2025-12-07',
  },
  {
    id: 3,
    type: 'BOM生产加工单',
    orderNo: 'BOM201344512066776',
    createTime: '2025-12-06 09:17:38',
    remark: '艾莫瑞N-862武汉杨哲球头',
    productSkuCount: 180,
    partSkuCount: 201,
    partOrderQty: 2940,
    maker: '叶宁静',
    outboundStatus: '待出库',
    preStartDate: '2025-12-06',
    preFinishDate: '2025-12-07',
  },
  {
    id: 4,
    type: 'BOM生产加工单',
    orderNo: 'BOM201344512067100',
    createTime: '2025-12-06 09:16:04',
    remark: '艾莫瑞N-862武汉杨哲控制臂',
    productSkuCount: 95,
    partSkuCount: 110,
    partOrderQty: 702,
    maker: '叶宁静',
    outboundStatus: '待出库',
    preStartDate: '2025-12-06',
    preFinishDate: '2025-12-07',
  },
  {
    id: 5,
    type: 'BOM生产加工单',
    orderNo: 'BOM201344512066219',
    createTime: '2025-12-06 08:24:03',
    remark: '戈尔德N-495昆明龚丽江球头',
    productSkuCount: 93,
    partSkuCount: 115,
    partOrderQty: 3904,
    maker: '叶宁静',
    outboundStatus: '待出库',
    preStartDate: '2025-12-06',
    preFinishDate: '2025-12-07',
  },
  {
    id: 6,
    type: 'BOM生产加工单',
    orderNo: 'BOM201344512062319',
    createTime: '2025-12-06 08:23:03',
    remark: '戈尔德N-495昆明龚丽江控制臂',
    productSkuCount: 116,
    partSkuCount: 136,
    partOrderQty: 1552,
    maker: '叶宁静',
    outboundStatus: '出库中',
    preStartDate: '2025-12-06',
    preFinishDate: '2025-12-07',
  },
]

// ========== 3. 图表初始化 & 自适应核心逻辑 ==========
// 初始化单个图表
function initSingleChart(refEl, chartType) {
  if (!refEl || refEl.clientWidth === 0 || refEl.clientHeight === 0) {
    console.warn(`【${chartType}】容器尺寸异常，跳过初始化`)
    return null
  }

  // 销毁旧实例
  if (chartInstances[chartType]) {
    chartInstances[chartType].dispose()
  }

  // 创建新实例
  const chart = echarts.init(refEl)

  // 根据类型设置配置项
  switch (chartType) {
    case 'sku':
      setSkuOption(chart)
      break
    case 'maker':
      setMakerOption(chart)
      break
    case 'outbound':
      setOutboundOption(chart)
      break
    case 'orderQty':
      setOrderQtyOption(chart)
      break
  }

  return chart
}

// 批量初始化所有图表
function initAllCharts() {
  chartInstances.sku = initSingleChart(skuChartRef.value, 'sku')
  chartInstances.maker = initSingleChart(makerChartRef.value, 'maker')
  chartInstances.outbound = initSingleChart(outboundChartRef.value, 'outbound')
  chartInstances.orderQty = initSingleChart(orderQtyChartRef.value, 'orderQty')
}

// 适配所有图表尺寸
const resizeAllCharts = debounce(() => {
  Object.values(chartInstances).forEach((chart) => {
    chart?.resize({
      animation: { duration: 200 }, // 平滑resize动画
    })
  })
})

// ========== 4. 图表配置项（自适应优化版） ==========
// 4.1 成品/零件SKU数量对比
function setSkuOption(chart) {
  const xAxisData = bomData.map((item) => item.orderNo.slice(-4))
  const productSkuData = bomData.map((item) => item.productSkuCount)
  const partSkuData = bomData.map((item) => item.partSkuCount)

  chart.setOption({
    title: { text: '成品/零件SKU数量对比', left: 'center', fontSize: '14px' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['成品SKU数量', '零件SKU数量'], bottom: 0, textStyle: { fontSize: '12px' } },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '15%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: {
        rotate: 30,
        fontSize: '11px',
        // 自适应：小屏幕隐藏部分标签（可选）
        interval: () => (window.innerWidth < 768 ? 1 : 0),
      },
    },
    yAxis: { type: 'value', name: '数量', nameTextStyle: { fontSize: '12px' } },
    series: [
      {
        name: '成品SKU数量',
        type: 'bar',
        data: productSkuData,
        itemStyle: { color: '#5470c6' },
      },
      {
        name: '零件SKU数量',
        type: 'bar',
        data: partSkuData,
        itemStyle: { color: '#91cc75' },
      },
    ],
    // 自适应响应式配置
    responsive: {
      screenAdapter: {
        breakpoints: [768, 992, 1200],
        config: [
          {
            // 小屏
            legend: { bottom: '5%' },
            xAxis: { axisLabel: { fontSize: '10px' } },
          },
          {
            // 中屏
            legend: { bottom: '3%' },
            xAxis: { axisLabel: { fontSize: '11px' } },
          },
          {
            // 大屏
            legend: { bottom: '0' },
            xAxis: { axisLabel: { fontSize: '12px' } },
          },
        ],
      },
    },
  })
}

// 4.2 制单人单据量统计
function setMakerOption(chart) {
  const makerCount = {}
  bomData.forEach((item) => {
    makerCount[item.maker] = (makerCount[item.maker] || 0) + 1
  })
  const seriesData = Object.entries(makerCount).map(([name, value]) => ({ name, value }))

  chart.setOption({
    title: { text: '制单人单据量统计', left: 'center', fontSize: '14px' },
    tooltip: { trigger: 'item' },
    legend: {
      orient: window.innerWidth < 768 ? 'horizontal' : 'vertical',
      left: window.innerWidth < 768 ? 'center' : 'left',
      bottom: window.innerWidth < 768 ? 0 : 'auto',
      textStyle: { fontSize: '12px' },
    },
    series: [
      {
        name: '单据数量',
        type: 'pie',
        radius: window.innerWidth < 768 ? ['30%', '60%'] : ['40%', '70%'],
        center: ['50%', '50%'],
        data: seriesData,
        label: {
          show: true,
          fontSize: '11px',
          formatter: '{b}: {c}单 ({d}%)',
        },
      },
    ],
  })
}

// 4.3 出库状态分布
function setOutboundOption(chart) {
  const statusCount = {}
  bomData.forEach((item) => {
    statusCount[item.outboundStatus] = (statusCount[item.outboundStatus] || 0) + 1
  })
  const seriesData = Object.entries(statusCount).map(([name, value]) => ({ name, value }))

  chart.setOption({
    title: { text: '出库状态分布', left: 'center', fontSize: '14px' },
    tooltip: { trigger: 'item' },
    legend: {
      orient: window.innerWidth < 768 ? 'horizontal' : 'vertical',
      left: window.innerWidth < 768 ? 'center' : 'left',
      bottom: window.innerWidth < 768 ? 0 : 'auto',
      textStyle: { fontSize: '12px' },
    },
    series: [
      {
        name: '单据数量',
        type: 'pie',
        radius: window.innerWidth < 768 ? ['30%', '60%'] : ['40%', '70%'],
        center: ['50%', '50%'],
        data: seriesData,
        label: {
          show: true,
          fontSize: '11px',
          formatter: '{b}: {c}单 ({d}%)',
        },
        itemStyle: {
          color: (params) => ['#fac858', '#ee6666'][params.dataIndex],
        },
      },
    ],
  })
}

// 4.4 零件下单数量TOP5
function setOrderQtyOption(chart) {
  const sortedData = [...bomData].sort((a, b) => b.partOrderQty - a.partOrderQty)
  const top5Data = sortedData.slice(0, 5)

  const yAxisData = top5Data.map((item) => {
    const shortNo = item.orderNo.slice(-4)
    const shortRemark =
      item.remark.length > (window.innerWidth < 768 ? 6 : 10)
        ? item.remark.slice(0, window.innerWidth < 768 ? 6 : 10) + '...'
        : item.remark
    return `${shortNo}(${shortRemark})`
  })
  const xAxisData = top5Data.map((item) => item.partOrderQty)

  chart.setOption({
    title: { text: '零件下单数量TOP5', left: 'center', fontSize: '14px' },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const item = top5Data[params[0].dataIndex]
        return `
          <div>单号：${item.orderNo}</div>
          <div>备注：${item.remark}</div>
          <div>下单数量：${item.partOrderQty}</div>
        `
      },
    },
    grid: {
      left: window.innerWidth < 768 ? '25%' : '20%',
      right: '5%',
      top: '10%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: { type: 'value', name: '下单数量', nameTextStyle: { fontSize: '12px' } },
    yAxis: {
      type: 'category',
      data: yAxisData,
      axisLabel: {
        fontSize: window.innerWidth < 768 ? '10px' : '11px',
        overflow: 'truncate',
      },
    },
    series: [
      {
        name: '零件下单数量',
        type: 'bar',
        data: xAxisData,
        itemStyle: { color: '#73c0de' },
        label: {
          show: true,
          position: 'right',
          fontSize: '11px',
          formatter: '{c}',
        },
      },
    ],
  })
}

// ========== 5. 生命周期 & 监听 ==========
onMounted(async () => {
  await nextTick()

  // 初始化图表
  initAllCharts()

  // 监听窗口resize
  window.addEventListener('resize', resizeAllCharts)

  // 监听容器尺寸变化（兼容父容器动态调整）
  if (gridRef.value) {
    const resizeObserver = new ResizeObserver(
      debounce(() => {
        initAllCharts() // 容器尺寸变了，重新初始化（比resize更彻底）
      }),
    )
    resizeObserver.observe(gridRef.value)

    // 销毁时取消监听
    onUnmounted(() => {
      resizeObserver.unobserve(gridRef.value)
    })
  }

  // 响应式样式监听（可选：配合CSS变量）
  watchEffect(() => {
    const isMobile = window.innerWidth < 768
    document.documentElement.style.setProperty('--chart-font-size', isMobile ? '11px' : '12px')
  })
})

onUnmounted(() => {
  // 销毁所有图表实例
  Object.values(chartInstances).forEach((chart) => chart?.dispose())
  // 移除窗口监听
  window.removeEventListener('resize', resizeAllCharts)
})

defineOptions({
  name: 'dataPage',
})
</script>

<style scoped>
.bom-charts-wrapper {
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}

/* 自适应网格布局：根据屏幕宽度调整列数 */
.echarts-grid {
  display: grid;
  /* 大屏：2列，中屏：2列，小屏：1列 */
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 16px;
  width: 100%;
}

/* 图表卡片：自适应父容器尺寸 */
.chart-card {
  width: 100%;
  /* 自适应高度：基于容器宽度的比例 + 最小高度 */
  height: clamp(300px, 40vh, 450px);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
  padding: 8px;
}

/* 响应式断点优化 */
@media (max-width: 768px) {
  .bom-charts-wrapper {
    padding: 8px;
  }
  .echarts-grid {
    gap: 12px;
  }
  .chart-card {
    height: clamp(250px, 35vh, 400px);
  }
}

@media (max-width: 480px) {
  .chart-card {
    height: clamp(200px, 30vh, 350px);
  }
}

/* 全局CSS变量：统一控制字体 */
:deep(html) {
  --chart-font-size: 12px;
}
</style>

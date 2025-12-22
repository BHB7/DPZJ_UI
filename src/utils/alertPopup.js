// src/utils/alertPopup.js
import { createVNode, render } from 'vue'
import AlertPopup from '@/components/AlertPopup/index.vue'

// 全局弹窗容器
let container = null

/**
 * 显示 DaisyUI 风格弹窗
 * @param {Object} options - 配置项
 * @param {string} options.type - success/info/warning/error
 * @param {string} options.message - 提示文本
 * @param {number} [options.duration=3000] - 自动关闭时间
 */
export const showAlert = (options) => {
  console.log(options)

  // 创建容器（首次调用初始化）
  if (!container) {
    container = document.createElement('div')
    document.body.appendChild(container)
  }

  // 唯一标识，避免重复渲染
  const key = `alert-${Date.now()}-${Math.random().toString(36).slice(2)}`

  // 创建虚拟节点
  const vnode = createVNode(AlertPopup, {
    ...options,
    key,
    onClose: () => {
      // 销毁弹窗（清理 DOM）
      render(null, container)
    },
  })

  // 渲染组件
  render(vnode, container)
}

// 快捷方法（对应 DaisyUI 四种类型）
export const alertSuccess = (message, duration = 3000) => {
  showAlert({ type: 'success', message, duration })
}

export const alertInfo = (message, duration = 3000) => {
  showAlert({ type: 'info', message, duration })
}

export const alertWarning = (message, duration = 3000) => {
  showAlert({ type: 'warning', message, duration })
}

export const alertError = (message, duration = 3000) => {
  showAlert({ type: 'error', message, duration })
}

// 全局挂载插件（方便组件内调用）
export default {
  install: (app) => {
    app.config.globalProperties.$alert = {
      success: alertSuccess,
      info: alertInfo,
      warning: alertWarning,
      error: alertError,
    }
  },
}

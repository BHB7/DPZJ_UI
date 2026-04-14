// 发布订阅模式核心
class EventBus {
  constructor() {
    this.events = {} // 存放所有事件
  }

  // 订阅（监听）
  on(name, callback) {
    if (!this.events[name]) {
      this.events[name] = []
    }
    this.events[name].push(callback)
  }

  // 发布（触发）
  emit(name, ...args) {
    if (!this.events[name]) return
    this.events[name].forEach((cb) => cb(...args))
  }

  // 取消订阅
  off(name, callback) {
    if (!this.events[name]) return
    this.events[name] = this.events[name].filter((cb) => cb !== callback)
  }
}

export default new EventBus()

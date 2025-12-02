// 本地存储封装
export const storage = {
  // 设置
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('LocalStorage set error:', e)
    }
  },
  
  // 获取
  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : defaultValue
    } catch (e) {
      console.error('LocalStorage get error:', e)
      return defaultValue
    }
  },
  
  // 删除
  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.error('LocalStorage remove error:', e)
    }
  },
  
  // 清空
  clear() {
    try {
      localStorage.clear()
    } catch (e) {
      console.error('LocalStorage clear error:', e)
    }
  }
}
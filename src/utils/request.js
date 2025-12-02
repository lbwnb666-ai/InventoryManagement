import axios from 'axios'

// 创建axios实例
const request = axios.create({
  baseURL: process.env.NODE_ENV === 'development' 
    ? 'https://localhost:7268/'  // 开发环境
    : 'http://192.168.8.178:88/', //'https://dev-b.papain.net', // 生产环境  'https://dev-b.papain.net',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加token到请求头
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 根据你的后端返回结构调整
    const { code, message, data } = response.data
    
    if (code === 200) {
      return data // 返回后端data内的数据
    } else {
      // 使用后端返回的 message 信息
      const errorMsg = message || '请求失败'
      // 创建错误对象，包含后端返回的 message
      const error = new Error(errorMsg)
      error.code = code
      error.originalMessage = message
      return Promise.reject(error)
    }
  },
  (error) => {
    // 处理HTTP错误状态码
    let errorMessage = '网络错误，请稍后重试'
    
    if (error.response) {
      // 尝试获取后端返回的错误信息
      const backendMessage = error.response.data?.message
      
      if (backendMessage) {
        errorMessage = backendMessage
      } else {
        switch (error.response.status) {
          case 401:
            errorMessage = '登录已过期，请重新登录'
            localStorage.removeItem('token')
            localStorage.removeItem('userInfo')
            window.location.href = '/login'
            break
          case 403:
            errorMessage = '没有权限访问'
            break
          case 404:
            errorMessage = '请求地址不存在'
            break
          case 500:
            errorMessage = '服务器内部错误'
            break
          default:
            errorMessage = `请求失败 (${error.response.status})`
        }
      }
    } else if (error.request) {
      errorMessage = '网络连接失败，请检查网络'
    }
    
    // 创建统一的错误对象
    const customError = new Error(errorMessage)
    customError.isNetworkError = true
    return Promise.reject(customError)
  }
)

export default request
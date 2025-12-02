import { defineStore } from 'pinia'
import { userAPI } from '@/api/user'  // 更新导入

//数据流说明：登录成功 → 保存 token → 调用 fetchUserInfo() → 获取用户信息 → 保存到状态和本地存储
export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
    permissions: JSON.parse(localStorage.getItem('permissions') || '[]')
  }),
  
  getters: {
    isLogin: (state) => !!state.token,
    getUserName: (state) => state.userInfo?.userName || state.userInfo?.account || '',
  },
  
  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },
    
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    },
    
    setPermissions(permissions) {
      this.permissions = permissions
      localStorage.setItem('permissions', JSON.stringify(permissions))
    },
    
    // 异步获取用户信息 - 使用新的接口
    async fetchUserInfo(token) {
      try {
        const userInfo = await userAPI.getUserInfo(token)
        this.setUserInfo(userInfo)
        return userInfo
      } catch (error) {
        // 如果获取用户信息失败，清除登录状态
        this.logout()
        throw error
      }
    },
    
    logout() {
      this.token = ''
      this.userInfo = null
      this.permissions = []
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('permissions')
    }
  }
})
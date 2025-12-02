<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
    <AppHeader />   <!-- 底部导航 -->
  </div>
</template>

<script setup>
import { useUserStore } from '@/store'
import AppHeader from '@/components/AppHeader.vue'

const userStore = useUserStore()

// 1. 恢复 token（优先读磁盘，避免响应式未更新）
const saved = localStorage.getItem('token')
if (saved) {
  userStore.setToken(saved)
}

// 2. 自动获取用户信息
if (saved) {
  userStore.fetchUserInfo(saved).catch(error => {
    console.warn('自动获取用户信息失败:', error)
  })
}

</script>

<style>
html, body {
  height: 100%;
  overflow-x: hidden;
}
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

</style>
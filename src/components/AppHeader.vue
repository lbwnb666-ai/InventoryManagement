<template>
  <!-- 底部 TabBar -->
  <van-tabbar  v-if="!hide" v-model="active" active-color="#1989fa" route>
    <van-tabbar-item to="/home" icon="home-o">首页</van-tabbar-item>
    <van-tabbar-item to="/data" icon="bar-chart-o">数据</van-tabbar-item>
    <van-tabbar-item to="/user" icon="user-o">我的</van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { ref ,computed} from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
// 根据当前路由高亮对应 tab
const active = ref(route.path)
const hide = computed(() => ['/login'].includes(route.path))
</script>

<style scoped>
.van-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 999;
  /* 避免底部安全区被遮挡（iPhone X 等刘海屏） */
  padding-bottom: env(safe-area-inset-bottom);
  /* 修复部分浏览器滚动视图下浮动问题 */
  background-color: #fff;
}

</style>
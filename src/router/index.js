import { createRouter, createWebHistory } from 'vue-router'
const router = createRouter({
  history: createWebHistory('/h5/'),
  // 路由配置
  routes : [
    {
      path: '/',
      redirect: '/home'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: {
        title: '登录',
        requiresAuth: false
      }
    },
    {
      path: '/home',
      name: 'Home',
      component: () => import('@/views/home/Index.vue'),
      meta: {
        title: '首页',
        requiresAuth: true
      }
    },
    {
      path: '/data',
      name: 'Data',
      component: () => import('@/views/data/Index.vue'),
      meta: {
        title: '数据',
        requiresAuth: true
      }
    },
    {
      path: '/user',
      name: 'User',
      component: () => import('@/views/user/index.vue'),
      meta: {
        title: '用户',
        requiresAuth: true
      }
    },
    {
      path: '/inventoryOverview',
      name: 'InventoryOverview',
      component: () => import('@/views/data/inventoryOverview.vue'),
      meta: {
        title: '库存总览',
        requiresAuth: true
      }
    },
    {
      path: '/serial',
      name: 'Serial',
      component: () => import('@/views/data/serial.vue'),
      meta: {
        title: '流水查询',
        requiresAuth: true
      }
    },    
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue')
    }
  ],
});


// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title + ' - 管理后台'
  }
  // 检查登录状态
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
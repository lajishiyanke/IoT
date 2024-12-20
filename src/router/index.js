import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: (to) => {
      // 检查是否已登录
      const token = localStorage.getItem('token')
      // 已登录跳转到仪表盘，未登录跳转到登录页
      return token ? '/dashboard' : '/login'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/Dashboard.vue'),
        meta: { 
          requiresAuth: true,
          title: '仪表盘',
          keepAlive: true
        }
      },
      {
        path: 'sensors',
        name: 'Sensors',
        component: () => import('../views/sensors/SensorMonitor.vue'),
        meta: { 
          requiresAuth: true,
          title: '传感器监测'
        }
      },
      {
        path: 'analysis',
        name: 'Analysis',
        component: () => import('../views/analysis/SignalAnalysis.vue'),
        meta: { 
          requiresAuth: true,
          title: '信号分析'
        }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/user/Profile.vue'),
        meta: { 
          requiresAuth: true,
          title: '个人信息'
        }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/settings/Settings.vue'),
        meta: { 
          requiresAuth: true,
          title: '系统设置'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/error/404.vue')
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  console.log('当前路由:', to.path)
  console.log('token状态:', token)
  
  // 需要登录但没有token
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }
  
  // 有token但访问登录页
  if (token && (to.path === '/login' || to.path === '/register')) {
    next('/dashboard')
    return
  }
  
  // 其他情况正常跳转
  next()
})

export default router 
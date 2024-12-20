import { defineStore } from 'pinia'
import { ref } from 'vue'
import router from '../router'
import { logout } from '@/api/user'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo')) || null)

  const setToken = (newToken) => {
    console.log('设置token:', newToken)
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUserInfo = (info) => {
    console.log('设置用户信息:', info)
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  const clearUserData = () => {
    // 清除所有用户相关数据
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('remembered_user')
  }

  const handleLogout = async () => {
    try {
      // 先调用后端退出接口
      await logout()
      
      // 清除本地数据
      clearUserData()
      
      // 跳转到登录页
      await router.replace('/login')
      
      // 提示成功（放在跳转后面，避免提示被跳转打断）
      ElMessage.success('退出登录成功')
      
    } catch (error) {
      console.error('退出登录错误:', error)
      // 即使后端接口失败，也清除本地数据并跳转
      clearUserData()
      await router.replace('/login')
      ElMessage.error('退出登录失败，已清除登录状态')
    }
  }

  return {
    token,
    userInfo,
    setToken,
    setUserInfo,
    handleLogout
  }
})

export const login = (data) => {
  return request({
    url: '/auth/login',
    method: 'post',
    data,
    retry: 3,           // 重试次数
    retryDelay: 1000,   // 重试延迟
    timeout: 20000      // 超时时间
  })
}
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 120000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// 修改刷新token的函数
const refreshToken = async () => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
      {
        token: localStorage.getItem('token')
      }
    )
    const newToken = response.data.token
    localStorage.setItem('token', newToken)
    return newToken
  } catch (error) {
    localStorage.removeItem('token')
    router.replace('/login')
    return null
  }
}

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    
    // 打印详细的请求信息用于调试
    console.log('Request Config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      params: config.params,
      data: config.data,
      token: token
    })
    
    if (token) {
      // 确保token格式正确
      config.headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`
    } else {
      // 如果是需要认证的接口，没有token直接拒绝
      if (!config.url.includes('/auth/')) {
        router.replace('/login')
        return Promise.reject(new Error('No token'))
      }
    }
    
    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }
    
    return config
  },
  error => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('Response Error:', error.response || error)
    
    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.message || '请求失败'
      
      switch (status) {
        case 401:
          // 未认证，清除token并跳转登录
          localStorage.removeItem('token')
          router.replace('/login')
          ElMessage.error('登录已过期，请重新登录')
          break
          
        case 403:
          console.error('权限错误:', error.response)
          ElMessage.error(message)
          // 如果是token问题，清除token并跳转
          if (message.includes('token') || message.includes('Token')) {
            localStorage.removeItem('token')
            router.replace('/login')
          }
          break
          
        case 500:
          ElMessage.error('服务器内部错误，请稍后重试')
          break
          
        default:
          ElMessage.error(message)
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      ElMessage.error('请求发生错误')
    }
    
    return Promise.reject(error)
  }
)

// 修改请求URL格式为符合API文档的格式
const getSensorData = (deviceId, params) => {
  return request({
    url: `/api/sensor-data/device/${deviceId}`,
    method: 'get',
    params
  })
}

export default request 
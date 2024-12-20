import request from '@/utils/request'

// 登录
export const login = (data) => {
  return request({
    url: '/auth/login',
    method: 'post',
    data: {
      username: data.username.trim(),
      password: data.password.trim()
    },
    timeout: 30000,  // 增加超时时间
    retry: 3,        // 启用重试
    retryDelay: 1000 // 重试间隔
  })
}

// 注册
export const register = (data) => {
  return request({
    url: '/auth/register',
    method: 'post',
    data: {
      username: data.username.trim(),
      password: data.password.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      verificationCode: data.verificationCode.trim()
    }
  })
}

// 发送验证码
export const sendVerificationCode = (email) => {
  return request({
    url: '/auth/verification-code',
    method: 'post',
    params: { email: email.trim() }
  })
}

// 重置密码
export const resetPassword = (email, newPassword, verificationCode) => {
  return request({
    url: '/auth/reset-password',
    method: 'post',
    params: {
      email,
      newPassword,
      verificationCode
    }
  })
}

// 获取用户信息
export const getUserInfo = () => {
  return request({
    url: '/auth/user-info',
    method: 'get'
  })
}

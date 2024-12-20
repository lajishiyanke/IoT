import request from '@/utils/request'

// 获取当前用户信息
export const getCurrentUser = () => {
  return request({
    url: '/users/me',
    method: 'get'
  })
}

// 更新用户信息
export const updateUser = (userId, data) => {
  return request({
    url: `/users/updateByUserId/${userId}`,
    method: 'put',
    data
  })
}

// 退出登录
export const logout = () => {
  return request({
    url: '/users/logout',
    method: 'delete',
    headers: {
      token: localStorage.getItem('token'),
      username: localStorage.getItem('username')
    }
  })
}

// 检查登录状态
export const checkLogin = () => {
  return request({
    url: '/users/check-login',
    method: 'get',
    headers: {
      token: localStorage.getItem('token'),
      username: localStorage.getItem('username')
    }
  })
}

// 根据用户名查找用户
export const getUserByUsername = (username) => {
  return request({
    url: `/users/name/${username}`,
    method: 'get'
  })
}

// 根据用户ID查找用户
export const getUserById = (userId) => {
  return request({
    url: `/users/id/${userId}`,
    method: 'get'
  })
}

// 检查用户名是否存在
export const checkUsername = (username) => {
  return request({
    url: `/users/has/${username}`,
    method: 'get'
  })
} 
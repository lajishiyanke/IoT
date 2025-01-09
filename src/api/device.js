import request from '@/utils/request'

// 获取用户的所有设备
export const getUserDevices = () => {
  return request({
    url: '/devices',
    method: 'get'
  })
}

// 获取在线设备
export const getUserOnlineDevices = () => {
  return request({
    url: '/devices/online',
    method: 'get'
  })
}

// 获取设备详情
export const getDevice = (deviceId) => {
  return request({
    url: `/devices/${deviceId}`,
    method: 'get'
  })
}

// 添加设备
export const addDevice = (data) => {
  console.log('添加设备请求数据:', data)
  return request({
    url: '/devices',
    method: 'post',
    data: {
      ...data,
      status: data.deviceStatus
    }
  })
}

// 更新设备信息
export const updateDevice = (deviceId, data) => {
  return request({
    url: `/devices/${deviceId}`,
    method: 'put',
    data
  })
}

// 删除设备
export const deleteDevice = (deviceId) => {
  return request({
    url: `/devices/${deviceId}`,
    method: 'delete'
  })
}

// 获取设备分组树
export const getGroupTree = () => {
  return request({
    url: '/device-management/groups/tree',
    method: 'get'
  })
}

// 获取分组内的设备
export const getDevicesInGroup = (groupId) => {
  return request({
    url: `/device-management/groups/${groupId}/devices`,
    method: 'get'
  })
}

// 创建设备分组
export const createGroup = (data) => {
  return request({
    url: '/device-management/groups',
    method: 'post',
    params: {
      name: data.name,
      description: data.description
    }
  })
}

// 更新设备分组
export const updateGroup = (data) => {
  return request({
    url: '/device-management/groups',
    method: 'put',
    data
  })
}

// 删除设备分组
export const deleteGroup = (groupId) => {
  return request({
    url: `/device-management/groups/${groupId}`,
    method: 'delete'
  })
}

// 添加设备到分组
export const addDeviceToGroup = (groupId, deviceId) => {
  return request({
    url: `/device-management/groups/${groupId}/devices/${deviceId}`,
    method: 'post'
  })
}

// 从分组移除设备
export const removeDeviceFromGroup = (groupId, deviceId) => {
  return request({
    url: `/device-management/groups/${groupId}/devices/${deviceId}`,
    method: 'delete'
  })
}

// 更新设备状态
export const updateDeviceStatus = (deviceId, status) => {
  return request({
    url: `/devices/${deviceId}/status`,
    method: 'put',
    data: {
      status: status
    }
  })
} 
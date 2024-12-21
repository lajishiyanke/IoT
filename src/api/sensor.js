import request from '@/utils/request'

// 获取设备传感器数据
export function getDeviceSensorData(deviceId, params) {
  console.log('走老路:', params)
  // 确保日期格式正确
  const formatDate = (date) => {
    if (date instanceof Date) {
      return date.toISOString().split('.')[0] // 移除毫秒部分，符合ISO.DATE_TIME格式
    }
    return date
  }

  // 处理参数
  const formattedParams = {
    ...params,
    startTime: formatDate(params.startTime),
    endTime: formatDate(params.endTime),
    channelId: String(params.channelId)
  }

  return request({
    url: `/sensor-data/device/${deviceId}`,
    method: 'get',
    params: formattedParams
  })
}

// 获取最新传感器数据
export function getLatestSensorData(deviceId, channelId) {
  return request({
    url: `/sensor-data/device/${deviceId}/latest`,
    method: 'get',
    params: { channelId }
  })
}

// 获取传感器数据统计
export function getSensorDataStats(deviceId, params) {
  return request({
    url: `/sensor-data/device/${deviceId}/stats`,
    method: 'get',
    params
  })
}

// 保存传感器数据
export const saveSensorData = (deviceId, data) => {
  return request({
    url: `/devices/${deviceId}/sensor-data`,
    method: 'post',
    data
  })
}

// 批量保存传感器数据
export const saveBatchSensorData = (deviceId, dataList) => {
  return request({
    url: `/devices/${deviceId}/sensor-data/batch`,
    method: 'post',
    data: dataList
  })
}

// 获取当前用户的所有传感器数据
export function getUserSensorData(params) {
  console.log('走新路:', params)
  // 确保日期格式正确
  const formatDate = (date) => {
    if (date instanceof Date) {
      // 转换为 ISO 格式并移除毫秒部分
      // 输出格式类似：2024-12-21T13:45:31
      return date.toISOString().split('.')[0]
    }
    return date
  }

  // 处理参数
  const formattedParams = {
    ...params,
    // startTime: formatDate(params.startTime),
    // endTime: formatDate(params.endTime),
    channelId: String(params.channelId)
  }

  return request({
    url: '/sensor-data/user-sensor-data',  // 使用新的API路径
    method: 'get',
    params: formattedParams
  })
} 
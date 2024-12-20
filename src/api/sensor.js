import request from '@/utils/request'

// 获取设备的传感器数据
export const getDeviceSensorData = (deviceId, channelId, startTime, endTime) => {
  // 确保日期格式正确
  const formatDate = (date) => {
    if (date instanceof Date) {
      return date.toISOString().split('.')[0] // 移除毫秒部分
    }
    return date
  }

  return request({
    url: `/devices/${deviceId}/sensor-data`,
    method: 'get',
    params: {
      channelId: String(channelId),
      startTime: formatDate(startTime),
      endTime: formatDate(endTime)
    }
  })
}

// 获取最新的传感器数据
export const getLatestSensorData = (deviceId, channelId) => {
  return request({
    url: `/sensor-data/device/${deviceId}/latest`,
    method: 'get',
    params: { channelId }
  })
}

// 获取设备的传感器数据统计
export const getDeviceSensorDataStats = (deviceId, params) => {
  return request({
    url: `/sensor-data/device/${deviceId}/stats`,
    method: 'get',
    params
  })
}

// 保存传感器数据
export const saveSensorData = (data) => {
  return request({
    url: '/sensor-data/save',
    method: 'post',
    data
  })
}

// 批量保存传感器数据
export const saveBatchSensorData = (dataList) => {
  return request({
    url: '/sensor-data/save-batch',
    method: 'post',
    data: dataList
  })
} 
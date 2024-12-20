import request from '@/utils/request'

// 获取设备传感器数据
export function getDeviceSensorData(deviceId, params) {
  return request({
    url: `/sensor-data/device/${deviceId}`,
    method: 'get',
    params
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
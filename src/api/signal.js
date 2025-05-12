import request from '@/utils/request'

// 获取信号文件列表
export function getSignalFiles(deviceId, startTime, endTime) {
  return request({
    url: '/signal/files',
    method: 'get',
    params: {
      deviceId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    }
  })
}

// 下载信号文件
export function downloadSignalFile(fileId) {
  return request({
    url: `/signal/files/${fileId}/download`,
    method: 'get',
    responseType: 'blob'
  })
}

// 获取最新信号数据
export function getLatestSignal(deviceId) {
  return request({
    url: `/signal/latest/${deviceId}`,
    method: 'get'
  })
}

// 获取历史信号数据
export function getSignalHistory(deviceId, startTime, endTime) {
  return request({
    url: '/signal/history',
    method: 'get',
    params: {
      deviceId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    }
  })
} 
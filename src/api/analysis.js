import request from '@/utils/request'

// 获取FFT分析结果
export const getFFTAnalysis = (deviceId, params) => {
  return request({
    url: `/api/analysis/fft/${deviceId}`,
    method: 'get',
    params
  })
}

// 获取趋势分析结果
export const getTrendAnalysis = (deviceId, params) => {
  return request({
    url: `/api/analysis/trend/${deviceId}`,
    method: 'get',
    params
  })
}

// 获取相关性分析结果
export const getCorrelationAnalysis = (deviceId, params) => {
  return request({
    url: `/api/analysis/correlation/${deviceId}`,
    method: 'get',
    params
  })
}

// 获取统计分析结果
export const getStatisticalAnalysis = (deviceId, params) => {
  return request({
    url: `/api/analysis/statistics/${deviceId}`,
    method: 'get',
    params
  })
}

// 执行自定义分析
export const executeCustomAnalysis = (deviceId, data) => {
  return request({
    url: `/api/analysis/custom/${deviceId}`,
    method: 'post',
    data
  })
} 
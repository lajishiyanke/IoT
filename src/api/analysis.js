import request from '@/utils/request'

/**
 * 频谱分析
 * @param {Object} signalDTO 包含时间和幅值数组的对象
 * @returns {Promise<Object>} 返回频率和幅值数组
 */
export function frequencyAnalysis(signalDTO) {
  return request({
    url: '/signal/frequency',
    method: 'post',
    data: signalDTO
  })
}

/**
 * 信号滤波
 * @param {Object} signalDTO 信号数据
 * @param {string} type 滤波类型
 * @param {number} cutoffFreq 截止频率
 * @param {number[]} params 其他参数
 * @returns {Promise<Object>} 返回滤波后的信号
 */
export function filterSignal(signalDTO, type, cutoffFreq, params = []) {
  return request({
    url: '/signal/filter',
    method: 'post',
    data: signalDTO,
    params: {
      type,
      cutoffFreq
    }
  })
}

/**
 * 小波变换
 * @param {Object} waveletRequest 包含信号和尺度的请求对象
 * @returns {Promise<Object>} 返回小波变换结果
 */
export function waveletTransform(waveletRequest) {
  return request({
    url: '/signal/wavelet',
    method: 'post',
    data: waveletRequest
  })
}

/**
 * Python信号处理
 * @param {Object} signalDTO 信号数据
 * @param {string} scriptName 脚本名称
 * @param {Object} params 参数
 * @returns {Promise<number[]>} 返回处理结果
 */
export function processByPython(signalDTO, scriptName, params = {}) {
  return request({
    url: '/signal/python/process',
    method: 'post',
    data: signalDTO,
    params: {
      scriptName
    },
    data: params
  })
} 

/**
 * 信号预测
 * @param {Object} data 包含信号和时间的数据
 * @returns {Promise<Object>} 返回预测结果
 */
export function signalPredict(data) {
  return request({
    url: '/signal/predict',
    method: 'post',
    data
  })
}
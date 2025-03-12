// 创建专门的 Worker 处理数据
self.onmessage = function(e) {
  const { data, config } = e.data
  const processedData = downsampleData(data, config)
  self.postMessage(processedData)
} 
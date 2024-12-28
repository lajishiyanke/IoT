<template>
  <div class="sensor-control">
    <el-card class="control-panel">
      <template #header>
        <div class="panel-header">
          <span>传感器控制面板</span>
          <el-radio-group v-model="selectedChannel" size="small">
            <el-radio-button label="1">通道1</el-radio-button>
            <el-radio-button label="2">通道2</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <div class="control-buttons">
        <el-button 
          type="primary" 
          :loading="isCollecting"
          @click="toggleCollection"
        >
          {{ isCollecting ? '停止采集' : '开始采集' }}
        </el-button>
      </div>

      <!-- 实时数据图表 -->
      <div class="chart-container">
        <v-chart class="chart" :option="chartOption" autoresize />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onBeforeUnmount, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'
import SockJS from 'sockjs-client'
import { Stomp } from '@stomp/stompjs'
import request from '@/utils/request'

// 注册必要的 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

const selectedChannel = ref('1')
const isCollecting = ref(false)

// 图表配置
const chartOption = ref({
  animation: false, // 关闭动画以提高性能
  tooltip: {
    trigger: 'axis',
    formatter: function(params) {
      const data = params[0]
      return `时间：${new Date(data.value[0]).toLocaleString()}<br/>
              数值：${data.value[1].toFixed(2)}`
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'time',
    name: '采集时间',
    axisLabel: {
      formatter: (value) => {
        return new Date(value).toLocaleTimeString()
      }
    }
  },
  yAxis: {
    type: 'value',
    name: '信号值'
  },
  series: [{
    name: '实时数据',
    type: 'line',
    showSymbol: false,
    data: [],
    smooth: true // 平滑曲线
  }]
})

// 替换 WebSocket 变量
let stompClient = null

// 处理接收的数据
const handleData = (data) => {
  try {
    console.log('开始处理数据:', data)
    const parsedData = JSON.parse(data)
    console.log('解析后的数据:', parsedData)
    
    // 验证数��格式
    if (!parsedData.channelId || !parsedData.collectTime || parsedData.dataValue === undefined) {
      console.warn('数据格式不正确:', parsedData)
      return
    }
    
    if (parsedData.channelId === selectedChannel.value) {
      const timestamp = new Date(parsedData.collectTime).getTime()
      const value = Number(parsedData.dataValue)
      
      console.log('处理后的数据点:', [timestamp, value])
      
      // 验证数据值
      if (isNaN(timestamp) || isNaN(value)) {
        console.warn('数据值无效:', { timestamp, value })
        return
      }
      
      // 创建新的数据数组
      const newData = [...chartOption.value.series[0].data]
      newData.push([timestamp, value])
      
      console.log('更新前的数据长度:', chartOption.value.series[0].data.length)
      console.log('新数据长度:', newData.length)
      
      // 保持最近1000个数据点
      if (newData.length > 1000) {
        newData.shift()
      }
      
      // 更新图表数据
      chartOption.value = {
        ...chartOption.value,
        series: [{
          ...chartOption.value.series[0],
          data: newData
        }]
      }
      
      console.log('图表数据已更新，当前数据点数:', chartOption.value.series[0].data.length)
    } else {
      console.log('数据通道不匹配:', parsedData.channelId, '!=', selectedChannel.value)
    }
  } catch (error) {
    console.error('数据处理错误:', error)
  }
}

// 修改连接处理函数
const connectWebSocket = () => {
  try {
    console.log('开始建立WebSocket连接...')
    // 使用完整的URL
    const socket = new SockJS(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/ws`)
    stompClient = Stomp.over(socket)
    
    // 添加连接头信息，如果需要的话
    const headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}` // 如果需要认证
    }
    
    stompClient.connect(headers, frame => {
      console.log('WebSocket 连接成功:', frame)
      isCollecting.value = true
      ElMessage.success('开始采集数据')
      
      // 清空历史数据
      chartOption.value.series[0].data = []
      
      // 确保订阅主题格式正确
      const topic = `/topic/sensor/${selectedChannel.value}`
      console.log('订阅主题:', topic)
      
      stompClient.subscribe(topic, message => {
        console.log('收到消息:', message)
        handleData(message.body)
      }, headers)
    }, error => {
      console.error('STOMP连接错误:', error)
      ElMessage.error('连接错误，请重试')
      isCollecting.value = false
    })
  } catch (error) {
    console.error('连接失败:', error)
    ElMessage.error('连接失败，请重试')
    isCollecting.value = false
  }
}

// 修改开始/停止采集函数
const toggleCollection = async () => {
  if (!isCollecting.value) {
    try {
      // 1. 先获取传感器数据
      const params = {
        channelId: selectedChannel.value
      }
      console.log('发送请求参数:', params)
      
      const response = await request({
        url: '/sensor-data/user-sensor-data',
        method: 'get',
        params
      })
      
      console.log('接收到的数据:', response)
      
      // 2. 处理并显示数据
      if (response && Array.isArray(response)) {
        const chartData = response
          .filter(item => item.channelId === selectedChannel.value)
          .sort((a, b) => new Date(a.collectTime) - new Date(b.collectTime))
          .map(item => [
            new Date(item.collectTime).getTime(),
            Number(item.dataValue)
          ])

        // 更新图表数据
        chartOption.value.series[0].data = chartData
      }

      // 3. 然后建立 WebSocket 连接接收实时数据
      connectWebSocket()
    } catch (error) {
      console.error('启动采集失败:', error)
      ElMessage.error('启动采集失败')
    }
  } else {
    if (stompClient) {
      stompClient.disconnect(() => {
        console.log('WebSocket断开连接')
        isCollecting.value = false
        ElMessage.info('数据采集已停止')
      })
    }
  }
}

// 修改通道切换处理
watch(selectedChannel, (newChannel) => {
  // 清空图表数据
  chartOption.value.series[0].data = []
  
  // 如果正在采集，需要重新连接
  if (isCollecting.value) {
    if (stompClient) {
      stompClient.disconnect(() => {
        // 重新建立WebSocket连接
        connectWebSocket()
      })
    }
  }
})

// 组件挂载时获取初始数据
onMounted(async () => {
  // 即使没有在采集，切换通道时也重新获取历史数据
  await fetchHistoricalData()
})

// 修改组件销毁时的清理
onBeforeUnmount(() => {
  if (stompClient) {
    stompClient.disconnect()
  }
})
</script>

<style lang="scss" scoped>
.sensor-control {
  padding: 20px;
  
  .control-panel {
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .control-buttons {
      margin-bottom: 20px;
      text-align: center;
    }
    
    .chart-container {
      height: 400px;
      
      .chart {
        height: 100%;
      }
    }
  }
}
</style> 
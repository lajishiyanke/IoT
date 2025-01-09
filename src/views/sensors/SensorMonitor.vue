<template>
  <div class="sensor-monitor">
    <!-- 传感器控制面板 -->
    <el-row :gutter="20" class="control-panel">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="panel-header">
              <span>传感器控制面板</span>
              <div class="control-buttons">
                <el-button-group>
                  <el-button
                    type="primary"
                    :icon="CaretRight"
                    :disabled="isStreaming || !selectedDevice"
                    @click="startStream"
                  >
                    开始采集
                  </el-button>
                  <el-button
                    type="warning"
                    :icon="VideoPause"
                    :disabled="!isStreaming"
                    @click="pauseStream"
                  >
                    暂停
                  </el-button>
                  <el-button
                    type="danger"
                    :icon="VideoCamera"
                    :disabled="!isStreaming"
                    @click="stopStream"
                  >
                    停止
                  </el-button>
                </el-button-group>
                
                <el-button-group>
                  <el-button
                    type="success"
                    :icon="Download"
                    @click="downloadData"
                  >
                    导出数据
                  </el-button>
                  <el-button
                    type="info"
                    :icon="Setting"
                    @click="showSettings = true"
                  >
                    参数设置
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :md="8" :sm="12" :xs="24">
              <div class="control-item">
                <span class="label">传感器</span>
                <el-select 
                  v-model="selectedDevice" 
                  placeholder="请选择传感器"
                  class="device-select"
                  @change="handleDeviceChange"
                >
                  <el-option
                    v-for="device in deviceList"
                    :key="device.id"
                    :label="device.deviceName"
                    :value="device.id"
                  />
                </el-select>
              </div>
            </el-col>
            
            <el-col :md="8" :sm="12" :xs="24">
              <div class="control-item">
                <span class="label">通道选择</span>
                <el-select
                  v-model="selectedChannels"
                  multiple
                  collapse-tags
                  :disabled="isStreaming"
                >
                  <el-option
                    v-for="ch in channels"
                    :key="ch.value"
                    :label="ch.label"
                    :value="ch.value"
                  />
                </el-select>
              </div>
            </el-col>
            
            <el-col :md="8" :sm="12" :xs="24">
              <div class="control-item">
                <span class="label">显示时长</span>
                <el-select v-model="timeWindow" @change="handleTimeWindowChange">
                  <el-option label="30秒" value="30" />
                  <el-option label="1分钟" value="60" />
                  <el-option label="5分钟" value="300" />
                  <el-option label="10分钟" value="600" />
                  <el-option label="1小时" value="3600" />
                </el-select>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 信号显示区域 -->
    <el-row :gutter="20" class="signal-display">
      <el-col :span="24">
        <el-card class="chart-card">
          <div class="chart-container">
            <v-chart class="chart" :option="chartOption" autoresize />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据统计面板 -->
    <el-row :gutter="20" class="statistics-panel">
      <el-col :md="12" :sm="24" v-for="channel in selectedChannels" :key="channel">
        <el-card class="stats-card">
          <template #header>
            <div class="stats-header">
              <span>{{ getChannelLabel(channel) }} 统计信息</span>
              <el-tag :type="getChannelStatus(channel).type">
                {{ getChannelStatus(channel).text }}
              </el-tag>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-label">最大值</div>
                <div class="stat-value">{{ channelStats[channel]?.max.toFixed(2) }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-label">最小值</div>
                <div class="stat-value">{{ channelStats[channel]?.min.toFixed(2) }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-label">平均值</div>
                <div class="stat-value">{{ channelStats[channel]?.avg.toFixed(2) }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 告警列表 -->
    <el-card class="alarm-card" v-if="unhandledAlarms.length > 0">
      <template #header>
        <div class="card-header">
          <span>未处理告警</span>
          <el-button type="primary" link @click="$router.push('/alarms')">
            查看全部
          </el-button>
        </div>
      </template>
      
      <el-table :data="unhandledAlarms" style="width: 100%">
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.createTime).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="设备名称" width="150">
          <template #default="{ row }">
            {{ getDeviceName(row.deviceId) }}
          </template>
        </el-table-column>
        <el-table-column prop="channelId" label="通道" width="120" />
        <el-table-column prop="alarmValue" label="告警值" width="120" />
        <el-table-column prop="thresholdValue" label="阈值" width="120" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleAlarm(row)">
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 参数设置对话框 -->
    <el-dialog
      v-model="showSettings"
      title="参数设置"
      width="500px"
    >
      <el-form :model="settings" label-width="100px">
        <el-form-item label="触发阈值">
          <el-input-number
            v-model="settings.threshold"
            :min="0"
            :max="100"
            :step="0.1"
          />
        </el-form-item>
        <el-form-item label="报警延时">
          <el-input-number
            v-model="settings.alarmDelay"
            :min="0"
            :max="60"
            :step="1"
          />
          <span class="unit">秒</span>
        </el-form-item>
        <el-form-item label="滤波设置">
          <el-switch
            v-model="settings.filterEnabled"
            inline-prompt
            active-text="开启"
            inactive-text="关闭"
          />
        </el-form-item>
        <el-form-item label="滤波参数" v-if="settings.filterEnabled">
          <el-slider
            v-model="settings.filterLevel"
            :min="1"
            :max="10"
            show-stops
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSettings = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 告警处理对话框 -->
    <alarm-handle-dialog
      v-model="showAlarmHandle"
      :alarm="currentAlarm"
      @success="handleAlarmSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  CaretRight,
  VideoPause,
  VideoCamera,
  Download,
  Setting
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDeviceSensorData, getLatestSensorData } from '@/api/sensor'
import { WebSocketClient } from '@/utils/websocket'
import { exportExcel } from '@/utils/export'
import { getAlarmRules, setAlarmRule, getUnhandledAlarms } from '@/api/alarm'
import AlarmHandleDialog from '@/components/alarm/AlarmHandleDialog.vue'
import { getUserDevices } from '@/api/device'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent
])

// 状态变量
const isStreaming = ref(false)
const showSettings = ref(false)
const timeWindow = ref('3600')  // 默认1小时，用秒表示
const selectedChannels = ref(['1'])

// 通道配置
const channels = [
  { label: '通道1', value: '1' },
  { label: '通道2', value: '2' },
  { label: '通道3', value: '3' },
  { label: '通道4', value: '4' }
]

// 参数设置
const settings = reactive({
  threshold: 80,
  alarmDelay: 5,
  filterEnabled: false,
  filterLevel: 5
})

// 图表配置
const chartOption = reactive({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
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
    splitLine: {
      show: false
    }
  },
  yAxis: {
    type: 'value',
    name: '',
    nameLocation: 'middle',
    nameGap: 40,
    splitLine: {
      lineStyle: {
        type: 'dashed'
      }
    }
  },
  series: selectedChannels.value.map(ch => ({
    name: `通道${ch}`,
    type: 'line',
    showSymbol: false,
    data: [],
    smooth: true,
    areaStyle: {
      opacity: 0.1
    }
  }))
})

// 统计信息
const channelStats = reactive({})

// WebSocket客户端
const wsClient = ref(null)

// 设备ID
const deviceId = ref(1) // 这里应该从路由或props获取

// 时间范围
const startTime = ref(new Date(Date.now() - 24 * 60 * 60 * 1000)) // 默认24小时前
const endTime = ref(new Date())

// 告警相关
const alarmRules = ref([])
const unhandledAlarms = ref([])

// 告警处理
const showAlarmHandle = ref(false)
const currentAlarm = ref(null)

// 添加设备相关的响应式变量
const deviceList = ref([])
const selectedDevice = ref('')

// 获取设备列表
const fetchDevices = async () => {
  try {
    const response = await getUserDevices()
    if (Array.isArray(response)) {
      deviceList.value = response
      console.log('获取到的设备列表:', response)
    }
  } catch (error) {
    console.error('获取设备列表失败:', error)
    ElMessage.error('获取设备列表失败')
  }
}

// 处理设备选择变化
const handleDeviceChange = () => {
  if (isStreaming.value) {
    stopStream()
  }
  // 重置图表数据
  chartOption.series.forEach(series => {
    series.data = []
  })
}

// 初始化数据
const initData = async () => {
  try {
    // 获取历史数据
    const data = await getDeviceSensorData(deviceId.value, {
      channelId: selectedChannels.value.join(','),
      startTime: startTime.value,
      endTime: endTime.value
    })
    
    // 处理历史数据
    data.forEach(item => {
      const channelIndex = selectedChannels.value.indexOf(item.channelId)
      if (channelIndex !== -1 && chartOption.series[channelIndex]) {
        chartOption.series[channelIndex].data.push([
          new Date(item.collectTime),
          item.dataValue
        ])
      }
    })
  } catch (error) {
    ElMessage.error('获取历史数据失败')
  }
}

// 初始化WebSocket连接
const initWebSocket = () => {
  wsClient.value = new WebSocketClient(`wss://tbwufhpdfuoz.sealoshzh.site/ws/sensor/${deviceId.value}`)
  
  wsClient.value.onMessage(data => {
    if (data.type === 'sensorData') {
      // 更新图表数据
      const channelIndex = selectedChannels.value.indexOf(data.channelId)
      if (channelIndex !== -1 && chartOption.series[channelIndex]) {
        // 添加新的数据点
        chartOption.series[channelIndex].data.push([
          new Date(data.timestamp),
          data.value
        ])
        
        // 保持数据窗口大小
        const windowSize = parseInt(timeWindow.value) * parseInt(sampleRate.value)
        if (chartOption.series[channelIndex].data.length > windowSize) {
          chartOption.series[channelIndex].data.shift()
        }
        
        // 更新统计信息
        updateChannelStats(data.channelId, data.value)
      }
    } else if (data.type === 'deviceStatus') {
      // 更新设备状态
      deviceStatus.value = data.status
    }
  })
}

// 开始采集数据
const startStream = async () => {
  if (!selectedDevice.value || !selectedChannels.value) {
    console.error('设备或通道未选择:', {
      device: selectedDevice.value,
      channels: selectedChannels.value
    })
    return
  }

  try {
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - 1 * 60 * 60 * 1000) // 1小时前
    console.log('开始时间:', startTime)
    console.log('结束时间:', endTime)
    // 将 Proxy(Array) 转换为字符串
    const channelIdString = Array.from(selectedChannels.value).join(',')

    // 添加时区偏移
    const timeZoneOffset = new Date().getTimezoneOffset() * 60000
    const localStartTime = new Date(startTime.getTime() - timeZoneOffset)
    const localEndTime = new Date(endTime.getTime() - timeZoneOffset)

    // 打印完整的请求参数
    console.log('请求参数:', {
      deviceId: selectedDevice.value,
      channelId: channelIdString,  // 使用转换后的字符串
      startTime: localStartTime.toISOString(),
      endTime: localEndTime.toISOString()
    })

    // 发送请求获取传感器数据
    const response = await getDeviceSensorData(selectedDevice.value, {
      channelId: channelIdString,
      startTime: localStartTime.toISOString(),
      endTime: localEndTime.toISOString()
    })

    // 打印响应数据用于调试
    console.log('获取到的原始响应:', response)

    console.log('获取到的通道数据:', channelIdString)
    console.log('获取到的传感器数据:', response)

    if (Array.isArray(response)) {
      // 从第一条数据中获取单位和数据类型信息
      if (response.length > 0) {
        const { dataType, dataUnit } = response[0]
        // 更新图表的y轴标签
        chartOption.yAxis.name = `${dataType}(${dataUnit})`
      }

      // 清空现有数据
      chartOption.series.forEach(series => {
        series.data = []
      })

      // 处理数据并更新图表
      response.forEach(item => {
        const channelIndex = selectedChannels.value.indexOf(item.channelId)
        if (channelIndex !== -1) {
          const timestamp = new Date(item.collectTime).getTime()
          const value = Number(item.dataValue)

          // 添加数据点到对应的通道
          chartOption.series[channelIndex].data.push([timestamp, value])
        }
      })

      // 对每个通道的数据进行时间排序
      chartOption.series.forEach(series => {
        series.data.sort((a, b) => a[0] - b[0])
      })

      // 更新图表
      isStreaming.value = true
      ElMessage.success('开始采集数据')

      // 更新统计信息
      updateStats()
    }
  } catch (error) {
    console.error('获取传感器数据失败:', error)
    ElMessage.error('获取传感器数据失败')
  }
}

// 暂停采集
const pauseStream = () => {
  isStreaming.value = false
  wsClient.value?.send({
    type: 'pauseStream'
  })
}

// 停止采集
const stopStream = async () => {
  try {
    await ElMessageBox.confirm('确定要停止数据采集吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    isStreaming.value = false
    wsClient.value?.send({
      type: 'stopStream'
    })
    
    // 清空数据
    chartOption.series.forEach(series => {
      series.data = []
    })
  } catch {
    // 用户取消
  }
}

// 导出数据
const downloadData = () => {
  try {
    // 更新统计信息
    updateStats()
    
    // 获取当前图表上的数据
    const exportData = []
    
    // 遍历每个通道的数据
    chartOption.series.forEach((series, index) => {
      const channelId = selectedChannels.value[index]
      series.data.forEach(point => {
        exportData.push({
          '时间': new Date(point[0]).toLocaleString(),
          '通道': `通道${channelId}`,
          '幅值': point[1].toFixed(2)
        })
      })
    })

    // 按时间排序
    exportData.sort((a, b) => new Date(a.时间) - new Date(b.时间))
    
    if (exportData.length === 0) {
      ElMessage.warning('没有可导出的数据')
      return
    }

    // 导出Excel
    exportExcel(
      exportData,
      `传感器数据_${new Date().toLocaleString()}.xlsx`
    )
    ElMessage.success('数据导出成功')
  } catch (error) {
    console.error('导出数据失败:', error)
    ElMessage.error('导出数据失败')
  }
}

// 获取告警规则
const fetchAlarmRules = async () => {
  try {
    alarmRules.value = await getAlarmRules(deviceId.value)
  } catch (error) {
    ElMessage.error('获取告警规则失败')
  }
}

// 获取未处理告警
const fetchUnhandledAlarms = async () => {
  try {
    unhandledAlarms.value = await getUnhandledAlarms(deviceId.value)
  } catch (error) {
    ElMessage.error('获取未处理告警失败')
  }
}

// 保存告警设置
const saveSettings = async () => {
  try {
    await setAlarmRule(deviceId.value, {
      channelId: selectedChannels.value[0],
      alarmType: 'threshold',
      ruleType: 'upper',
      ruleName: '阈值告警',
      thresholdValue: settings.threshold,
      alarmLevel: 'warning',
      isEnabled: true
    })
    showSettings.value = false
    ElMessage.success('设置已保存')
    fetchAlarmRules()
  } catch (error) {
    ElMessage.error('保存设置失败')
  }
}

// 检查告警
const checkAlarm = (channelId, value) => {
  const rule = alarmRules.value.find(r => 
    r.channelId === channelId && 
    r.isEnabled &&
    r.ruleType === 'upper'
  )
  
  if (rule && value > rule.thresholdValue) {
    ElMessage.warning(`${getChannelLabel(channelId)}数值超出阈值：${value}`)
  }
}

// 辅助函数
const getChannelLabel = (channel) => {
  return channels.find(ch => ch.value === channel)?.label || channel
}

const getChannelStatus = (channel) => {
  const stats = channelStats[channel]
  if (!stats) return { type: 'info', text: '未知' }
  
  if (stats.max > settings.threshold) {
    return { type: 'danger', text: '异常' }
  }
  return { type: 'success', text: '正常' }
}

// 数据模拟
let dataTimer
const startDataSimulation = () => {
  const interval = 1000 / parseInt(sampleRate.value)
  dataTimer = setInterval(() => {
    const now = new Date()
    selectedChannels.value.forEach(channel => {
      const idx = channels.findIndex(ch => ch.value === channel)
      const value = Math.random() * 100
      
      // 更新图表数据
      if (chartOption.series[idx]) {
        chartOption.series[idx].data.push([now, value])
        
        // 保持数据窗口
        const windowSize = parseInt(timeWindow.value) * parseInt(sampleRate.value)
        if (chartOption.series[idx].data.length > windowSize) {
          chartOption.series[idx].data.shift()
        }
      }
      
      // 更新统计信息
      updateChannelStats(channel, value)
    })
  }, interval)
}

const stopDataSimulation = () => {
  if (dataTimer) {
    clearInterval(dataTimer)
  }
}

// 修改统计信息的计算方法
const calculateChannelStats = (channelIndex) => {
  const channelId = selectedChannels.value[channelIndex]
  const seriesData = chartOption.series[channelIndex]?.data || []
  
  if (seriesData.length === 0) {
    return {
      max: 0,
      min: 0,
      avg: 0
    }
  }

  // 使用图表数据计算统计值
  const values = seriesData.map(point => point[1])
  const max = Math.max(...values)
  const min = Math.min(...values)
  const sum = values.reduce((acc, val) => acc + val, 0)
  const avg = sum / values.length

  // 更新统计信息
  channelStats[channelId] = {
    max,
    min,
    avg
  }

  return channelStats[channelId]
}

// 在数据更新时重新计算统计信息
const updateStats = () => {
  selectedChannels.value.forEach((_, index) => {
    calculateChannelStats(index)
  })
}

const fetchSensorData = async () => {
  try {
    const data = await getDeviceSensorData(deviceId, {
      channelId: selectedChannel,
      startTime: startTime,
      endTime: endTime
    })
    // 处理数据...
  } catch (error) {
    ElMessage.error('获取数据失败')
  }
}

const handleAlarm = (alarm) => {
  currentAlarm.value = alarm
  showAlarmHandle.value = true
}

const handleAlarmSuccess = () => {
  fetchUnhandledAlarms()
}

// 添加时间窗口变化处理函数
const handleTimeWindowChange = async () => {
  if (!selectedDevice.value) return
  
  try {
    // 获取当前时间和选定时间窗口前的时间
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - timeWindow.value * 1000)

    // 获取新时间窗口的数据
    const response = await getDeviceSensorData(selectedDevice.value, {
      channelId: selectedChannels.value,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    })

    if (Array.isArray(response)) {
      // 清空现有数据
      chartOption.series.forEach(series => {
        series.data = []
      })

      // 处理新数据
      response.forEach(item => {
        const channelIndex = selectedChannels.value.indexOf(item.channelId)
        if (channelIndex !== -1) {
          const timestamp = new Date(item.collectTime).getTime()
          const value = Number(item.dataValue)
          chartOption.series[channelIndex].data.push([timestamp, value])
        }
      })

      // 对数据进行时间排序
      chartOption.series.forEach(series => {
        series.data.sort((a, b) => a[0] - b[0])
      })

      // 更新统计信息
      updateStats()
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  }
}

// 根据设备ID获取设备名称
const getDeviceName = (deviceId) => {
  const device = deviceList.value.find(d => d.id === deviceId)
  return device ? device.deviceName : '未知设备'
}

onMounted(() => {
  fetchDevices()
  initData()
  initWebSocket()
  fetchAlarmRules()
  fetchUnhandledAlarms()
})

onBeforeUnmount(() => {
  stopDataSimulation()
  if (wsClient.value) {
    wsClient.value.disconnect()
  }
})
</script>

<style lang="scss" scoped>
.sensor-monitor {
  .control-panel {
    margin-bottom: 20px;
    
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .control-options {
        display: flex;
        align-items: center;
        gap: 16px;

        .device-select {
          width: 200px;
        }
      }
      
      .control-buttons {
        display: flex;
        gap: 16px;
      }
    }
    
    .control-item {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      
      .label {
        width: 80px;
        color: var(--text-regular);
      }
      
      .el-select {
        flex: 1;
      }
    }
  }
  
  .signal-display {
    margin-bottom: 20px;
    
    .chart-card {
      .chart-container {
        height: 400px;
        
        .chart {
          height: 100%;
        }
      }
    }
  }
  
  .statistics-panel {
    .stats-card {
      margin-bottom: 20px;
      
      .stats-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .stat-item {
        text-align: center;
        padding: 16px;
        
        .stat-label {
          color: var(--text-regular);
          margin-bottom: 8px;
        }
        
        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: var(--text-primary);
        }
      }
    }
  }
  
  .alarm-card {
    margin-bottom: 20px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}

.unit {
  margin-left: 8px;
  color: var(--text-regular);
}

// 深色主题适配
.dark-theme {
  .control-panel,
  .signal-display,
  .statistics-panel {
    .el-card {
      background-color: var(--background-color);
    }
  }
}
</style> 
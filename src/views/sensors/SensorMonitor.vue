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
                    :disabled="isStreaming"
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
                <span class="label">采样频率</span>
                <el-select v-model="sampleRate" :disabled="isStreaming">
                  <el-option label="100Hz" value="100" />
                  <el-option label="200Hz" value="200" />
                  <el-option label="500Hz" value="500" />
                  <el-option label="1000Hz" value="1000" />
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
                <el-select v-model="timeWindow">
                  <el-option label="30秒" value="30" />
                  <el-option label="1分钟" value="60" />
                  <el-option label="5分钟" value="300" />
                  <el-option label="10分钟" value="600" />
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
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="alarmType" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.alarmLevel === 'error' ? 'danger' : 'warning'">
              {{ row.alarmType }}
            </el-tag>
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
const sampleRate = ref('100')
const timeWindow = ref('60')
const selectedChannels = ref(['ch1', 'ch2'])

// 通道配置
const channels = [
  { label: '通道1', value: 'ch1' },
  { label: '通道2', value: 'ch2' },
  { label: '通道3', value: 'ch3' },
  { label: '通道4', value: 'ch4' }
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
  legend: {
    data: selectedChannels.value.map(ch => `通道${ch}`)
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
const startStream = () => {
  if (selectedChannels.value.length === 0) {
    ElMessage.warning('请至少选择一个通道')
    return
  }
  
  isStreaming.value = true
  wsClient.value?.send({
    type: 'startStream',
    channels: selectedChannels.value,
    sampleRate: parseInt(sampleRate.value)
  })
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
const downloadData = async () => {
  try {
    // 获取导出数据
    const data = await getDeviceSensorData(deviceId.value, {
      channelId: selectedChannels.value.join(','),
      startTime: startTime.value,
      endTime: endTime.value
    })
    
    // 转换数据格式
    const exportData = data.map(item => ({
      通道: item.channelId,
      数值: item.dataValue,
      单位: item.dataUnit,
      采集时间: new Date(item.collectTime).toLocaleString()
    }))
    
    // 导出Excel
    exportExcel(exportData, `传感器数据_${new Date().toLocaleDateString()}.xlsx`)
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('数据导出失败')
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

const updateChannelStats = (channelId, value) => {
  if (!channelStats[channelId]) {
    channelStats[channelId] = {
      max: value,
      min: value,
      avg: value,
      count: 1,
      sum: value
    }
  } else {
    const stats = channelStats[channelId]
    stats.max = Math.max(stats.max, value)
    stats.min = Math.min(stats.min, value)
    stats.count++
    stats.sum += value
    stats.avg = stats.sum / stats.count
  }
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

onMounted(() => {
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
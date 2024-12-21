<template>
  <div class="dashboard">
    <!-- 添加设备按钮 -->
    <el-button 
      type="primary" 
      class="add-device-btn"
      @click="showAddDeviceDialog = true"
    >
      <el-icon><Plus /></el-icon>
      添加设备
    </el-button>

    <!-- 添加设备对话框 -->
    <el-dialog
      v-model="showAddDeviceDialog"
      title="添加设备"
      width="500px"
    >
      <el-form
        ref="deviceFormRef"
        :model="deviceForm"
        :rules="deviceRules"
        label-width="100px"
      >
        <el-form-item label="设备名称" prop="deviceName">
          <el-input v-model="deviceForm.deviceName" placeholder="请输入设备名称"/>
        </el-form-item>
        
        <el-form-item label="设备编码" prop="deviceCode">
          <el-input v-model="deviceForm.deviceCode" placeholder="请输入设备编码"/>
        </el-form-item>
        
        <el-form-item label="设备类型" prop="deviceType">
          <el-select v-model="deviceForm.deviceType" placeholder="请选择设备类型" class="w-100">
            <el-option label="温度传感器" value="temperature"/>
            <el-option label="湿度传感器" value="humidity"/>
            <el-option label="压力传感器" value="pressure"/>
          </el-select>
        </el-form-item>
        
        <el-form-item label="设备状态" prop="deviceStatus">
          <el-switch
            v-model="deviceForm.deviceStatus"
            :active-value="true"
            :inactive-value="false"
            :active-text="'在线'"
            :inactive-text="'离线'"
          />
        </el-form-item>
        
        <el-form-item label="固件版本" prop="firmwareVersion">
          <el-input v-model="deviceForm.firmwareVersion" placeholder="请输入固件版本"/>
        </el-form-item>
        
        <el-form-item label="设备分组" prop="groupId">
          <el-select v-model="deviceForm.groupId" placeholder="请选择设备分组" class="w-100">
            <el-option
              v-for="group in deviceGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="MQTT主题" prop="mqttTopic">
          <el-input v-model="deviceForm.mqttTopic" placeholder="请输入MQTT主题"/>
        </el-form-item>
        
        <el-form-item label="设备描述" prop="description">
          <el-input
            v-model="deviceForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入设备描述"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDeviceDialog = false">取消</el-button>
          <el-button type="primary" @click="handleAddDevice" :loading="adding">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 数据概览卡片 -->
    <el-row :gutter="20" class="data-overview">
      <el-col :xs="24" :sm="12" :md="8" v-for="card in overviewCards" :key="card.title">
        <el-card class="overview-card" :class="card.type">
          <div class="card-content">
            <el-icon class="card-icon" :size="40">
              <component :is="card.icon" />
            </el-icon>
            <div class="card-info">
              <div class="card-title">{{ card.title }}</div>
              <div class="card-value">{{ card.value }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时信号趋势图 -->
    <el-row :gutter="20" class="charts-container">
      <el-col :xs="24">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>实时信号趋势</span>
              <el-radio-group v-model="selectedChannel" size="small" @change="fetchSensorData">
                <el-radio-button label="channel1">通道1</el-radio-button>
                <el-radio-button label="channel2">通道2</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-content">
            <v-chart class="chart" :option="signalChartOption" autoresize />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, onActivated, watch } from 'vue'
import { useRouter } from 'vue-router'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  Monitor,
  Warning,
  Connection,
  DataAnalysis,
  CaretRight,
  VideoCamera,
  Plus
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { addDevice, getUserDevices, getUserOnlineDevices } from '@/api/device'
import { getUserSensorData } from '@/api/sensor'
import { router } from '@/router'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

// 首先定义所有的响应式变量
const selectedChannel = ref('channel1') // 移到最前面
const startTime = ref(new Date(Date.now() - 3600000)) // 1小时之前
const endTime = ref(new Date())

// 数据概览卡片
const overviewCards = reactive([
  {
    title: '在线设备/总设备数',
    value: '0/0',
    icon: 'Monitor',
    type: 'primary'
  },
  {
    title: '信号质量',
    value: '98%',
    icon: 'Connection',
    type: 'success'
  },
  {
    title: '数据量',
    value: '1.2TB',
    icon: 'DataAnalysis',
    type: 'info'
  }
])

// 信号图表配置
const signalChartOption = ref({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'time',
    name: '时间'
  },
  yAxis: {
    type: 'value',
    name: '幅值'
  },
  series: [
    {
      name: '信号幅值',
      type: 'line',
      data: []
    }
  ]
})

// 然后定义函数
const fetchSensorData = async () => {
  try {
    // 1. 检查登录状态
    const token = localStorage.getItem('token')
    if (!token) {
      ElMessage.error('请先登录')
      router.push('/login')
      return
    }

    // 2. 准备请求参数
    const end = new Date()
    const start = new Date(end.getTime() - 3600000) // 1小时前
    
    const params = {
      channelId: selectedChannel.value,
      //startTime: start.toISOString(), // 需要转换为ISO格式
      //endTime: end.toISOString()
    }
    
    console.log('发送请求参数:', params)
    
    // 3. 发送请求
    const response = await getUserSensorData(params)
    
    console.log('接收到的数据:', response)
    
    // 4. 处理响应数据
    if (response && Array.isArray(response)) {
      const sortedData = response
        .filter(item => item.channelId === selectedChannel.value)
        .sort((a, b) => new Date(a.collectTime) - new Date(b.collectTime))
      
      const chartData = sortedData.map(item => [
        new Date(item.collectTime).getTime(),
        parseFloat(item.dataValue)
      ])
      
      signalChartOption.value = {
        ...signalChartOption.value,
        series: [{
          name: '信号幅值',
          type: 'line',
          data: chartData,
          smooth: true,
          showSymbol: false
        }]
      }
    } else {
      console.warn('响应数据格式不正确:', response)
    }
  } catch (error) {
    console.error('完整错误信息:', error)
    if (error.response) {
      console.error('错误响应:', error.response)
      if (error.response.status === 403) {
        ElMessage.error('没有权限访问此资源，请重新登录')
        localStorage.removeItem('token')
        router.push('/login')
      } else {
        ElMessage.error(`获取数据失败: ${error.response.data?.message || '未知错误'}`)
      }
    } else {
      ElMessage.error('网络请求失败，请检查网络连接')
    }
  }
}

// 定时刷新数据
let refreshTimer = null

// 生命周期钩子
onMounted(() => {
  fetchSensorData() // 初始加载
  refreshTimer = setInterval(fetchSensorData, 10000) // 改为10秒
})

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})

// 监听通道变化
watch(selectedChannel, () => {
  fetchSensorData()
})

// 告警列表数据
const alertList = ref([
  {
    time: '2024-03-20 10:30:00',
    type: 'error',
    typeText: '严重',
    channel: '通道1',
    description: '信号幅超出阈值',
    status: 'pending',
    statusText: '信号处理'
  },
  {
    time: '2024-03-20 09:15:00',
    type: 'warning',
    typeText: '警告',
    channel: '通道2',
    description: '信号质量下降',
    status: 'resolved',
    statusText: '已解决'
  }
])

// 模拟实时数据更新
let timer = null
let statsTimer = null
const updateSignalData = () => {
  const now = new Date()
  const value = Math.random() * 100
  signalChartOption.series[0].data.push([now, value])
  
  // 保持最近 100 个数据点
  if (signalChartOption.series[0].data.length > 100) {
    signalChartOption.series[0].data.shift()
  }
}

// 设备和告警统计数据
const deviceStats = reactive({
  total: 0,
  online: 0,
  offline: 0
})

const alarmStats = reactive({
  total: 0,
  unhandled: 0
})

// 获取设备统计信息
const fetchDeviceStats = async () => {
  try {
    // 获取所有设备列表
    const allDevices = await getUserDevices()
    console.log('所有设备数据:', allDevices)
    
    // 如果没有设备数据，设置默认值
    if (!allDevices || !Array.isArray(allDevices)) {
      deviceStats.total = 0
      deviceStats.online = 0
      deviceStats.offline = 0
      overviewCards[0].value = '0/0'
      return
    }
    
    // 获取在线设备列表
    const onlineDevices = await getUserOnlineDevices()
    console.log('在线设备数据:', onlineDevices)
    
    // 更新统计数据
    const totalCount = allDevices.length
    const onlineCount = Array.isArray(onlineDevices) ? onlineDevices.length : 0
    
    deviceStats.total = totalCount
    deviceStats.online = onlineCount
    deviceStats.offline = totalCount - onlineCount
    
    // 更新概览卡片数据
    overviewCards[0].value = `${onlineCount}/${totalCount}`
    
  } catch (error) {
    console.error('获取设备统计失败:', error)
    if (error.response) {
      switch (error.response.status) {
        case 401:
        case 403:
          ElMessage.error('没有权限访问设备数据，请重新登录')
          localStorage.removeItem('token')
          router.push('/login')
          break
        case 500:
          ElMessage.error('服务器内部错误，请稍后重试')
          break
        default:
          ElMessage.error('获取设备统计失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
  }
}

// 获取告警统计信息
const fetchAlarmStats = async () => {
  try {
    // 获取所有设备的未处理告警
    const devices = await getUserDevices()
    let unhandledCount = 0
    
    for (const device of devices) {
      const alarms = await getUnhandledAlarms(device.id)
      unhandledCount += alarms.length
    }
    
    alarmStats.unhandled = unhandledCount
    
    // 更新概览卡片数据
    overviewCards[1].value = alarmStats.unhandled.toString()
  } catch (error) {
    console.error('获取告警统计失败:', error)
  }
}

// 修改刷新函数
const refreshStats = async () => {
  await fetchDeviceStats()
}

// 在 script setup 顶部添加 WebSocket 客户端引用
const wsClient = ref(null)

// 修改生命周期钩子
onMounted(() => {
  fetchDeviceStats() // 初始加载
  statsTimer = setInterval(fetchDeviceStats, 60000) // 改为1分钟
})

onBeforeUnmount(() => {
  // 清理所有定时器
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (statsTimer) {
    clearInterval(statsTimer)
    statsTimer = null
  }
})

// 添加 onActivated 钩子
onActivated(() => {
  console.log('Dashboard activated')
  // 刷新数据
  refreshStats()
})

// 控制对话框显示
const showAddDeviceDialog = ref(false)
const adding = ref(false)
const deviceFormRef = ref(null)

// 设备表单数据
const deviceForm = reactive({
  deviceName: '',
  deviceCode: '',
  deviceType: '',
  deviceStatus: false,
  firmwareVersion: '',
  groupId: null,
  mqttTopic: '',
  description: ''
})

// 表单验证规则
const deviceRules = {
  deviceName: [
    { required: true, message: '请输入设备名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  deviceCode: [
    { required: true, message: '请输入设备编码', trigger: 'blur' }
  ],
  deviceType: [
    { required: true, message: '请选择设备类型', trigger: 'change' }
  ],
  deviceStatus: [
    { required: true, message: '请选择设备状态', trigger: 'change' }
  ],
  firmwareVersion: [
    { required: true, message: '请输入固件版本', trigger: 'blur' }
  ],
  mqttTopic: [
    { required: true, message: '请输入MQTT主题', trigger: 'blur' }
  ]
}

// 设备分组数据（需要从后端获取）
const deviceGroups = ref([
  { id: 1, name: '分组1' },
  { id: 2, name: '分组2' }
])

// 添加设备
const handleAddDevice = async () => {
  if (!deviceFormRef.value) return
  
  try {
    await deviceFormRef.value.validate()
    adding.value = true
    
    // 转换状态字段
    const formData = {
      ...deviceForm,
      deviceStatus: deviceForm.deviceStatus  // 确保使用 deviceStatus 段
    }
    
    console.log('提交的设备数据:', formData)
    await addDevice(formData)
    
    ElMessage.success('添加设备成功')
    showAddDeviceDialog.value = false
    
    // 重置表单
    deviceFormRef.value.resetFields()
    
    // 刷新统计数据
    await refreshStats()
  } catch (error) {
    console.error('添加设备失败:', error)
    ElMessage.error(error.response?.data?.message || '添加设备失败')
  } finally {
    adding.value = false
  }
}
</script>

<style lang="scss" scoped>
.dashboard {
  .add-device-btn {
    margin-bottom: 20px;
  }
  
  .w-100 {
    width: 100%;
  }
  
  .data-overview {
    margin-bottom: 20px;
    
    .overview-card {
      margin-bottom: 20px;
      
      &.primary .card-icon { color: var(--el-color-primary); }
      &.success .card-icon { color: var(--el-color-success); }
      &.warning .card-icon { color: var(--el-color-warning); }
      &.danger .card-icon { color: var(--el-color-danger); }
      &.info .card-icon { color: var(--el-color-info); }
      
      .card-content {
        display: flex;
        align-items: center;
        
        .card-icon {
          margin-right: 16px;
        }
        
        .card-info {
          .card-title {
            font-size: 14px;
            color: var(--text-regular);
            margin-bottom: 8px;
          }
          
          .card-value {
            font-size: 24px;
            font-weight: bold;
            color: var(--text-primary);
          }
        }
      }
    }
  }
  
  .charts-container {
    margin-bottom: 20px;
    
    .chart-card {
      margin-bottom: 20px;
      
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .chart-content {
        height: 400px;
        
        .chart {
          height: 100%;
        }
      }
    }
  }
  
  .alert-card {
    .alert-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}

// 深色主题适配
.dark-theme {
  .overview-card {
    background-color: var(--background-color);
  }
  
  .chart-card,
  .alert-card {
    background-color: var(--background-color);
  }
}
</style> 
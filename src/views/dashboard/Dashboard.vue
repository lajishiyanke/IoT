<template>
  <div class="dashboard">
    <!-- 添加设备按钮 -->
    <div class="action-buttons">
      <el-button 
        type="primary" 
        class="action-btn"
        @click="openAddDeviceDialog"
      >
        <el-icon><Plus /></el-icon>
        添加设备
      </el-button>
      
      <el-button
        type="success"
        class="action-btn"
        @click="showAddGroupDialog = true"
      >
        <el-icon><FolderAdd /></el-icon>
        创建分组
      </el-button>
      
      <el-button
        type="warning"
        class="action-btn"
        @click="showAddToGroupDialog = true"
      >
        <el-icon><FolderAdd /></el-icon>
        添加到分组
      </el-button>
    </div>

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
        
        <el-form-item label="设备分组" prop="groupId">
          <el-select v-model="deviceForm.groupId" placeholder="请选择设备分组" class="w-100">
            <el-option
              v-for="group in groupTableData"
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

    <!-- 创建分组对话框 -->
    <el-dialog
      v-model="showAddGroupDialog"
      title="创建设备分组"
      width="500px"
    >
      <el-form
        ref="groupFormRef"
        :model="groupForm"
        :rules="groupRules"
        label-width="100px"
      >
        <el-form-item label="分组名称" prop="name">
          <el-input v-model="groupForm.name" placeholder="请输入分组名称"/>
        </el-form-item>
        
        <el-form-item label="分组描述" prop="description">
          <el-input
            v-model="groupForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分组描述"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddGroupDialog = false">取消</el-button>
          <el-button type="primary" @click="handleCreateGroup" :loading="creatingGroup">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加设备到分组对话框 -->
    <el-dialog
      v-model="showAddToGroupDialog"
      title="添加设备到分组"
      width="500px"
    >
      <el-form
        ref="addToGroupFormRef"
        :model="addToGroupForm"
        :rules="addToGroupRules"
        label-width="100px"
      >
        <el-form-item label="选择设备" prop="deviceId">
          <el-select v-model="addToGroupForm.deviceId" placeholder="请选择设备" class="w-100">
            <el-option
              v-for="device in deviceTableData"
              :key="device.id"
              :label="device.deviceName"
              :value="device.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="选择分组" prop="groupId">
          <el-select v-model="addToGroupForm.groupId" placeholder="请选择分组" class="w-100">
            <el-option
              v-for="group in groupTableData"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddToGroupDialog = false">取消</el-button>
          <el-button type="primary" @click="handleAddToGroup" :loading="addingToGroup">
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

    <!-- 设备列表 -->
    <el-card class="device-list-card">
      <template #header>
        <div class="card-header">
          <span>设备列表</span>
        </div>
      </template>
      
      <el-table 
        :data="deviceTableData" 
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="deviceName" label="设备名称" />
        <el-table-column prop="deviceCode" label="设备编码" />
        <el-table-column prop="deviceType" label="设备类型">
          <template #default="{ row }">
            <el-tag>{{ getDeviceTypeName(row.deviceType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceStatus" label="设备状态">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'">
              {{ row.status ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link
              @click="goToDeviceDetail(row)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 设备分组列表 -->
    <el-card class="group-list-card">
      <template #header>
        <div class="card-header">
          <span>设备分组</span>
        </div>
      </template>
      
      <el-table
        :data="groupTableData"
        style="width: 100%"
        v-loading="groupLoading"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="name" label="分组名称" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="deviceCount" label="设备数量" width="100" />
        <el-table-column prop="level" label="层级" width="80" />
        <el-table-column prop="createTime" label="创建时间">
          <template #default="{ row }">
            {{ new Date(row.createTime).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link
              @click="viewGroupDevices(row)"
            >
              查看设备
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 告警记录列表 -->
    <el-card class="alarm-list-card">
      <template #header>
        <div class="card-header">
          <span>告警记录</span>
          <div class="header-operations">
            <el-date-picker
              v-model="alarmDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="handleDateRangeChange"
            />
          </div>
        </div>
      </template>
      
      <el-table 
        :data="alarmTableData" 
        style="width: 100%"
        v-loading="alarmLoading"
      >
        <el-table-column prop="deviceName" label="设备名称">
          <template #default="{ row }">
            {{ row.deviceName || `未知设备(${row.deviceId})` }}
          </template>
        </el-table-column>
        <el-table-column prop="channelId" label="通道" />
        <el-table-column prop="isHandled" label="处理状态">
          <template #default="{ row }">
            <el-tag :type="row.isHandled ? 'success' : 'warning'">
              {{ row.isHandled ? '已处理' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间">
          <template #default="{ row }">
            {{ new Date(row.createTime).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="handleTime" label="处理时间">
          <template #default="{ row }">
            {{ row.handleTime ? new Date(row.handleTime).toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="handleNote" label="处理备注" show-overflow-tooltip />
      </el-table>
      
      <!-- 告警记录分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="alarmCurrentPage"
          v-model:page-size="alarmPageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="alarmTotal"
          @size-change="handleAlarmSizeChange"
          @current-change="handleAlarmCurrentChange"
        />
      </div>
    </el-card>

    <!-- 设备详情对话框 -->
    <el-dialog
      v-model="showDeviceDialog"
      title="设备详情"
      width="30%"
    >
      <div v-if="currentDevice">
        <p><strong>设备ID：</strong>{{ currentDevice.id }}</p>
        <p><strong>设备名称：</strong>{{ currentDevice.deviceName }}</p>
        <p><strong>设备编码：</strong>{{ currentDevice.deviceCode }}</p>
        <p><strong>设备类型：</strong>{{ getDeviceTypeName(currentDevice.deviceType) }}</p>
        <p><strong>设备描述：</strong>{{ currentDevice.description || '暂无描述' }}</p>
        <p><strong>设备状态：</strong>{{ currentDevice.status ? '在线' : '离线' }}</p>
        <p><strong>MQTT主题：</strong>{{ currentDevice.mqttTopic }}</p>
        <p><strong>设备分组：</strong>{{ currentDevice.groupId }}</p>
      </div>
    </el-dialog>

    <!-- 分组设备列表对话框 -->
    <el-dialog
      v-model="showGroupDevicesDialog"
      :title="`${currentGroup?.name || ''} - 设备列表`"
      width="70%"
    >
      <el-table
        :data="groupDevices"
        style="width: 100%"
        v-loading="groupDevicesLoading"
      >
        <el-table-column prop="deviceName" label="设备名称" />
        <el-table-column prop="deviceCode" label="设备编码" />
        <el-table-column prop="deviceType" label="设备类型">
          <template #default="{ row }">
            <el-tag>{{ getDeviceTypeName(row.deviceType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="设备状态">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'">
              {{ row.status ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间">
          <template #default="{ row }">
            {{ new Date(row.createTime).toLocaleString() }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

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
  Plus,
  FolderAdd
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { 
  addDevice, 
  getUserDevices, 
  getUserOnlineDevices,
  getGroupTree,
  createGroup,
  addDeviceToGroup,
  getDevicesInGroup
} from '@/api/device'
import { getUnhandledAlarms, getDeviceAlarms } from '@/api/alarm'
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
const selectedChannel = ref('1')
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
    title: '告警设备数量',
    value: '0',
    icon: 'Connection',
    type: 'success'
  },
  {
    title: '近7日报警数量',
    value: '0',
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

// 定时刷新数据
let refreshTimer = null

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})



// 模拟实时数据更新
let timer = null
let statsTimer = null


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
    // 直接调用获取未处理告警的接口
    const response = await getUnhandledAlarms()
    
    // 如果响应是数组，获取其长度作为未处理告警数量
    const unhandledCount = Array.isArray(response) ? response.length : 0
    
    // 更新告警统计数据
    alarmStats.unhandled = unhandledCount
    
    // 更新概览卡片中的告警设备数量
    overviewCards[1].value = unhandledCount.toString()
    
    console.log('未处理告警数量:', unhandledCount)
  } catch (error) {
    console.error('获取告警统计失败:', error)
    ElMessage.error('获取告警统计失败')
  }
}

// 获取近7日告警统计
const fetchLastWeekAlarms = async () => {
  try {
    // 计算时间范围
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000) // 7天前

    // 格式化时间为ISO字符串
    const params = {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    }

    const response = await getDeviceAlarms(params)
    
    // 如果响应是数组，获取其长度作为告警数量
    const alarmCount = Array.isArray(response) ? response.length : 0
    
    // 更新概览卡片中的近7日告警数量
    overviewCards[2].value = alarmCount.toString()
    
    console.log('近7日告警数量:', alarmCount)
  } catch (error) {
    console.error('获取近7日告警统计失败:', error)
    ElMessage.error('获取告警统计失败')
  }
}

// 修改刷新函数，添加对近7日告警的获取
const refreshStats = async () => {
  await fetchDeviceStats()
  await fetchAlarmStats()
  await fetchLastWeekAlarms()
}

// 在 script setup 顶部添加 WebSocket 客户端引用
const wsClient = ref(null)

// 修改生命周期钩子
onMounted(() => {
  fetchDeviceStats() // 初始加载
  fetchDeviceList() // 添加这行
  fetchAlarmList() // 添加这行
  fetchGroupList() // 添加这行
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
  groupId: [
    { required: true, message: '请选择设备分组', trigger: 'change' }
  ],
  mqttTopic: [
    { required: true, message: '请输入MQTT主题', trigger: 'blur' }
  ]
}

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

// 添加设备列表相关的响应式变量
const deviceTableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取设备列表数据
const fetchDeviceList = async () => {
  try {
    loading.value = true
    const response = await getUserDevices()
    
    if (Array.isArray(response)) {
      // 计算总数
      total.value = response.length
      
      // 计算当前页的数据
      const startIndex = (currentPage.value - 1) * pageSize.value
      const endIndex = startIndex + pageSize.value
      deviceTableData.value = response.slice(startIndex, endIndex)
    }
  } catch (error) {
    console.error('获取设备列表失败:', error)
    ElMessage.error('获取设备列表失败')
  } finally {
    loading.value = false
  }
}

// 处理页码改变
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchDeviceList()
}

// 处理每页条数改变
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1 // 重置到第一页
  fetchDeviceList()
}

// 获取设备类型名称
const getDeviceTypeName = (type) => {
  const typeMap = {
    'temperature': '温度传感器',
    'humidity': '湿度传感器',
    'pressure': '压力传感器'
  }
  return typeMap[type] || type
}

// 设备描述对话框
const showDeviceDialog = ref(false)
const currentDevice = ref(null)

// 显示设备详情
const goToDeviceDetail = (device) => {
  currentDevice.value = device
  showDeviceDialog.value = true
}

// 告警记录列表
const alarmTableData = ref([])
const alarmLoading = ref(false)
const alarmCurrentPage = ref(1)
const alarmPageSize = ref(10)
const alarmTotal = ref(0)
const alarmDateRange = ref([])

// 获取告警记录数据
const fetchAlarmList = async () => {
  try {
    alarmLoading.value = true
    
    // 确保已经获取了设备列表数据
    if (deviceTableData.value.length === 0) {
      await fetchDeviceList()
    }
    
    // 准备时间范围参数
    const params = {}
    if (alarmDateRange.value && alarmDateRange.value.length === 2) {
      params.startTime = alarmDateRange.value[0].toISOString()
      params.endTime = alarmDateRange.value[1].toISOString()
    }
    
    const response = await getDeviceAlarms(params)
    
    if (Array.isArray(response)) {
      // 计算总数
      alarmTotal.value = response.length
      
      // 计算当前页的数据
      const startIndex = (alarmCurrentPage.value - 1) * alarmPageSize.value
      const endIndex = startIndex + alarmPageSize.value
      alarmTableData.value = response.slice(startIndex, endIndex)
    }
  } catch (error) {
    console.error('获取告警记录失败:', error)
    ElMessage.error('获取告警记录失败')
  } finally {
    alarmLoading.value = false
  }
}

// 处理告警记录分页
const handleAlarmSizeChange = (size) => {
  alarmPageSize.value = size
  alarmCurrentPage.value = 1
  fetchAlarmList()
}

const handleAlarmCurrentChange = (page) => {
  alarmCurrentPage.value = page
  fetchAlarmList()
}

// 处理日期范围变化
const handleDateRangeChange = () => {
  alarmCurrentPage.value = 1
  fetchAlarmList()
}

// 设备分组相关的响应式变量
const groupTableData = ref([])
const groupLoading = ref(false)
const showGroupDevicesDialog = ref(false)
const groupDevicesLoading = ref(false)
const groupDevices = ref([])
const currentGroup = ref(null)

// 获取设备分组数据
const fetchGroupList = async () => {
  try {
    groupLoading.value = true
    const response = await getGroupTree()
    
    if (Array.isArray(response)) {
      groupTableData.value = response
      // 获取每个分组的设备数量
      await Promise.all(groupTableData.value.map(async (group) => {
        try {
          const devices = await getDevicesInGroup(group.id)
          group.deviceCount = Array.isArray(devices) ? devices.length : 0
        } catch (error) {
          console.error(`获取分组 ${group.id} 的设备数量失败:`, error)
          group.deviceCount = 0
        }
      }))
    }
  } catch (error) {
    console.error('获取设备分组失败:', error)
    ElMessage.error('获取设备分组失败')
  } finally {
    groupLoading.value = false
  }
}

// 查看分组内的设备
const viewGroupDevices = async (group) => {
  currentGroup.value = group
  showGroupDevicesDialog.value = true
  groupDevicesLoading.value = true
  
  try {
    const response = await getDevicesInGroup(group.id)
    groupDevices.value = Array.isArray(response) ? response : []
    
    // 更新当前分组的设备数量
    const currentGroupIndex = groupTableData.value.findIndex(g => g.id === group.id)
    if (currentGroupIndex !== -1) {
      groupTableData.value[currentGroupIndex].deviceCount = groupDevices.value.length
    }
    
    if (groupDevices.value.length === 0) {
      ElMessage.warning('该分组暂无设备')
    }
  } catch (error) {
    console.error('获取分组设备失败:', error)
    ElMessage.error('获取分组设备失败')
  } finally {
    groupDevicesLoading.value = false
  }
}

// 创建分组对话框
const showAddGroupDialog = ref(false)
const creatingGroup = ref(false)
const groupFormRef = ref(null)

// 分组表单数据
const groupForm = reactive({
  name: '',
  description: ''
})

// 分组表单验证规则
const groupRules = {
  name: [
    { required: true, message: '请输入分组名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }
  ]
}

// 创建分组
const handleCreateGroup = async () => {
  if (!groupFormRef.value) return
  
  try {
    await groupFormRef.value.validate()
    creatingGroup.value = true
    
    await createGroup(groupForm)
    
    ElMessage.success('创建分组成功')
    showAddGroupDialog.value = false
    
    // 重置表单
    groupFormRef.value.resetFields()
    
    // 刷新分组列表
    fetchGroupList()
  } catch (error) {
    console.error('创建分组失败:', error)
    ElMessage.error(error.response?.data?.message || '创建分组失败')
  } finally {
    creatingGroup.value = false
  }
}

// 添加设备到分组相关的响应式变量
const showAddToGroupDialog = ref(false)
const addingToGroup = ref(false)
const addToGroupFormRef = ref(null)

// 添加到分组表单数据
const addToGroupForm = reactive({
  deviceId: null,
  groupId: null
})

// 添加到分组表单验证规则
const addToGroupRules = {
  deviceId: [
    { required: true, message: '请选择设备', trigger: 'change' }
  ],
  groupId: [
    { required: true, message: '请选择分组', trigger: 'change' }
  ]
}

// 添加设备到分组
const handleAddToGroup = async () => {
  if (!addToGroupFormRef.value) return
  
  try {
    await addToGroupFormRef.value.validate()
    addingToGroup.value = true
    
    await addDeviceToGroup(addToGroupForm.groupId, addToGroupForm.deviceId)
    
    ElMessage.success('添加到分组成功')
    showAddToGroupDialog.value = false
    
    // 重置表单
    addToGroupFormRef.value.resetFields()
    
    // 刷新分组列表
    fetchGroupList()
  } catch (error) {
    console.error('添加到分组失败:', error)
    ElMessage.error(error.response?.data?.message || '添加到分组失败')
  } finally {
    addingToGroup.value = false
  }
}

// 打开添加设备对话框
const openAddDeviceDialog = async () => {
  // 确保已加载分组数据
  if (groupTableData.value.length === 0) {
    await fetchGroupList()
  }
  showAddDeviceDialog.value = true
}
</script>

<style lang="scss" scoped>
.dashboard {
  .action-buttons {
    margin-bottom: 20px;
    display: flex;
    gap: 16px;
    
    .action-btn {
      display: flex;
      align-items: center;
      
      .el-icon {
        margin-right: 8px;
      }
    }
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

  .device-list-card {
    margin-top: 20px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .alarm-list-card {
    margin-top: 20px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .header-operations {
        display: flex;
        gap: 16px;
      }
    }
    
    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .group-list-card {
    margin-top: 20px;
    
    .card-header {
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
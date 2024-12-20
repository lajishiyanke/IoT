<template>
  <div class="system-monitor">
    <!-- 系统状态概览 -->
    <el-row :gutter="20" class="status-overview">
      <el-col :xs="12" :sm="6" v-for="item in statusCards" :key="item.title">
        <el-card :class="['status-card', item.type]">
          <div class="card-content">
            <div class="card-value">
              {{ item.value }}
              <span class="unit">{{ item.unit }}</span>
            </div>
            <div class="card-title">{{ item.title }}</div>
            <div class="card-chart">
              <v-chart class="mini-chart" :option="item.chart" autoresize />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 资源使用监控 -->
    <el-row :gutter="20" class="resource-monitor">
      <el-col :md="12" :sm="24">
        <el-card class="monitor-card">
          <template #header>
            <div class="card-header">
              <span>CPU使用率</span>
              <el-tag :type="getCpuStatus(cpuUsage)">
                {{ cpuUsage }}%
              </el-tag>
            </div>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="cpuChartOption" autoresize />
          </div>
          <div class="detail-list">
            <div class="detail-item" v-for="(core, index) in cpuCores" :key="index">
              <span class="label">核心 {{ index + 1 }}</span>
              <el-progress
                :percentage="core"
                :color="getProgressColor(core)"
                :stroke-width="8"
              />
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :md="12" :sm="24">
        <el-card class="monitor-card">
          <template #header>
            <div class="card-header">
              <span>内存使用率</span>
              <el-tag :type="getMemoryStatus(memoryUsage)">
                {{ memoryUsage }}%
              </el-tag>
            </div>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="memoryChartOption" autoresize />
          </div>
          <div class="memory-info">
            <div class="info-item">
              <span class="label">总内存</span>
              <span class="value">{{ formatSize(totalMemory) }}</span>
            </div>
            <div class="info-item">
              <span class="label">已用内存</span>
              <span class="value">{{ formatSize(usedMemory) }}</span>
            </div>
            <div class="info-item">
              <span class="label">可用内存</span>
              <span class="value">{{ formatSize(availableMemory) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 系统信息 -->
    <el-row :gutter="20" class="system-info">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统信息</span>
              <el-button-group>
                <el-button
                  type="primary"
                  :icon="Refresh"
                  @click="refreshSystemInfo"
                  :loading="refreshing"
                >
                  刷新
                </el-button>
                <el-button
                  type="success"
                  :icon="Download"
                  @click="exportSystemInfo"
                >
                  导出
                </el-button>
              </el-button-group>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="操作系统">
              {{ systemInfo.os }}
            </el-descriptions-item>
            <el-descriptions-item label="系统架构">
              {{ systemInfo.arch }}
            </el-descriptions-item>
            <el-descriptions-item label="CPU型号">
              {{ systemInfo.cpu }}
            </el-descriptions-item>
            <el-descriptions-item label="CPU核心数">
              {{ systemInfo.cores }}
            </el-descriptions-item>
            <el-descriptions-item label="系统时间">
              {{ systemInfo.time }}
            </el-descriptions-item>
            <el-descriptions-item label="运行时长">
              {{ systemInfo.uptime }}
            </el-descriptions-item>
          </el-descriptions>

          <el-divider>磁盘使用情况</el-divider>

          <el-table :data="diskUsage" border style="width: 100%">
            <el-table-column prop="mount" label="挂载点" />
            <el-table-column prop="total" label="总容量">
              <template #default="{ row }">
                {{ formatSize(row.total) }}
              </template>
            </el-table-column>
            <el-table-column prop="used" label="已用空间">
              <template #default="{ row }">
                {{ formatSize(row.used) }}
              </template>
            </el-table-column>
            <el-table-column prop="available" label="可用空间">
              <template #default="{ row }">
                {{ formatSize(row.available) }}
              </template>
            </el-table-column>
            <el-table-column prop="usage" label="使用率" width="200">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.usage"
                  :color="getProgressColor(row.usage)"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 在线用户 -->
    <el-row :gutter="20" class="online-users">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>在线用户 ({{ onlineUsers.length }})</span>
              <el-button
                type="danger"
                :icon="PowerOff"
                @click="kickOutUser"
                :disabled="!selectedUsers.length"
              >
                强制下线
              </el-button>
            </div>
          </template>

          <el-table
            :data="onlineUsers"
            border
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="ip" label="IP地址" />
            <el-table-column prop="location" label="登录地点" />
            <el-table-column prop="browser" label="浏览器" />
            <el-table-column prop="os" label="操作系统" />
            <el-table-column prop="loginTime" label="登录时间" width="180" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="danger"
                  link
                  @click="kickOutUser([row])"
                >
                  下线
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  Download,
  PowerOff
} from '@element-plus/icons-vue'
import { exportExcel } from '@/utils/export'

// 状态卡片数据
const statusCards = reactive([
  {
    title: 'CPU使用率',
    value: '45',
    unit: '%',
    type: 'success',
    chart: {
      // 迷你图表配置...
    }
  },
  {
    title: '内存使用率',
    value: '68',
    unit: '%',
    type: 'warning',
    chart: {
      // 迷你图表配置...
    }
  },
  {
    title: '系统负载',
    value: '1.25',
    unit: '',
    type: 'info',
    chart: {
      // 迷你图表配置...
    }
  },
  {
    title: '网络流量',
    value: '2.5',
    unit: 'MB/s',
    type: 'primary',
    chart: {
      // 迷你图表配置...
    }
  }
])

// CPU相关数据
const cpuUsage = ref(45)
const cpuCores = ref([40, 35, 50, 45, 55, 42, 38, 48])
const cpuChartOption = reactive({
  // CPU图表配置...
})

// 内存相关数据
const memoryUsage = ref(68)
const totalMemory = ref(16 * 1024 * 1024 * 1024) // 16GB
const usedMemory = ref(10.88 * 1024 * 1024 * 1024)
const availableMemory = computed(() => totalMemory.value - usedMemory.value)
const memoryChartOption = reactive({
  // 内存图表配置...
})

// 系统信息
const systemInfo = reactive({
  os: 'Ubuntu 20.04 LTS',
  arch: 'x86_64',
  cpu: 'Intel(R) Core(TM) i7-10700K',
  cores: 8,
  time: new Date().toLocaleString(),
  uptime: '10天 5小时 30分钟'
})

// 磁盘使用情况
const diskUsage = ref([
  {
    mount: '/',
    total: 500 * 1024 * 1024 * 1024,
    used: 350 * 1024 * 1024 * 1024,
    available: 150 * 1024 * 1024 * 1024,
    usage: 70
  },
  {
    mount: '/home',
    total: 1000 * 1024 * 1024 * 1024,
    used: 600 * 1024 * 1024 * 1024,
    available: 400 * 1024 * 1024 * 1024,
    usage: 60
  }
])

// 在线用户
const onlineUsers = ref([
  {
    username: 'admin',
    ip: '192.168.1.100',
    location: '广东省深圳市',
    browser: 'Chrome 98.0.4758.102',
    os: 'Windows 10',
    loginTime: '2024-03-20 15:30:00'
  }
])
const selectedUsers = ref([])

// 刷新状态
const refreshing = ref(false)

// 方法
const getCpuStatus = (usage) => {
  if (usage >= 90) return 'danger'
  if (usage >= 70) return 'warning'
  return 'success'
}

const getMemoryStatus = (usage) => {
  if (usage >= 90) return 'danger'
  if (usage >= 70) return 'warning'
  return 'success'
}

const getProgressColor = (percentage) => {
  if (percentage >= 90) return '#F56C6C'
  if (percentage >= 70) return '#E6A23C'
  return '#67C23A'
}

const formatSize = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

const refreshSystemInfo = async () => {
  refreshing.value = true
  try {
    // 刷新系统信���
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('刷新成功')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

const exportSystemInfo = () => {
  const data = [
    {
      name: '操作系统',
      value: systemInfo.os
    },
    {
      name: '系统架构',
      value: systemInfo.arch
    }
    // ... 其他系统信息
  ]
  
  exportExcel(data, '系统信息.xlsx')
}

const handleSelectionChange = (selection) => {
  selectedUsers.value = selection
}

const kickOutUser = async (users) => {
  const userList = users || selectedUsers.value
  if (!userList.length) return
  
  try {
    await ElMessageBox.confirm(
      `确认将选中的 ${userList.length} 个用户强制下线？`,
      '提示',
      { type: 'warning' }
    )
    // TODO: 调用强制下线API
    ElMessage.success('操作成功')
  } catch {
    // 用户取消
  }
}

// 定时更新数据
let timer
const updateData = () => {
  // 更新CPU使用率
  cpuUsage.value = Math.floor(Math.random() * 30) + 40
  // 更新内存使用率
  memoryUsage.value = Math.floor(Math.random() * 20) + 60
  // 更新系统时间
  systemInfo.time = new Date().toLocaleString()
}

onMounted(() => {
  timer = setInterval(updateData, 5000)
})

onBeforeUnmount(() => {
  clearInterval(timer)
})
</script>

<style lang="scss" scoped>
.system-monitor {
  .status-overview {
    margin-bottom: 20px;
    
    .status-card {
      margin-bottom: 20px;
      
      &.success { border-top: 3px solid var(--el-color-success); }
      &.warning { border-top: 3px solid var(--el-color-warning); }
      &.danger { border-top: 3px solid var(--el-color-danger); }
      &.primary { border-top: 3px solid var(--el-color-primary); }
      &.info { border-top: 3px solid var(--el-color-info); }
      
      .card-content {
        position: relative;
        padding: 20px;
        
        .card-value {
          font-size: 24px;
          font-weight: bold;
          color: var(--text-primary);
          
          .unit {
            font-size: 14px;
            color: var(--text-regular);
            margin-left: 4px;
          }
        }
        
        .card-title {
          font-size: 14px;
          color: var(--text-regular);
          margin-top: 8px;
        }
        
        .card-chart {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 100px;
          height: 40px;
          opacity: 0.2;
          
          .mini-chart {
            height: 100%;
          }
        }
      }
    }
  }
  
  .resource-monitor {
    margin-bottom: 20px;
    
    .monitor-card {
      margin-bottom: 20px;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .chart-container {
        height: 300px;
        
        .chart {
          height: 100%;
        }
      }
      
      .detail-list {
        margin-top: 20px;
        
        .detail-item {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          
          .label {
            width: 80px;
            color: var(--text-regular);
          }
          
          .el-progress {
            flex: 1;
          }
        }
      }
      
      .memory-info {
        margin-top: 20px;
        display: flex;
        justify-content: space-around;
        
        .info-item {
          text-align: center;
          
          .label {
            display: block;
            color: var(--text-regular);
            margin-bottom: 8px;
          }
          
          .value {
            font-size: 18px;
            font-weight: bold;
            color: var(--text-primary);
          }
        }
      }
    }
  }
  
  .system-info,
  .online-users {
    margin-bottom: 20px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}

// 深色主题适配
.dark-theme {
  .el-card {
    background-color: var(--background-color);
  }
}
</style> 
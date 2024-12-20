<template>
  <div class="anomaly-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button link @click="$router.back()">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <el-divider direction="vertical" />
            <span>异常详情</span>
          </div>
          <div class="header-right">
            <el-button-group>
              <el-button
                type="primary"
                :icon="Download"
                @click="exportDetail"
              >
                导出报告
              </el-button>
              <el-button
                type="success"
                :icon="Check"
                @click="handleProcess"
                :disabled="anomaly.status === 'resolved'"
              >
                标记已处理
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <!-- 基本信息 -->
      <el-descriptions class="anomaly-info" :column="3" border>
        <el-descriptions-item label="异常ID">
          {{ anomaly.id }}
        </el-descriptions-item>
        <el-descriptions-item label="发生时间">
          {{ anomaly.time }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="anomaly.status === 'resolved' ? 'success' : 'danger'">
            {{ anomaly.status === 'resolved' ? '已处理' : '未处理' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="异常类型">
          {{ anomaly.type }}
        </el-descriptions-item>
        <el-descriptions-item label="通道">
          {{ anomaly.channel }}
        </el-descriptions-item>
        <el-descriptions-item label="严重程度">
          <el-tag :type="getSeverityType(anomaly.severity)">
            {{ anomaly.severity }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="3">
          {{ anomaly.description }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 异常数据图表 -->
      <div class="chart-section">
        <div class="section-header">
          <h3>异常数据分析</h3>
          <el-radio-group v-model="chartType" size="small">
            <el-radio-button label="time">时域图</el-radio-button>
            <el-radio-button label="frequency">频域图</el-radio-button>
          </el-radio-group>
        </div>
        <div class="chart-container">
          <v-chart class="chart" :option="chartOption" autoresize />
        </div>
      </div>

      <!-- 处理记录 -->
      <div class="process-history">
        <div class="section-header">
          <h3>处理记录</h3>
          <el-button
            type="primary"
            link
            :icon="Plus"
            @click="showAddRecord = true"
          >
            添加记录
          </el-button>
        </div>
        
        <el-timeline>
          <el-timeline-item
            v-for="record in processRecords"
            :key="record.id"
            :timestamp="record.time"
            :type="record.type"
          >
            <h4>{{ record.title }}</h4>
            <p>{{ record.content }}</p>
            <p class="operator">
              处理人：{{ record.operator }}
            </p>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-card>

    <!-- 添加处理记录对话框 -->
    <el-dialog
      v-model="showAddRecord"
      title="添加处理记录"
      width="500px"
    >
      <el-form
        ref="recordForm"
        :model="newRecord"
        :rules="recordRules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="newRecord.title" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="newRecord.content"
            type="textarea"
            :rows="4"
          />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="newRecord.type">
            <el-option label="处理中" value="warning" />
            <el-option label="已解决" value="success" />
            <el-option label="未解决" value="danger" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddRecord = false">取消</el-button>
          <el-button type="primary" @click="addProcessRecord">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Download,
  Check,
  Plus
} from '@element-plus/icons-vue'
import { exportPDF } from '@/utils/export'

const route = useRoute()
const chartType = ref('time')
const showAddRecord = ref(false)

// 异常数据
const anomaly = reactive({
  id: 'ANO20240320001',
  time: '2024-03-20 14:30:25',
  status: 'pending',
  type: '幅值异常',
  channel: '通道1',
  severity: '严重',
  description: '信号幅值超出预设阈值，可能存在设备故障或干扰'
})

// 处理记录
const processRecords = ref([
  {
    id: 1,
    time: '2024-03-20 14:35:00',
    title: '初步排查',
    content: '检查传感器连接状态，未发现硬件问题',
    type: 'warning',
    operator: '张工'
  },
  {
    id: 2,
    time: '2024-03-20 14:40:00',
    title: '信号分析',
    content: '对异常时段数据进行频谱分析，发现存在干扰信号',
    type: 'warning',
    operator: '李工'
  }
])

// 新记录表单
const newRecord = reactive({
  title: '',
  content: '',
  type: 'warning'
})

const recordRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择类型', trigger: 'change' }
  ]
}

// 图表配置
const chartOption = computed(() => {
  if (chartType.value === 'time') {
    return {
      // 时域图配置...
    }
  } else {
    return {
      // 频域图配置...
    }
  }
})

// 方法
const getSeverityType = (severity) => {
  const types = {
    '严重': 'danger',
    '警告': 'warning',
    '提示': 'info'
  }
  return types[severity] || 'info'
}

const handleProcess = async () => {
  try {
    await ElMessageBox.confirm('确认将此异常标记为已处理？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    anomaly.status = 'resolved'
    ElMessage.success('操作成功')
  } catch {
    // 用户取消
  }
}

const addProcessRecord = async () => {
  // 添加处理记录
  processRecords.value.push({
    id: processRecords.value.length + 1,
    time: new Date().toLocaleString(),
    ...newRecord,
    operator: '当前用户'
  })
  
  showAddRecord.value = false
  ElMessage.success('记录添加成功')
}

const exportDetail = async () => {
  try {
    const element = document.querySelector('.anomaly-detail')
    await exportPDF(element, `异常报告_${anomaly.id}.pdf`)
    ElMessage.success('报告导出成功')
  } catch (error) {
    ElMessage.error('报告导出失败')
  }
}
</script>

<style lang="scss" scoped>
.anomaly-detail {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
  }
  
  .anomaly-info {
    margin: 20px 0;
  }
  
  .chart-section {
    margin: 20px 0;
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      h3 {
        margin: 0;
        color: var(--text-primary);
      }
    }
    
    .chart-container {
      height: 400px;
      
      .chart {
        height: 100%;
      }
    }
  }
  
  .process-history {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      h3 {
        margin: 0;
        color: var(--text-primary);
      }
    }
    
    .operator {
      margin-top: 8px;
      color: var(--text-regular);
      font-size: 12px;
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
<template>
  <div class="signal-analysis">
    <!-- 分析控制面板 -->
    <el-row :gutter="20" class="control-panel">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="panel-header">
              <span>信号分析控制</span>
              <div class="control-buttons">
                <el-button-group>
                  <el-button
                    type="primary"
                    :icon="Operation"
                    @click="startAnalysis"
                    :loading="analyzing"
                  >
                    开始分析
                  </el-button>
                  <el-button
                    type="success"
                    :icon="Download"
                    @click="exportResults"
                  >
                    导出结果
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </template>

          <el-form :model="analysisParams" label-width="100px" class="analysis-form">
            <el-row :gutter="20">
              <el-col :md="8" :sm="12" :xs="24">
                <el-form-item label="分析方法">
                  <el-select v-model="analysisParams.method" class="full-width">
                    <el-option label="时域分析" value="time" />
                    <el-option label="频域分析" value="frequency" />
                    <el-option label="时频分析" value="time-frequency" />
                    <el-option label="相关分析" value="correlation" />
                  </el-select>
                </el-form-item>
              </el-col>
              
              <el-col :md="8" :sm="12" :xs="24">
                <el-form-item label="数据源">
                  <el-select v-model="analysisParams.dataSource" class="full-width">
                    <el-option label="实时数据" value="realtime" />
                    <el-option label="历史数据" value="history" />
                    <el-option label="本地文件" value="local" />
                  </el-select>
                </el-form-item>
              </el-col>
              
              <el-col :md="8" :sm="12" :xs="24">
                <el-form-item label="通道选择">
                  <el-select
                    v-model="analysisParams.channels"
                    multiple
                    collapse-tags
                    class="full-width"
                  >
                    <el-option
                      v-for="ch in channels"
                      :key="ch.value"
                      :label="ch.label"
                      :value="ch.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 分析参数设置 -->
            <el-divider>分析参数</el-divider>
            
            <el-row :gutter="20">
              <template v-if="analysisParams.method === 'frequency'">
                <el-col :md="8" :sm="12" :xs="24">
                  <el-form-item label="窗口函数">
                    <el-select v-model="analysisParams.window" class="full-width">
                      <el-option label="汉宁窗" value="hanning" />
                      <el-option label="海明窗" value="hamming" />
                      <el-option label="布莱克曼窗" value="blackman" />
                    </el-select>
                  </el-form-item>
                </el-col>
                
                <el-col :md="8" :sm="12" :xs="24">
                  <el-form-item label="采样点数">
                    <el-input-number
                      v-model="analysisParams.fftPoints"
                      :min="256"
                      :max="8192"
                      :step="256"
                      class="full-width"
                    />
                  </el-form-item>
                </el-col>
              </template>

              <template v-if="analysisParams.method === 'time-frequency'">
                <el-col :md="8" :sm="12" :xs="24">
                  <el-form-item label="分析方法">
                    <el-select v-model="analysisParams.tfMethod" class="full-width">
                      <el-option label="短时傅里叶" value="stft" />
                      <el-option label="小波变换" value="wavelet" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </template>
            </el-row>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分析结果展示 -->
    <el-row :gutter="20" class="analysis-results">
      <!-- 主要分析图表 -->
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>分析结果</span>
              <el-radio-group v-model="displayMode" size="small">
                <el-radio-button value="2d">2D视图</el-radio-button>
                <el-radio-button value="3d">3D视图</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <v-chart
              v-if="displayMode === '2d'"
              class="chart"
              :option="chartOption2D"
              autoresize
            />
            <v-chart
              v-else
              class="chart"
              :option="chartOption3D"
              autoresize
            />
          </div>
        </el-card>
      </el-col>

      <!-- 分析指标 -->
      <el-col :md="12" :sm="24" v-for="(metric, index) in analysisMetrics" :key="index">
        <el-card class="metric-card">
          <template #header>
            <div class="metric-header">
              <span>{{ metric.title }}</span>
              <el-tooltip
                :content="metric.description"
                placement="top"
              >
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div class="metric-content">
            <div class="metric-value">{{ metric.value }}</div>
            <div class="metric-unit">{{ metric.unit }}</div>
            <div
              class="metric-trend"
              :class="metric.trend"
            >
              <el-icon>
                <component :is="metric.trend === 'up' ? 'ArrowUp' : 'ArrowDown'" />
              </el-icon>
              {{ metric.change }}%
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 异常检测结果 -->
    <el-card class="anomaly-card">
      <template #header>
        <div class="anomaly-header">
          <span>异常检测结果</span>
          <el-tag
            :type="hasAnomalies ? 'danger' : 'success'"
          >
            {{ hasAnomalies ? '发现异常' : '正常' }}
          </el-tag>
        </div>
      </template>
      <el-timeline v-if="hasAnomalies">
        <el-timeline-item
          v-for="(anomaly, index) in anomalies"
          :key="index"
          :type="anomaly.level"
          :timestamp="anomaly.time"
        >
          {{ anomaly.description }}
          <div class="anomaly-actions">
            <el-button type="primary" link size="small" @click="handleAnomalyDetail(anomaly)">
              查看详情
            </el-button>
            <el-button type="success" link size="small" @click="handleAnomalyProcess(anomaly)">
              处理
            </el-button>
          </div>
        </el-timeline-item>
      </el-timeline>
      <div v-else class="no-anomaly">
        <el-icon :size="48" color="#67c23a"><CircleCheckFilled /></el-icon>
        <p>未检测到异常</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, ScatterChart, HeatmapChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  Operation,
  Download,
  QuestionFilled,
  ArrowUp,
  ArrowDown,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  ScatterChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent
])

// 状态变量
const analyzing = ref(false)
const displayMode = ref('2d')

// 分析参数
const analysisParams = reactive({
  method: 'time',
  dataSource: 'realtime',
  channels: ['ch1'],
  window: 'hanning',
  fftPoints: 1024,
  tfMethod: 'stft'
})

// 通道配置
const channels = [
  { label: '通道1', value: 'ch1' },
  { label: '��道2', value: 'ch2' },
  { label: '通道3', value: 'ch3' },
  { label: '通道4', value: 'ch4' }
]

// 图表配置
const chartOption2D = reactive({
  // 2D图表配置...
})

const chartOption3D = reactive({
  // 3D图表配置...
})

// 分析指标
const analysisMetrics = ref([
  {
    title: '峰值频率',
    value: '123.45',
    unit: 'Hz',
    trend: 'up',
    change: '5.2',
    description: '信号主要频率成分'
  },
  {
    title: 'RMS值',
    value: '0.856',
    unit: 'mV',
    trend: 'down',
    change: '2.1',
    description: '信号有效值'
  }
])

// 异常检测结果
const hasAnomalies = ref(true)
const anomalies = ref([
  {
    time: '2024-03-20 14:30:25',
    level: 'warning',
    description: '通道1信号幅值异常',
    details: '...'
  },
  {
    time: '2024-03-20 14:28:15',
    level: 'danger',
    description: '频率成分突变',
    details: '...'
  }
])

// 方法
const startAnalysis = async () => {
  analyzing.value = true
  try {
    // 执行信号分析
    await new Promise(resolve => setTimeout(resolve, 2000))
    ElMessage.success('分析完成')
  } catch (error) {
    ElMessage.error('分析失败')
  } finally {
    analyzing.value = false
  }
}

const exportResults = () => {
  ElMessage.success('结果导出成功')
}

const handleAnomalyDetail = (anomaly) => {
  // 显示异常详情
}

const handleAnomalyProcess = (anomaly) => {
  // 处理异常
}
</script>

<style lang="scss" scoped>
.signal-analysis {
  .control-panel {
    margin-bottom: 20px;
    
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .analysis-form {
      .full-width {
        width: 100%;
      }
    }
  }
  
  .analysis-results {
    margin-bottom: 20px;
    
    .chart-card {
      margin-bottom: 20px;
      
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .chart-container {
        height: 500px;
        
        .chart {
          height: 100%;
        }
      }
    }
    
    .metric-card {
      margin-bottom: 20px;
      
      .metric-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .metric-content {
        text-align: center;
        padding: 16px;
        
        .metric-value {
          font-size: 32px;
          font-weight: bold;
          color: var(--text-primary);
        }
        
        .metric-unit {
          color: var(--text-regular);
          margin: 8px 0;
        }
        
        .metric-trend {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          
          &.up {
            color: var(--el-color-danger);
          }
          
          &.down {
            color: var(--el-color-success);
          }
        }
      }
    }
  }
  
  .anomaly-card {
    .anomaly-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .anomaly-actions {
      margin-top: 8px;
    }
    
    .no-anomaly {
      text-align: center;
      padding: 40px;
      color: var(--text-regular);
      
      p {
        margin-top: 16px;
      }
    }
  }
}

// 深色主题适配
.dark-theme {
  .control-panel,
  .analysis-results,
  .anomaly-card {
    .el-card {
      background-color: var(--background-color);
    }
  }
}
</style> 
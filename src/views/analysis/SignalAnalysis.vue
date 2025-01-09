<template>
  <div class="signal-analysis">
    <!-- 隐藏的文件输入 -->
    <input
      type="file"
      ref="fileInput"
      style="display: none"
      accept=".csv,.xlsx,.xls"
      @change="handleFileChange"
    />
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
                    type="info"
                    :icon="Upload"
                    @click="triggerFileInput"
                  >
                    导入数据
                  </el-button>
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
            </el-row>

            <!-- 分析参数设置 -->
            <el-divider>分析参数</el-divider>
            
            <el-row :gutter="20">
              <template v-if="analysisParams.method === 'time-frequency'">
                <el-col :md="8" :sm="12" :xs="24">
                  <el-form-item label="尺度">
                    <el-input-number
                      v-model="analysisParams.scaleN"
                      :min="1"
                      :max="100"
                      :step="1"
                      class="full-width"
                      placeholder="请输入尺度N"
                    />
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
              <span>时域信号</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart
              class="chart"
              :option="chartOption2D"
              autoresize
              ref="chartRef"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 频域分析图表 -->
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>频域分析</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart
              class="chart"
              :option="frequencyChartOption"
              autoresize
              ref="frequencyChartRef"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 时频分析图表 -->
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>时频分析</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart
              class="chart"
              :option="timeFreqChartOption"
              autoresize
              ref="timeFreqChartRef"
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
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, ScatterChart, HeatmapChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
  VisualMapComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  Operation,
  Download,
  Upload,
  QuestionFilled,
  ArrowUp,
  ArrowDown,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { frequencyAnalysis, waveletTransform } from '@/api/analysis'

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
  DataZoomComponent,
  VisualMapComponent
])

// 状态变量
const analyzing = ref(false)

// 分析参数
const analysisParams = reactive({
  method: 'time',
  scaleN: 32  // 默认值
})

// 图表配置
const chartOption2D = reactive({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value'
  },
  series: [{
    type: 'line',
    data: [],
    smooth: true
  }]
})

// 频域图表配置
const frequencyChartOption = reactive({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    name: '频率 (Hz)',
    nameLocation: 'middle',
    nameGap: 40,
    data: []
  },
  yAxis: {
    type: 'value',
    name: '幅值',
    nameLocation: 'middle',
    nameGap: 40
  },
  series: [{
    type: 'line',
    data: [],
    smooth: true
  }]
})

// 时频分析图表配置
const timeFreqChartOption = reactive({
  tooltip: {
    trigger: 'item'
  },
  grid: {
    left: '10%',
    right: '10%'
  },
  visualMap: {
    type: 'continuous',
    min: 0,
    max: 1,
    calculable: true,
    orient: 'horizontal',
    left: 'center',
    bottom: '5%',
    inRange: {
      color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
    }
  },
  xAxis: {
    type: 'category',
    name: '时间',
    nameLocation: 'middle',
    nameGap: 40,
    data: []
  },
  yAxis: {
    type: 'category',
    name: '频率 (kHz)',
    nameLocation: 'middle',
    nameGap: 40,
    data: []
  },
  series: [{
    type: 'heatmap',
    data: [],
    label: {
      show: false
    },
    emphasis: {
      itemStyle: {
        borderColor: '#333',
        borderWidth: 1
      }
    },
    progressive: 1000,
    animation: false
  }]
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

// 文件输入引用
const fileInput = ref(null)

// 存储导入的数据
const importedData = ref({
  xData: [],
  yData: []
})

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value.click()
}

// 处理文件选择
const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    if (file.name.endsWith('.csv')) {
      // 处理 CSV 文件
      const text = await file.text()
      Papa.parse(text, {
        complete: (results) => {
          // 假设 CSV 文件有两列：时间和数值
          const data = results.data
          importedData.value.xData = data.map(row => row.time || row.Time || row[0])
          importedData.value.yData = data.map(row => Number(row.value || row.Value || row[1]))
          
          if (analysisParams.method === 'time') {
            updateTimeChart()
          }
          
          console.log('CSV数据:', results.data)
          ElMessage.success('CSV文件导入成功')
        },
        header: true,
        skipEmptyLines: true
      })
    } else {
      // 处理 Excel 文件
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      // 提取时间和幅值数据
      importedData.value.xData = jsonData.map(row => row['时间'])
      importedData.value.yData = jsonData.map(row => parseFloat(row['幅值']))
      
      if (analysisParams.method === 'time') {
        // 直接更新图表
        chartOption2D.xAxis.data = importedData.value.xData
        chartOption2D.series[0].data = importedData.value.yData
        
        // 更新坐标轴名称
        chartOption2D.xAxis.name = '时间'
        chartOption2D.yAxis.name = '幅值'
      }
      
      console.log('Excel数据:', jsonData)
      ElMessage.success('Excel文件导入成功')
    }
  } catch (error) {
    console.error('文件读取失败:', error)
    ElMessage.error('文件读取失败')
  }

  event.target.value = ''
}

// 更新时域图表
const updateTimeChart = () => {
  chartOption2D.xAxis.data = importedData.value.xData
  chartOption2D.series[0].data = importedData.value.yData
}

// 监听分析方法变化
watch(() => analysisParams.method, (newMethod) => {
  if (newMethod === 'time' && importedData.value.xData.length > 0) {
    updateTimeChart()
  }
})

// 方法
const startAnalysis = async () => {
  analyzing.value = true
  try {
    if (analysisParams.method === 'frequency') {
      // 准备频域分析的数据
      const signalDTO = {
        times: importedData.value.xData,   // 直接使用导入的时间数据
        values: importedData.value.yData    // 直接使用导入的幅值数据
      }

      console.log('发送的数据:', signalDTO)
      const result = await frequencyAnalysis(signalDTO)
      console.log('频域分析结果:', result)

      // 更新图表显示频谱结果
      if (result && result.frequencies && result.magnitudes) {
        // 更新频域图表数据
        const frequencies = result.frequencies.map(f => f / 1000)
        frequencyChartOption.xAxis.data = frequencies
        frequencyChartOption.series[0].data = result.magnitudes

        // 更新坐标轴名称
        frequencyChartOption.xAxis.name = '频率 (kHz)'
        frequencyChartOption.yAxis.name = '幅值'

        // 强制图表重新渲染
        nextTick(() => {
          const chart = frequencyChartRef.value
          if (chart) {
            chart.resize()
          }
        })
      }

      ElMessage.success('频域分析完成')
    } else if (analysisParams.method === 'time-frequency') {
      // 生成等差数组 1:1:N
      const scales = Array.from(
        { length: analysisParams.scaleN },
        (_, index) => index + 1
      )

      // 准备时频分析数据
      const request = {
        signal: {
          times: importedData.value.xData,
          values: importedData.value.yData
        },
        scales: scales  // 使用生成的等差数组
      }

      console.log('发送的时频分析数据:', request)
      const result = await waveletTransform(request)
      console.log('时频分析结果:', result)

      // 更新时频图表
      if (result && result.coefficients) {
        // 解构并获取实际的数组
        const times = result.times[0]
        const frequencies = result.frequencies[0]  // 使用频率数组
        const coefficients = result.coefficients
        
        // 准备热力图数据
        const data = []
        // 将频率转换为 kHz 并创建频率刻度
        const freqLabels = frequencies.map(f => (f / 1000).toFixed(2))
        
        // 对每个尺度的系数
        for (let i = 0; i < coefficients.length; i++) {
          // 对每个时间点
          for (let j = 0; j < times.length; j++) {
            // 计算系数的绝对值作为强度
            const intensity = Math.abs(coefficients[i][j] || 0)
            // 确保强度值有效
            if (!isNaN(intensity) && isFinite(intensity)) {
              data.push([j, i, intensity])  // 使用索引作为坐标
            }
          }
        }

        console.log('热力图数据:', {
          timePoints: times.length,
          frequencyPoints: frequencies.length,
          dataPoints: data.length,
          sampleData: data.slice(0, 5)
        })

        // 更新坐标轴数据
        timeFreqChartOption.xAxis.data = times
        timeFreqChartOption.yAxis.data = freqLabels

        // 更新热力图配置
        timeFreqChartOption.series[0] = {
          type: 'heatmap',
          data: data,
          emphasis: {
            itemStyle: {
              borderColor: '#333',
              borderWidth: 1
            }
          },
          coordinateSystem: 'cartesian2d',
          progressive: 1000,
          animation: false,
          itemStyle: {
            borderWidth: 0
          }
        }

        // 更新值域范围
        const maxValue = Math.max(...data.map(item => item[2]))
        const minValue = Math.min(...data.map(item => item[2]))
        console.log('值域范围:', { min: minValue, max: maxValue })

        timeFreqChartOption.visualMap.max = maxValue
        timeFreqChartOption.visualMap.min = minValue

        // 强制图表重新渲染
        nextTick(() => {
          const chart = timeFreqChartRef.value
          if (chart) {
            chart.resize()
          }
        })
      }

      ElMessage.success('时频分析完成')
    } else {
      // 其他分析方法的处理...
      const signals = importedData.value.yData.map(value => parseFloat(value))
      
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(signals)
      })
      
      if (!response.ok) {
        throw new Error('分析请求失败')
      }
      
      const result = await response.json()
      console.log('分析结果:', result)
      ElMessage.success('分析完成')
    }
  } catch (error) {
    console.error('分析失败:', error)
    ElMessage.error(error.message || '分析失败')
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

const chartRef = ref(null)
const frequencyChartRef = ref(null)
const timeFreqChartRef = ref(null)
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
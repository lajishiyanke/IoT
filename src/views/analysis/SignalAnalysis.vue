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
                    <el-option label="模型预测" value="predict" />
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

      <!-- 预测结果列表 -->
      <el-col :span="24" v-if="predictionResults.length > 0">
        <el-card class="prediction-results-card">
          <template #header>
            <div class="card-header">
              <span>预测结果列表</span>
              <el-button type="primary" link @click="predictionResults = []">
                清空列表
              </el-button>
            </div>
          </template>
          
          <el-table :data="predictionResults" style="width: 100%">
            <el-table-column prop="time" label="预测时间" width="180" />
            <el-table-column prop="x" label="X值">
              <template #default="{ row }">
                {{ row.x.toExponential(4) }}
              </template>
            </el-table-column>
            <el-table-column prop="y" label="Y值">
              <template #default="{ row }">
                {{ row.y.toExponential(4) }}
              </template>
            </el-table-column>
            <el-table-column prop="size" label="Size值">
              <template #default="{ row }">
                {{ row.size.toExponential(4) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ $index }">
                <el-button 
                  type="danger" 
                  link 
                  @click="predictionResults.splice($index, 1)"
                >
                  删除
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
  ArrowDown
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { frequencyAnalysis, waveletTransform, signalPredict } from '@/api/analysis'
import axios from 'axios'

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

// 修改时频分析图表配置
const timeFreqChartOption = reactive({
  tooltip: {
    position: 'top',
    formatter: (params) => {
      const time = timeFreqData.times[params.data[0]]
      const scale = timeFreqData.scales[params.data[1]]
      const intensity = params.data[2].toFixed(4)
      return `时间: ${Number(time).toExponential(4)}s<br/>尺度: ${Number(scale).toFixed(2)}<br/>强度: ${intensity}`
    }
  },
  grid: {
    left: '10%',
    right: '10%',
    top: '10%',
    bottom: '15%'
  },
  xAxis: {
    type: 'category',
    name: '时间 (s)',
    nameLocation: 'middle',
    nameGap: 30,
    data: [],
    axisLabel: {
      formatter: (value) => Number(value).toExponential(2)
    }
  },
  yAxis: {
    type: 'category',
    name: '尺度',  // 改为尺度
    nameLocation: 'middle',
    nameGap: 45,
    data: [],
    axisLabel: {
      formatter: (value) => Number(value).toFixed(2)
    }
  },
  visualMap: {
    type: 'continuous',
    min: 0,
    max: 1,
    calculable: true,
    orient: 'horizontal',
    left: 'center',
    bottom: '0%',
    inRange: {
      color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', 
              '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
    },
    realtime: false,
    scale: true
  },
  series: [{
    type: 'heatmap',
    data: [],
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    },
    progressive: 1000,
    animation: false
  }]
})

// 修改存储数据的响应式变量
const timeFreqData = reactive({
  times: [],
  scales: []  // 改为scales
})

// 文件输入引用
const fileInput = ref(null)

// 存储导入的数据
const importedData = ref({
  xData: [],
  yData: []
})

// 存储预测结果列表
const predictionResults = ref([])

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value.click()
}

// 处理文件选择
const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  console.time('数据导入耗时')  // 开始计时
  try {
    if (file.name.endsWith('.csv')) {
      // 处理 CSV 文件
      const text = await file.text()
      Papa.parse(text, {
        complete: (results) => {
          const data = results.data
          
          // 移除空行和无效数据
          const validData = data.filter(row => {
            return row.length >= 2 && 
                   row[0] !== undefined && 
                   row[0] !== null && 
                   row[0] !== '' &&
                   !isNaN(Number(row[1]))
          })
          
          // 第一列为时间，第二列为信号幅值
          importedData.value.xData = validData.map(row => row[0])
          importedData.value.yData = validData.map(row => Number(row[1]))
          
          // 只打印数据点数量和前几个样本
          console.log('数据导入信息:', {
            totalPoints: validData.length,
            sampleData: {
              time: importedData.value.xData.slice(0, 3),
              value: importedData.value.yData.slice(0, 3)
            }
          })
          
          // 更新时域图表
          if (analysisParams.method === 'time') {
            chartOption2D.xAxis = {
              type: 'category',
              name: '时间',
              data: importedData.value.xData
            }
            chartOption2D.series[0].data = importedData.value.yData
          }
          
          ElMessage.success(`CSV文件导入成功，共${validData.length}个数据点`)
          console.timeEnd('数据导入耗时')  // CSV文件处理完成时计时结束
        },
        header: false,
        skipEmptyLines: true,
        dynamicTyping: true,
        error: (error) => {
          console.error('CSV解析错误:', error)
          ElMessage.error('CSV文件解析失败')
          console.timeEnd('数据导入耗时')  // CSV处理出错时也要结束计时
        }
      })
    } else {
      // 处理 Excel 文件
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      // 提取时间和幅值数据
      importedData.value.xData = jsonData.map(row => row['0'])  // 第一列是时间
      importedData.value.yData = jsonData.map(row => Number(row['0_1']))  // 第二列是幅值
      
      if (analysisParams.method === 'time') {
        // 直接更新图表
        chartOption2D.xAxis = {
          type: 'category',
          name: '时间 (s)',
          data: importedData.value.xData
        }
        
        chartOption2D.series[0] = {
          type: 'line',
          name: '幅值',
          data: importedData.value.yData,
          smooth: true
        }
      }
      
      // 打印数据点数量和前几个样本
      console.log('数据导入信息:', {
        totalPoints: jsonData.length,
        sampleData: {
          time: importedData.value.xData.slice(0, 3),
          value: importedData.value.yData.slice(0, 3)
        }
      })
      
      ElMessage.success(`Excel文件导入成功，共${jsonData.length}个数据点`)
      console.timeEnd('数据导入耗时')  // Excel文件处理完成时计时结束
    }
  } catch (error) {
    console.error('文件读取失败:', error)
    ElMessage.error('文件读取失败')
    console.timeEnd('数据导入耗时')  // 发生错误时也要结束计时
  }

  // 清空文件输入，允许重复选择同一文件
  event.target.value = ''
}

// 更新时域图表
const updateTimeChart = () => {
  // 确保数据有效
  if (!importedData.value.xData.length || !importedData.value.yData.length) {
    console.warn('没有有效的数据可以显示')
    return
  }

  chartOption2D.xAxis.data = importedData.value.xData
  chartOption2D.series[0].data = importedData.value.yData
  
  // 更新坐标轴配置
  chartOption2D.xAxis.name = '时间'
  chartOption2D.yAxis.name = '幅值'
}

// 监听分析方法变化
watch(() => analysisParams.method, (newMethod) => {
  if (newMethod === 'time' && importedData.value.xData.length > 0) {
    updateTimeChart()
  }
})

// 添加归一化函数
const normalize = (data, min, max) => {
  return data.map(point => [
    point[0],
    point[1],
    (point[2] - min) / (max - min)
  ])
}

// 方法
const startAnalysis = async () => {
  analyzing.value = true
  try {
    if (analysisParams.method === 'frequency') {
      console.time('频域分析耗时')  // 开始计时
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
      console.timeEnd('频域分析耗时')  // 结束计时
    } else if (analysisParams.method === 'time-frequency') {
      console.time('时频分析耗时')  // 开始计时
      try {
        // 生成对数分布的尺度
        const scales = Array.from(
          { length: analysisParams.scaleN },
          (_, index) => Math.exp(Math.log(2) * index / 8)
        )

        const request = {
          signal: {
            times: [...importedData.value.xData],
            values: [...importedData.value.yData]
          },
          scales: scales
        }

        console.log('发送的时频分析数据:', {
          dataLength: request.signal.times.length,
          scalesLength: request.scales.length,
          scaleRange: [scales[0], scales[scales.length - 1]]
        })

        const result = await waveletTransform(request)

        if (result && result.coefficients) {
          const times = result.times[0]
          const scales = result.scales[0]  // 使用scales
          const coefficients = result.coefficients

          // 更新时间和尺度数据
          timeFreqData.times = times
          timeFreqData.scales = scales

          // 创建热力图数据
          const data = []
          for (let i = 0; i < scales.length; i++) {
            for (let j = 0; j < times.length; j++) {
              const intensity = Math.abs(coefficients[i][j])
              if (!isNaN(intensity) && isFinite(intensity)) {
                data.push([j, i, intensity])
              }
            }
          }

          // 计算值域范围并归一化数据
          let minValue = Infinity
          let maxValue = -Infinity
          for (const point of data) {
            const value = point[2]
            if (value < minValue) minValue = value
            if (value > maxValue) maxValue = value
          }

          const normalizedData = normalize(data, minValue, maxValue)

          // 更新图表配置
          timeFreqChartOption.xAxis.data = times.map(t => t.toExponential(4))
          timeFreqChartOption.yAxis.data = scales.map(s => s.toFixed(2))  // 显示尺度值
          timeFreqChartOption.visualMap.min = 0
          timeFreqChartOption.visualMap.max = 1
          timeFreqChartOption.series[0].data = normalizedData

          // 强制图表重新渲染
          nextTick(() => {
            const chart = timeFreqChartRef.value
            if (chart) {
              chart.resize()
            }
          })

          ElMessage.success('时频分析完成')
          console.timeEnd('时频分析耗时')  // 结束计时
        }
      } catch (error) {
        console.error('时频分析失败:', error)
        ElMessage.error('时频分析失败，请稍后重试')
      }
    } else if (analysisParams.method === 'predict') {
      console.time('模型预测耗时')  // 开始计时
      try {
        const result = await signalPredict({
          values: importedData.value.yData,
          times: importedData.value.xData
        })

        console.log('预测结果:', result)
        
        // 添加新的预测结果到列表
        predictionResults.value.push({
          id: Date.now(),
          x: result.x,
          y: result.y,
          size: result.size,
          time: new Date().toLocaleString(),
          duration: console.timeEnd('模型预测耗时')  // 结束计时并获取耗时
        })

        ElMessage.success('预测完成')
        console.log('模型预测总耗时:', predictionResults.value[predictionResults.value.length - 1].duration)
      } catch (error) {
        console.error('预测失败:', error)
        ElMessage.error('预测失败: ' + error.message)
        console.timeEnd('模型预测耗时')  // 确保在出错时也结束计时
      }
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
  }
}

// 深色主题适配
.dark-theme {
  .control-panel,
  .analysis-results {
    .el-card {
      background-color: var(--background-color);
    }
  }
}

.prediction-results {
  margin-bottom: 20px;
  
  .prediction-card {
    margin-bottom: 20px;
    
    .prediction-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .prediction-container {
      height: 500px;
      
      .el-table {
        height: 100%;
      }
    }
  }
}

.prediction-results-card {
  margin-bottom: 20px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style> 
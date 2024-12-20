<template>
  <div class="trend-analysis">
    <div class="chart-container">
      <v-chart class="chart" :option="chartOption" autoresize />
    </div>
    <div class="analysis-info">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="趋势">
          {{ trend }}
        </el-descriptions-item>
        <el-descriptions-item label="变化率">
          {{ changeRate }}%
        </el-descriptions-item>
        <el-descriptions-item label="预测值">
          {{ prediction }}
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { getTrendAnalysis } from '@/api/analysis'
import { ElMessage } from 'element-plus'

const props = defineProps({
  deviceId: {
    type: [Number, String],
    required: true
  },
  channelId: {
    type: String,
    required: true
  },
  timeRange: {
    type: Object,
    required: true
  }
})

const trend = ref('')
const changeRate = ref(0)
const prediction = ref(0)

const chartOption = reactive({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'time'
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '实际值',
      type: 'line',
      data: []
    },
    {
      name: '趋势线',
      type: 'line',
      data: [],
      lineStyle: {
        type: 'dashed'
      }
    }
  ]
})

const updateTrendAnalysis = async () => {
  try {
    const result = await getTrendAnalysis(props.deviceId, {
      channelId: props.channelId,
      startTime: props.timeRange.start,
      endTime: props.timeRange.end
    })
    
    // 更新图表数据
    chartOption.series[0].data = result.actualData
    chartOption.series[1].data = result.trendData
    
    // 更新分析结果
    trend.value = result.trend
    changeRate.value = result.changeRate
    prediction.value = result.prediction
  } catch (error) {
    ElMessage.error('获取趋势分析结果失败')
  }
}

// 监听属性变化
watch([() => props.channelId, () => props.timeRange], () => {
  updateTrendAnalysis()
})

// 初始化
updateTrendAnalysis()
</script>

<style lang="scss" scoped>
.trend-analysis {
  .chart-container {
    height: 300px;
    
    .chart {
      height: 100%;
    }
  }
  
  .analysis-info {
    margin-top: 20px;
  }
}
</style> 
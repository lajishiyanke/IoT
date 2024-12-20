<template>
  <div class="fft-analysis">
    <div class="chart-container">
      <v-chart class="chart" :option="chartOption" autoresize />
    </div>
    <div class="analysis-info">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="主频">
          {{ mainFrequency }} Hz
        </el-descriptions-item>
        <el-descriptions-item label="幅值">
          {{ amplitude }} mV
        </el-descriptions-item>
        <el-descriptions-item label="信噪比">
          {{ snr }} dB
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { getFFTAnalysis } from '@/api/analysis'
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
  sampleRate: {
    type: Number,
    required: true
  }
})

const mainFrequency = ref(0)
const amplitude = ref(0)
const snr = ref(0)

const chartOption = reactive({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'value',
    name: '频率(Hz)'
  },
  yAxis: {
    type: 'value',
    name: '幅值(dB)'
  },
  series: [
    {
      type: 'line',
      data: [],
      smooth: true
    }
  ]
})

const updateFFTAnalysis = async () => {
  try {
    const result = await getFFTAnalysis(props.deviceId, {
      channelId: props.channelId,
      sampleRate: props.sampleRate
    })
    
    // 更新图表数据
    chartOption.series[0].data = result.spectrum.map((value, index) => [
      index * (props.sampleRate / 2) / (result.spectrum.length - 1),
      value
    ])
    
    // 更新分析结果
    mainFrequency.value = result.mainFrequency
    amplitude.value = result.amplitude
    snr.value = result.snr
  } catch (error) {
    ElMessage.error('获取FFT分析结果失败')
  }
}

// 监听属性变化
watch([() => props.channelId, () => props.sampleRate], () => {
  updateFFTAnalysis()
})

// 初始化
updateFFTAnalysis()
</script>

<style lang="scss" scoped>
.fft-analysis {
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
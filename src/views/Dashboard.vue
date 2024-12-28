import { ref, onMounted, onUnmounted } from 'vue'
import { getUserSensorData } from '@/api/sensor'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

export default {
  setup() {
    const chartRef = ref(null)
    const chartInstance = ref(null)
    const sensorData = ref([])
    let refreshTimer = null

    // 获取传感器数据
    const fetchSensorData = async () => {
      try {
        // 获取最近一小时的数据
        const endTime = new Date()
        const startTime = new Date(endTime - 60 * 60 * 1000) // 一小时前

        const params = {
          channelId: 'channel1', // 只获取通道1的数据
          startTime,
          endTime
        }

        console.log('发送请求参数:', params)
        const response = await getUserSensorData(params)
        console.log('获取到的传感器数据:', response)

        if (response && Array.isArray(response)) {
          // 按时间排序
          sensorData.value = response.sort((a, b) => 
            new Date(a.collectTime) - new Date(b.collectTime)
          )
          // 过滤只显示channel1的数据
          sensorData.value = sensorData.value.filter(item => 
            item.channelId === 'channel1'
          )
          console.log('处理后的数据:', sensorData.value)
          updateChart()
        }
      } catch (error) {
        console.error('获取传感器数据失败:', error)
        ElMessage.error('获取传感器数据失败')
      }
    }

    // 更新图表数据
    const updateChart = () => {
      if (!chartInstance.value || !sensorData.value.length) return

      const seriesData = sensorData.value.map(item => ([
        new Date(item.collectTime),
        item.dataValue
      ]))

      chartInstance.value.setOption({
        series: [{
          data: seriesData
        }]
      })
    }

    // 初始化图表
    const initChart = () => {
      if (chartRef.value) {
        chartInstance.value = echarts.init(chartRef.value)
        const option = {
          title: {
            text: '实时信号趋势'
          },
          tooltip: {
            trigger: 'axis',
            formatter: function(params) {
              const data = params[0]
              return `
                时间：${new Date(data.value[0]).toLocaleString()}<br/>
                幅值：${data.value[1]}
              `
            }
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'time',
            name: '时间',
            axisLabel: {
              formatter: '{HH}:{mm}:{ss}'
            }
          },
          yAxis: {
            type: 'value',
            name: '幅值',
            scale: true // 自适应数据范围
          },
          series: [
            {
              name: '通道1数据',
              type: 'line',
              data: [],
              showSymbol: false,
              smooth: true,
              lineStyle: {
                width: 2
              },
              areaStyle: {
                opacity: 0.2
              }
            }
          ]
        }
        chartInstance.value.setOption(option)
      }
    }

    // 定时刷新数据
    const startDataRefresh = () => {
      fetchSensorData() // 立即获取一次数据
      refreshTimer = setInterval(fetchSensorData, 5000) // 每5秒刷新一次
    }

    onMounted(() => {
      initChart()
      startDataRefresh()

      // 监听窗口大小变化，调整图表大小
      window.addEventListener('resize', () => {
        chartInstance.value?.resize()
      })
    })

    onUnmounted(() => {
      if (refreshTimer) {
        clearInterval(refreshTimer)
      }
      window.removeEventListener('resize', () => {
        chartInstance.value?.resize()
      })
      if (chartInstance.value) {
        chartInstance.value.dispose()
      }
    })

    return {
      chartRef
    }
  }
} 
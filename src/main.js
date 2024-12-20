import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './assets/styles/variables.scss'
import { permission, role } from './directives/permission'
import VChart from 'vue-echarts'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册 ECharts 组件
app.component('v-chart', VChart)

app.use(createPinia())
   .use(router)
   .use(ElementPlus)
   .directive('permission', permission)
   .directive('role', role)
   .mount('#app')

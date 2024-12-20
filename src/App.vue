<template>
  <el-config-provider :locale="zhCn">
    <div class="app-container" :class="{ 'dark-theme': isDarkTheme }">
      <router-view />
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref } from 'vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const isDarkTheme = ref(false)
</script>

<style lang="scss">
.app-container {
  min-height: 100vh;
  
  &.dark-theme {
    background-color: #1a1a1a;
    color: #ffffff;
  }
}

// 重置默认样式
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>

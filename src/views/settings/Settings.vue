<template>
  <div class="settings">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统设置</span>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </div>
      </template>

      <el-form
        ref="settingsForm"
        :model="settings"
        label-width="120px"
      >
        <el-tabs v-model="activeTab">
          <!-- 基础设置 -->
          <el-tab-pane label="基础设置" name="basic">
            <el-form-item label="系统主题">
              <el-radio-group v-model="settings.theme">
                <el-radio-button value="light">浅色</el-radio-button>
                <el-radio-button value="dark">深色</el-radio-button>
                <el-radio-button value="auto">跟随系统</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="语言">
              <el-select v-model="settings.language">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>

            <el-form-item label="时区">
              <el-select v-model="settings.timezone">
                <el-option label="(GMT+08:00) 北京" value="Asia/Shanghai" />
                <el-option label="(GMT+00:00) UTC" value="UTC" />
              </el-select>
            </el-form-item>
          </el-tab-pane>

          <!-- 数据设置 -->
          <el-tab-pane label="数据设置" name="data">
            <el-form-item label="数据保存路径">
              <el-input v-model="settings.dataPath" />
            </el-form-item>

            <el-form-item label="自动备份">
              <el-switch v-model="settings.autoBackup" />
            </el-form-item>

            <el-form-item label="备份周期" v-if="settings.autoBackup">
              <el-select v-model="settings.backupInterval">
                <el-option label="每天" value="daily" />
                <el-option label="每周" value="weekly" />
                <el-option label="每月" value="monthly" />
              </el-select>
            </el-form-item>

            <el-form-item label="数据清理">
              <el-switch v-model="settings.autoCleanup" />
            </el-form-item>

            <el-form-item label="保留时间" v-if="settings.autoCleanup">
              <el-input-number
                v-model="settings.retentionDays"
                :min="1"
                :max="365"
              />
              <span class="unit">天</span>
            </el-form-item>
          </el-tab-pane>

          <!-- 通知设置 -->
          <el-tab-pane label="通知设置" name="notification">
            <el-form-item label="邮件服务器">
              <el-input v-model="settings.smtpServer" />
            </el-form-item>

            <el-form-item label="邮件端口">
              <el-input-number v-model="settings.smtpPort" :min="1" :max="65535" />
            </el-form-item>

            <el-form-item label="发件人邮箱">
              <el-input v-model="settings.senderEmail" />
            </el-form-item>

            <el-form-item label="短信服务">
              <el-select v-model="settings.smsService">
                <el-option label="阿里云" value="aliyun" />
                <el-option label="腾讯云" value="tencent" />
              </el-select>
            </el-form-item>

            <el-form-item label="API密钥">
              <el-input v-model="settings.apiKey" show-password />
            </el-form-item>
          </el-tab-pane>

          <!-- 系统日志 -->
          <el-tab-pane label="系统日志" name="log">
            <el-form-item label="日志级别">
              <el-select v-model="settings.logLevel">
                <el-option label="DEBUG" value="debug" />
                <el-option label="INFO" value="info" />
                <el-option label="WARNING" value="warning" />
                <el-option label="ERROR" value="error" />
              </el-select>
            </el-form-item>

            <el-form-item label="日志保存">
              <el-input v-model="settings.logPath" />
            </el-form-item>

            <el-divider>日志查看</el-divider>

            <el-table :data="logData" height="300" border>
              <el-table-column prop="time" label="时间" width="180" />
              <el-table-column prop="level" label="级别" width="100">
                <template #default="{ row }">
                  <el-tag :type="getLogLevelType(row.level)">
                    {{ row.level }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="message" label="内容" />
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const activeTab = ref('basic')

// 设置数据
const settings = reactive({
  // 基础设置
  theme: 'light',
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  
  // 数据设置
  dataPath: '/data/iot',
  autoBackup: true,
  backupInterval: 'daily',
  autoCleanup: true,
  retentionDays: 30,
  
  // 通知设置
  smtpServer: 'smtp.example.com',
  smtpPort: 465,
  senderEmail: 'noreply@example.com',
  smsService: 'aliyun',
  apiKey: '******',
  
  // 日志设置
  logLevel: 'info',
  logPath: '/var/log/iot'
})

// 日志数据
const logData = [
  {
    time: '2024-03-20 15:30:00',
    level: 'INFO',
    message: '系统启动'
  },
  {
    time: '2024-03-20 15:30:01',
    level: 'WARNING',
    message: '数据库连接延迟'
  },
  {
    time: '2024-03-20 15:30:02',
    level: 'ERROR',
    message: '传感器连接失败'
  }
]

// 方法
const getLogLevelType = (level) => {
  const types = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'danger',
    DEBUG: ''
  }
  return types[level] || ''
}

const saveSettings = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('设置保存成功')
  } catch (error) {
    ElMessage.error('设置保存失败')
  }
}
</script>

<style lang="scss" scoped>
.settings {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .unit {
    margin-left: 8px;
    color: var(--text-regular);
  }
}

// 深色主题适配
.dark-theme {
  .el-card {
    background-color: var(--background-color);
  }
}
</style> 
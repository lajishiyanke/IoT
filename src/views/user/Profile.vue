<template>
  <div class="user-profile">
    <el-row :gutter="20">
      <!-- 基本信息卡片 -->
      <el-col :md="8" :sm="24">
        <el-card class="info-card">
          <div class="user-header">
            <el-upload
              class="avatar-uploader"
              action="/api/upload"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
            >
              <el-avatar
                :size="100"
                :src="userInfo.avatar"
                class="avatar"
              >
                {{ userInfo.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <div class="upload-mask">
                <el-icon><Camera /></el-icon>
              </div>
            </el-upload>
            <h2>{{ userInfo.username }}</h2>
            <p>{{ userInfo.role }}</p>
          </div>
          
          <el-divider />
          
          <div class="info-list">
            <div class="info-item">
              <el-icon><Message /></el-icon>
              <span>{{ userInfo.email }}</span>
            </div>
            <div class="info-item">
              <el-icon><Phone /></el-icon>
              <span>{{ userInfo.phone }}</span>
            </div>
            <div class="info-item">
              <el-icon><Location /></el-icon>
              <span>{{ userInfo.department }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 详细信息表单 -->
      <el-col :md="16" :sm="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
              <el-button type="primary" @click="saveProfile">保存修改</el-button>
            </div>
          </template>

          <el-form
            ref="profileForm"
            :model="profileData"
            :rules="rules"
            label-width="100px"
          >
            <el-tabs v-model="activeTab">
              <el-tab-pane label="基本信息" name="basic">
                <el-form-item label="用户名" prop="username">
                  <el-input v-model="profileData.username" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="profileData.email" />
                </el-form-item>
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="profileData.phone" />
                </el-form-item>
                <el-form-item label="部门" prop="department">
                  <el-input v-model="profileData.department" />
                </el-form-item>
                <el-form-item label="职位" prop="position">
                  <el-input v-model="profileData.position" />
                </el-form-item>
              </el-tab-pane>

              <el-tab-pane label="安全设置" name="security">
                <el-form-item label="原密码" prop="oldPassword">
                  <el-input
                    v-model="profileData.oldPassword"
                    type="password"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input
                    v-model="profileData.newPassword"
                    type="password"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input
                    v-model="profileData.confirmPassword"
                    type="password"
                    show-password
                  />
                </el-form-item>
              </el-tab-pane>

              <el-tab-pane label="通知设置" name="notification">
                <el-form-item label="邮件通知">
                  <el-switch v-model="profileData.emailNotification" />
                </el-form-item>
                <el-form-item label="短信通知">
                  <el-switch v-model="profileData.smsNotification" />
                </el-form-item>
                <el-form-item label="异常提醒">
                  <el-switch v-model="profileData.anomalyAlert" />
                </el-form-item>
              </el-tab-pane>
            </el-tabs>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import {
  Camera,
  Message,
  Phone,
  Location
} from '@element-plus/icons-vue'

const authStore = useAuthStore()
const activeTab = ref('basic')

// 用户信息
const userInfo = reactive({
  username: 'Admin User',
  role: '系统管理员',
  email: 'admin@example.com',
  phone: '13800138000',
  department: '研发部',
  avatar: ''
})

// 表单数据
const profileData = reactive({
  username: userInfo.username,
  email: userInfo.email,
  phone: userInfo.phone,
  department: userInfo.department,
  position: '高级工程师',
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  emailNotification: true,
  smsNotification: true,
  anomalyAlert: true
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== profileData.newPassword) {
          callback(new Error('两次输入密码不一致!'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 方法
const handleAvatarSuccess = (response) => {
  userInfo.avatar = response.url
  ElMessage.success('头像上传成功')
}

const saveProfile = async () => {
  try {
    // 保存用户信息
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}
</script>

<style lang="scss" scoped>
.user-profile {
  .info-card {
    .user-header {
      text-align: center;
      padding: 20px 0;
      
      .avatar-uploader {
        position: relative;
        display: inline-block;
        cursor: pointer;
        
        .avatar {
          display: block;
          margin: 0 auto;
        }
        
        .upload-mask {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 100px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #fff;
          opacity: 0;
          transition: opacity 0.3s;
          
          &:hover {
            opacity: 1;
          }
        }
      }
      
      h2 {
        margin: 16px 0 8px;
        color: var(--text-primary);
      }
      
      p {
        margin: 0;
        color: var(--text-regular);
      }
    }
    
    .info-list {
      padding: 0 20px;
      
      .info-item {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        color: var(--text-regular);
        
        .el-icon {
          margin-right: 8px;
        }
      }
    }
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

// 深色主题适配
.dark-theme {
  .info-card,
  .el-card {
    background-color: var(--background-color);
  }
}
</style> 
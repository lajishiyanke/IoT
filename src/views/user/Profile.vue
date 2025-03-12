<template>
  <div class="user-profile">
    <el-row :gutter="20">
      <!-- 基本信息卡片 -->
      <el-col :md="8" :sm="24">
        <el-card class="info-card">
          <div class="user-header">
            <el-avatar
              :size="100"
              :src="defaultAvatar"
              class="avatar"
            >
              {{ userInfo.username?.charAt(0)?.toUpperCase() }}
            </el-avatar>
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
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { getCurrentUser, updateUser, changePassword } from '@/api/user'
import {
  Message,
  Phone
} from '@element-plus/icons-vue'

const authStore = useAuthStore()
const activeTab = ref('basic')

// 用户信息
const userInfo = reactive({
  username: '',
  role: '',
  email: '',
  phone: '',
  avatar: ''
})

// 表单数据
const profileData = reactive({
  username: '',
  email: '',
  phone: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  emailNotification: true,
  smsNotification: true,
  anomalyAlert: true
})

// 表单验证规则
const rules = {
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

// 添加默认头像
const defaultAvatar = 'public/20200414210224_dnzpo.jpg'  // 替换为您的默认头像路径

// 获取当前用户信息
const fetchUserInfo = async () => {
  try {
    const response = await getCurrentUser()
    // 更新用户信息
    Object.assign(userInfo, response)
    // 更新表单数据
    Object.assign(profileData, {
      username: response.username,
      email: response.email,
      phone: response.phone
    })
    console.log('获取到的用户信息:', response)
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }
}

// 保存个人信息
const saveProfile = async () => {
  try {
    // 先进行表单验证
    await profileForm.value.validate()
    
    if (activeTab.value === 'basic') {
      // 保存基本信息
      await updateUser(userInfo.id, {
        email: profileData.email,
        phone: profileData.phone
      })
      ElMessage.success('保存成功')
      // 重新获取用户信息
      await fetchUserInfo()
    } else if (activeTab.value === 'security') {
      // 处理密码修改
      if (!profileData.oldPassword || !profileData.newPassword) {
        ElMessage.warning('请填写完整的密码信息')
        return
      }
      
      if (profileData.newPassword !== profileData.confirmPassword) {
        ElMessage.error('两次输入的密码不一致')
        return
      }
      
      try {
        // 调用修改密码接口
        await changePassword({
          oldPassword: profileData.oldPassword,
          newPassword: profileData.newPassword
        })
        
        // 清空密码输入框
        profileData.oldPassword = ''
        profileData.newPassword = ''
        profileData.confirmPassword = ''
        
        ElMessage.success('密码修改成功')
      } catch (error) {
        if (error.response?.status === 403) {
          ElMessage.error('原密码错误或权限不足')
        } else {
          ElMessage.error(error.response?.data?.message || '密码修改失败')
        }
      }
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(error.response?.data?.message || '保存失败')
  }
}

// 添加表单引用
const profileForm = ref(null)

// 在组件挂载时获取用户信息
onMounted(() => {
  fetchUserInfo()
})
</script>

<style lang="scss" scoped>
.user-profile {
  .info-card {
    .user-header {
      text-align: center;
      padding: 20px 0;
      
      .avatar {
        display: block;
        margin: 0 auto;
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
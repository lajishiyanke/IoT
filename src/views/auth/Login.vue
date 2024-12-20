<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <img src="@/assets/logo.png" alt="Logo" class="logo">
        <h2>物联网信号监测系统</h2>
      </div>
      
      <el-form
        ref="loginForm"
        :model="loginData"
        :rules="rules"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginData.username"
            prefix-icon="User"
            placeholder="请输入用户名"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginData.password"
            prefix-icon="Lock"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        
        <div class="remember-forgot">
          <el-checkbox v-model="loginData.remember">记住我</el-checkbox>
          <el-link type="primary" @click="forgotPassword">忘记密码？</el-link>
        </div>
        
        <el-button
          type="primary"
          class="login-button"
          :loading="loading"
          @click="handleLogin"
        >
          登录
        </el-button>
        
        <div class="register-link">
          还没有账号？
          <el-link type="primary" @click="$router.push('/register')">立即注册</el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { login } from '@/api/auth'
import { getCurrentUser } from '@/api/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const loginForm = ref(null)

const loginData = reactive({
  username: '',
  password: '',
  remember: false
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  try {
    loading.value = true
    const response = await login({
      username: loginData.username,
      password: loginData.password
    })
    
    if (response && response.token) {
      // 确保 token 格式正确
      const token = response.token.startsWith('Bearer ') 
        ? response.token 
        : `Bearer ${response.token}`
        
      // 保存 token
      localStorage.setItem('token', token)
      
      // 更新 store
      authStore.setToken(token)
      
      // 获取用户信息
      const userInfo = await getCurrentUser()
      authStore.setUserInfo(userInfo)
      
      ElMessage.success('登录成功')
      router.replace('/dashboard')
    } else {
      throw new Error('登录失败：未获取到有效的 token')
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error(error.response?.data?.message || '登录失败')
  } finally {
    loading.value = false
  }
}

const forgotPassword = () => {
  router.push('/forgot-password')
}
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-color-light) 0%, var(--background-color) 100%);
  
  .login-box {
    width: 420px;
    padding: 40px;
    background: var(--background-color);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    
    .login-header {
      text-align: center;
      margin-bottom: 40px;
      
      .logo {
        width: 80px;
        height: 80px;
        margin-bottom: 16px;
      }
      
      h2 {
        color: var(--text-primary);
        font-size: 24px;
        margin: 0;
      }
    }
    
    .login-form {
      .remember-forgot {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      
      .login-button {
        width: 100%;
        height: 40px;
        font-size: 16px;
        margin-bottom: 16px;
      }
      
      .register-link {
        text-align: center;
        color: var(--text-regular);
      }
    }
  }
}

.dark-theme {
  .login-box {
    background: var(--background-color-light);
  }
}
</style> 
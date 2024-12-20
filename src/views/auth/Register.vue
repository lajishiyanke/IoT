<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <h2>注册账号</h2>
        <p>欢迎加入物联网信号监测系统</p>
      </div>
      
      <el-form
        ref="registerForm"
        :model="registerData"
        :rules="rules"
        class="register-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerData.username"
            prefix-icon="User"
            placeholder="请输入用户名"
          />
        </el-form-item>
        
        <el-form-item prop="email">
          <el-input
            v-model="registerData.email"
            prefix-icon="Message"
            placeholder="请输入邮箱"
          >
            <template #append>
              <el-button
                :disabled="!!countdown || !registerData.email"
                @click="handleSendVerificationCode"
              >
                {{ countdown ? `${countdown}s` : '获取验证码' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="verificationCode">
          <el-input
            v-model="registerData.verificationCode"
            prefix-icon="Key"
            placeholder="请输入验证码"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="registerData.password"
            prefix-icon="Lock"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerData.confirmPassword"
            prefix-icon="Lock"
            type="password"
            placeholder="请确认密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item prop="phone">
          <el-input
            v-model="registerData.phone"
            prefix-icon="Phone"
            placeholder="请输入手机号"
          />
        </el-form-item>
        
        <el-button
          type="primary"
          class="register-button"
          :loading="loading"
          @click="handleRegister"
        >
          注册
        </el-button>
        
        <div class="login-link">
          已有账号？
          <el-link type="primary" @click="$router.push('/login')">立即登录</el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { register, sendVerificationCode } from '@/api/auth'
import { ElMessage } from 'element-plus'
import { emailValidator } from '@/utils/validate'

const router = useRouter()
const loading = ref(false)
const countdown = ref(0)
let countdownTimer = null

const registerData = reactive({
  username: '',
  email: '',
  verificationCode: '',
  password: '',
  confirmPassword: '',
  phone: ''
})

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else {
    if (registerData.confirmPassword !== '') {
      registerForm.value?.validateField('confirmPassword')
    }
    callback()
  }
}

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerData.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { validator: emailValidator, trigger: 'blur' }
  ],
  verificationCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度应为6位', trigger: 'blur' }
  ],
  password: [
    { validator: validatePass, trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validatePass2, trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const startCountdown = () => {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

const handleSendVerificationCode = async () => {
  const emailRule = rules.email[1]
  let isValid = true
  emailRule.validator(null, registerData.email, (error) => {
    if (error) {
      ElMessage.error('请输入正确的邮箱地址')
      isValid = false
    }
  })
  
  if (!isValid) return
  
  try {
    await sendVerificationCode(registerData.email)
    ElMessage.success('验证码已发送')
    startCountdown()
  } catch (error) {
    console.error('发送验证码错误:', error)
    ElMessage.error(error.response?.data?.message || '验证码发送失败')
  }
}

const handleRegister = async () => {
  try {
    loading.value = true
    await register({
      username: registerData.username,
      password: registerData.password,
      email: registerData.email,
      phone: registerData.phone,
      verificationCode: registerData.verificationCode
    })
    ElMessage.success('注册成功')
    router.push('/login')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '注册失败')
  } finally {
    loading.value = false
  }
}

// 组件卸载时清除定时器
onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style lang="scss" scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-color-light) 0%, var(--background-color) 100%);
  
  .register-box {
    width: 480px;
    padding: 40px;
    background: var(--background-color);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    
    .register-header {
      text-align: center;
      margin-bottom: 40px;
      
      h2 {
        color: var(--text-primary);
        font-size: 24px;
        margin: 0 0 8px;
      }
      
      p {
        color: var(--text-regular);
        margin: 0;
      }
    }
    
    .register-form {
      .register-button {
        width: 100%;
        height: 40px;
        font-size: 16px;
        margin-bottom: 16px;
      }
      
      .login-link {
        text-align: center;
        color: var(--text-regular);
      }
    }
  }
}

.dark-theme {
  .register-box {
    background: var(--background-color-light);
  }
}
</style> 
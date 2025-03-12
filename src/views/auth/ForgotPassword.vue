<template>
  <div class="forgot-password">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <h2>重置密码</h2>
        </div>
      </template>

      <el-form 
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input 
            v-model="form.email"
            placeholder="请输入邮箱"
          >
            <template #append>
              <el-button 
                :disabled="!!countdown || !form.email"
                @click="sendCode"
              >
                {{ countdown ? `${countdown}s后重试` : '发送验证码' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="验证码" prop="code">
          <el-input 
            v-model="form.code"
            placeholder="请输入验证码"
          />
        </el-form-item>

        <el-form-item label="新密码" prop="password">
          <el-input 
            v-model="form.password"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="form.confirmPassword"
            type="password" 
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm">确认重置</el-button>
          <el-button @click="$router.push('/login')">返回登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { sendResetCode, resetPassword } from '@/api/auth'

const router = useRouter()
const formRef = ref(null)
const countdown = ref(0)

const form = reactive({
  email: '',
  code: '',
  password: '',
  confirmPassword: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度应为6位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== form.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 发送验证码
const sendCode = async () => {
  try {
    await sendResetCode(form.email)
    ElMessage.success('验证码已发送到邮箱')
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    console.error('发送验证码失败:', error)
  }
}

// 提交重置密码
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    await resetPassword({
      email: form.email,
      code: form.code,
      newPassword: form.password
    })
    
    ElMessage.success('密码重置成功')
    router.push('/login')
  } catch (error) {
    console.error('重置密码失败:', error)
  }
}
</script>

<style lang="scss" scoped>
.forgot-password {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;

  .form-card {
    width: 500px;
    
    .card-header {
      text-align: center;
      
      h2 {
        margin: 0;
        color: #303133;
      }
    }
  }
}
</style> 
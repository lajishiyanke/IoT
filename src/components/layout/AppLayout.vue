<template>
  <div class="app-layout">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside :width="isCollapse ? '64px' : '200px'" class="aside">
        <div class="logo-container">
          <img src="@/assets/logo.png" alt="Logo" class="logo">
          <span v-show="!isCollapse">物联网监测系统</span>
        </div>
        
        <el-menu
          :collapse="isCollapse"
          :default-active="activeMenu"
          class="menu"
          router
        >
          <el-menu-item index="/dashboard">
            <el-icon><Monitor /></el-icon>
            <template #title>仪表盘</template>
          </el-menu-item>
          
          <el-menu-item index="/sensors">
            <el-icon><Connection /></el-icon>
            <template #title>传感器监测</template>
          </el-menu-item>
          
          <el-menu-item index="/analysis">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>信号分析</template>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <!-- 顶部导航 -->
        <el-header class="header">
          <div class="header-left">
            <el-button
              type="text"
              @click="toggleCollapse"
              class="collapse-btn"
            >
              <el-icon>
                <component :is="isCollapse ? 'Expand' : 'Fold'" />
              </el-icon>
            </el-button>
            <breadcrumb />
          </div>
          
          <div class="header-right">
            <el-switch
              v-model="isDarkMode"
              class="theme-switch"
              inline-prompt
              :active-icon="Moon"
              :inactive-icon="Sunny"
              @change="toggleTheme"
            />
            
            <el-dropdown trigger="click" @command="handleCommand">
              <div class="user-info">
                <el-avatar :size="32" :src="userInfo?.avatar">
                  {{ userInfo?.username?.charAt(0)?.toUpperCase() }}
                </el-avatar>
                <span class="username">{{ userInfo?.username }}</span>
              </div>
              
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>个人信息
                  </el-dropdown-item>
                  <el-dropdown-item command="settings">
                    <el-icon><Setting /></el-icon>系统设置
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 主要内容区 -->
        <el-main class="main">
          <router-view v-slot="{ Component }">
            <keep-alive :include="['Dashboard', 'Sensors', 'Analysis']">
              <component 
                :is="Component" 
                :key="$route.fullPath"
              />
            </keep-alive>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  Monitor,
  Connection,
  DataAnalysis,
  Expand,
  Fold,
  Moon,
  Sunny,
  User,
  Setting,
  SwitchButton
} from '@element-plus/icons-vue'
import Breadcrumb from './Breadcrumb.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isCollapse = ref(false)
const isDarkMode = ref(document.body.classList.contains('dark-theme'))
const userInfo = computed(() => authStore.userInfo)

const activeMenu = computed(() => route.path)

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const toggleTheme = (value) => {
  document.body.classList.toggle('dark-theme', value)
  localStorage.setItem('theme', value ? 'dark' : 'light')
}

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await authStore.handleLogout()
        
      } catch (error) {
        if (error !== 'cancel' && error.toString() !== 'Error: cancel') {
          console.error('退出登录错误:', error)
        }
      }
      break
  }
}
</script>

<style lang="scss" scoped>
.app-layout {
  height: 100vh;
  
  .aside {
    background-color: var(--background-color);
    border-right: 1px solid var(--border-color);
    transition: width 0.3s;
    
    .logo-container {
      height: 60px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      overflow: hidden;
      
      .logo {
        width: 32px;
        height: 32px;
        margin-right: 12px;
      }
      
      span {
        font-size: 16px;
        font-weight: bold;
        color: var(--text-primary);
        white-space: nowrap;
      }
    }
    
    .menu {
      border-right: none;
    }
  }
  
  .header {
    background-color: var(--background-color);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    
    .header-left {
      display: flex;
      align-items: center;
      
      .collapse-btn {
        margin-right: 16px;
        font-size: 20px;
      }
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .theme-switch {
        margin-right: 16px;
      }
      
      .user-info {
        display: flex;
        align-items: center;
        cursor: pointer;
        
        .username {
          margin-left: 8px;
          color: var(--text-primary);
        }
      }
    }
  }
  
  .main {
    background-color: var(--background-color-light);
    padding: 20px;
  }
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePermissionStore = defineStore('permission', () => {
  // 用户角色
  const roles = ref([])
  // 用户权限
  const permissions = ref([])

  // 是否有指定权限
  const hasPermission = (permission) => {
    return permissions.value.includes(permission)
  }

  // 是否有指定角色
  const hasRole = (role) => {
    return roles.value.includes(role)
  }

  // 设置用户权限
  const setPermissions = (userPermissions) => {
    permissions.value = userPermissions
  }

  // 设置用户角色
  const setRoles = (userRoles) => {
    roles.value = userRoles
  }

  return {
    roles,
    permissions,
    hasPermission,
    hasRole,
    setPermissions,
    setRoles
  }
}) 
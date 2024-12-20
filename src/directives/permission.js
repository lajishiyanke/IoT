import { usePermissionStore } from '@/stores/permission'

// v-permission 指令
export const permission = {
  mounted(el, binding) {
    const permissionStore = usePermissionStore()
    const { value } = binding

    if (value && value.length > 0) {
      const hasPermission = permissionStore.hasPermission(value)
      if (!hasPermission) {
        el.parentNode?.removeChild(el)
      }
    }
  }
}

// v-role 指令
export const role = {
  mounted(el, binding) {
    const permissionStore = usePermissionStore()
    const { value } = binding

    if (value && value.length > 0) {
      const hasRole = permissionStore.hasRole(value)
      if (!hasRole) {
        el.parentNode?.removeChild(el)
      }
    }
  }
} 
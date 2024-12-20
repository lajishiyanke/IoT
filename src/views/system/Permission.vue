<template>
  <div class="permission-management">
    <!-- 角色管理 -->
    <el-card class="role-card">
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button
            type="primary"
            @click="showAddRole = true"
            v-permission="'role:add'"
          >
            添加角色
          </el-button>
        </div>
      </template>

      <el-table :data="roles" border style="width: 100%">
        <el-table-column prop="name" label="角色名称" width="180" />
        <el-table-column prop="code" label="角色标识" width="180" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button
                type="primary"
                link
                @click="editRole(row)"
                v-permission="'role:edit'"
              >
                编辑
              </el-button>
              <el-button
                type="primary"
                link
                @click="assignPermissions(row)"
                v-permission="'role:assign'"
              >
                分配权限
              </el-button>
              <el-button
                type="danger"
                link
                @click="deleteRole(row)"
                v-permission="'role:delete'"
              >
                删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 权限管理 -->
    <el-card class="permission-card">
      <template #header>
        <div class="card-header">
          <span>权限管理</span>
          <el-button
            type="primary"
            @click="showAddPermission = true"
            v-permission="'permission:add'"
          >
            添加权限
          </el-button>
        </div>
      </template>

      <el-table
        :data="permissions"
        border
        row-key="id"
        :tree-props="{ children: 'children' }"
      >
        <el-table-column prop="name" label="权限名称" />
        <el-table-column prop="code" label="权限标识" width="180" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getPermissionType(row.type)">
              {{ row.typeText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button
                type="primary"
                link
                @click="editPermission(row)"
                v-permission="'permission:edit'"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                link
                @click="deletePermission(row)"
                v-permission="'permission:delete'"
              >
                删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑角色对话框 -->
    <el-dialog
      v-model="showAddRole"
      :title="editingRole ? '编辑角色' : '添加角色'"
      width="500px"
    >
      <el-form
        ref="roleForm"
        :model="roleForm"
        :rules="roleRules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" />
        </el-form-item>
        <el-form-item label="角色标识" prop="code">
          <el-input v-model="roleForm.code" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="roleForm.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="roleForm.status"
            active-value="active"
            inactive-value="inactive"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddRole = false">取消</el-button>
          <el-button type="primary" @click="saveRole">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加/编辑权限对话框 -->
    <el-dialog
      v-model="showAddPermission"
      :title="editingPermission ? '编辑权限' : '添加权限'"
      width="500px"
    >
      <el-form
        ref="permissionForm"
        :model="permissionForm"
        :rules="permissionRules"
        label-width="100px"
      >
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="permissionForm.name" />
        </el-form-item>
        <el-form-item label="权限标识" prop="code">
          <el-input v-model="permissionForm.code" />
        </el-form-item>
        <el-form-item label="权限类型" prop="type">
          <el-select v-model="permissionForm.type">
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
            <el-option label="接口" value="api" />
          </el-select>
        </el-form-item>
        <el-form-item label="上级权限">
          <el-tree-select
            v-model="permissionForm.parentId"
            :data="permissionTree"
            check-strictly
            node-key="id"
            :props="{
              label: 'name',
              value: 'id'
            }"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddPermission = false">取消</el-button>
          <el-button type="primary" @click="savePermission">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分配权限对话框 -->
    <el-dialog
      v-model="showAssignPermission"
      title="分配权限"
      width="500px"
    >
      <el-tree
        ref="permissionTree"
        :data="permissionTree"
        show-checkbox
        node-key="id"
        :props="{
          label: 'name',
          children: 'children'
        }"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAssignPermission = false">取消</el-button>
          <el-button type="primary" @click="saveAssignPermission">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { permission } from '@/directives/permission'

// 角色数据
const roles = ref([
  {
    id: 1,
    name: '系统管理员',
    code: 'admin',
    description: '系统管理员，拥有所有权限',
    status: 'active'
  },
  {
    id: 2,
    name: '运维人员',
    code: 'operator',
    description: '运维人员，负责系统维护',
    status: 'active'
  }
])

// 权限数据
const permissions = ref([
  {
    id: 1,
    name: '系统管理',
    code: 'system',
    type: 'menu',
    typeText: '菜单',
    children: [
      {
        id: 11,
        name: '用户管理',
        code: 'system:user',
        type: 'menu',
        typeText: '菜单'
      },
      {
        id: 12,
        name: '角色管理',
        code: 'system:role',
        type: 'menu',
        typeText: '菜单'
      }
    ]
  }
])

// 表单数据
const roleForm = reactive({
  name: '',
  code: '',
  description: '',
  status: 'active'
})

const permissionForm = reactive({
  name: '',
  code: '',
  type: 'menu',
  parentId: null
})

// 对话框控制
const showAddRole = ref(false)
const showAddPermission = ref(false)
const showAssignPermission = ref(false)
const editingRole = ref(null)
const editingPermission = ref(null)

// 验证规则
const roleRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色标识', trigger: 'blur' }
  ]
}

const permissionRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限标识', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择权限类型', trigger: 'change' }
  ]
}

// 权限树
const permissionTree = computed(() => {
  return permissions.value
})

// 方法
const getPermissionType = (type) => {
  const types = {
    menu: '',
    button: 'success',
    api: 'info'
  }
  return types[type] || ''
}

const editRole = (role) => {
  editingRole.value = role
  Object.assign(roleForm, role)
  showAddRole.value = true
}

const editPermission = (permission) => {
  editingPermission.value = permission
  Object.assign(permissionForm, permission)
  showAddPermission.value = true
}

const assignPermissions = (role) => {
  showAssignPermission.value = true
  // TODO: 加载角色已有权限
}

const deleteRole = async (role) => {
  try {
    await ElMessageBox.confirm('确认删除该角色？', '提示', {
      type: 'warning'
    })
    // TODO: 调用删除API
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

const deletePermission = async (permission) => {
  try {
    await ElMessageBox.confirm('确认删除该权限？', '提示', {
      type: 'warning'
    })
    // TODO: 调用删除API
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

const saveRole = async () => {
  // TODO: 保存角色
  showAddRole.value = false
  ElMessage.success('保存成功')
}

const savePermission = async () => {
  // TODO: 保存权限
  showAddPermission.value = false
  ElMessage.success('保存成功')
}

const saveAssignPermission = async () => {
  // TODO: 保存权限分配
  showAssignPermission.value = false
  ElMessage.success('权限分配成功')
}
</script>

<style lang="scss" scoped>
.permission-management {
  .role-card,
  .permission-card {
    margin-bottom: 20px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}

// 深色主题适配
.dark-theme {
  .el-card {
    background-color: var(--background-color);
  }
}
</style> 
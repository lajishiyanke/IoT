<template>
  <el-dialog
    v-model="visible"
    title="处理告警"
    width="500px"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="处理说明" prop="handleNote">
        <el-input
          v-model="form.handleNote"
          type="textarea"
          :rows="4"
          placeholder="请输入处理说明"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">
          确认
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { handleAlarm } from '@/api/alarm'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  alarm: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const form = ref({
  handleNote: ''
})

const rules = {
  handleNote: [
    { required: true, message: '请输入处理说明', trigger: 'blur' }
  ]
}

const formRef = ref(null)

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    await handleAlarm(props.alarm.id, {
      handleNote: form.value.handleNote
    })
    
    ElMessage.success('处理成功')
    visible.value = false
    emit('success')
  } catch (error) {
    ElMessage.error('处理失败')
  }
}
</script> 
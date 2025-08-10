<template>
  <el-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
    :title="`达人详情: ${daren?.nickname || ''}`" width="70%">
    <div v-if="daren" class="detail-content">
      <el-alert title="功能迁移提示" type="info" description="详情功能已迁移到独立页面，请点击表格中的详情按钮查看完整信息。" show-icon :closable="false" />
    </div>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  daren: any
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  save: []
}>()
</script>

<style scoped>
.detail-content {
  padding: 20px 0;
}
</style>
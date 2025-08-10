<template>
  <div class="batch-operations">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>批量操作</h3>
          <el-tag v-if="selectedIds.length > 0" type="info">
            已选择 {{ selectedIds.length }} 项
          </el-tag>
        </div>
      </template>

      <div class="operation-buttons">
        <el-button 
          type="primary" 
          @click="showBatchUpdateDialog = true"
          :disabled="selectedIds.length === 0"
          :icon="Edit"
        >
          批量编辑
        </el-button>
        
        <el-button 
          type="success" 
          @click="batchExport"
          :disabled="selectedIds.length === 0"
          :loading="exporting"
          :icon="Download"
        >
          导出选中
        </el-button>
        
        <el-button 
          type="warning" 
          @click="showBatchImportDialog = true"
          :icon="Upload"
        >
          批量导入
        </el-button>
        
        <el-popconfirm
          title="确定删除选中的达人吗？此操作不可恢复！"
          @confirm="batchDelete"
        >
          <template #reference>
            <el-button 
              type="danger" 
              :disabled="selectedIds.length === 0"
              :loading="deleting"
              :icon="Delete"
            >
              批量删除
            </el-button>
          </template>
        </el-popconfirm>
      </div>
    </el-card>

    <!-- Batch Update Dialog -->
    <el-dialog
      v-model="showBatchUpdateDialog"
      title="批量编辑"
      width="50%"
    >
      <el-form :model="batchUpdateForm" label-width="120px">
        <el-alert
          title="提示"
          description="只有勾选的字段会被更新，未勾选的字段保持原值不变"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        />
        
        <div class="batch-form-item">
          <el-checkbox v-model="updateFields.period">期数</el-checkbox>
          <el-select
            v-model="batchUpdateForm.period"
            placeholder="选择期数"
            :disabled="!updateFields.period"
            filterable
            allow-create
            style="width: 200px; margin-left: 10px"
          >
            <el-option
              v-for="period in periodOptions"
              :key="period"
              :label="period"
              :value="period"
            />
          </el-select>
        </div>

        <div class="batch-form-item">
          <el-checkbox v-model="updateFields.hasConnection">建联状态</el-checkbox>
          <el-switch
            v-model="batchUpdateForm.hasConnection"
            :disabled="!updateFields.hasConnection"
            active-text="已建联"
            inactive-text="未建联"
            style="margin-left: 10px"
          />
        </div>

        <div class="batch-form-item">
          <el-checkbox v-model="updateFields.arrivedAtStore">到店状态</el-checkbox>
          <el-switch
            v-model="batchUpdateForm.arrivedAtStore"
            :disabled="!updateFields.arrivedAtStore"
            active-text="已到店"
            inactive-text="未到店"
            style="margin-left: 10px"
          />
        </div>

        <div class="batch-form-item">
          <el-checkbox v-model="updateFields.reviewed">审稿状态</el-checkbox>
          <el-switch
            v-model="batchUpdateForm.reviewed"
            :disabled="!updateFields.reviewed"
            active-text="已审稿"
            inactive-text="未审稿"
            style="margin-left: 10px"
          />
        </div>

        <div class="batch-form-item">
          <el-checkbox v-model="updateFields.published">发布状态</el-checkbox>
          <el-switch
            v-model="batchUpdateForm.published"
            :disabled="!updateFields.published"
            active-text="已发布"
            inactive-text="未发布"
            style="margin-left: 10px"
          />
        </div>

        <div class="batch-form-item">
          <el-checkbox v-model="updateFields.contactPerson">对接人</el-checkbox>
          <el-input
            v-model="batchUpdateForm.contactPerson"
            placeholder="输入对接人"
            :disabled="!updateFields.contactPerson"
            style="width: 200px; margin-left: 10px"
          />
        </div>

        <div class="batch-form-item">
          <el-checkbox v-model="updateFields.cooperationMethod">合作方式</el-checkbox>
          <el-input
            v-model="batchUpdateForm.cooperationMethod"
            placeholder="输入合作方式"
            :disabled="!updateFields.cooperationMethod"
            style="width: 200px; margin-left: 10px"
          />
        </div>
      </el-form>

      <template #footer>
        <el-button @click="showBatchUpdateDialog = false">取消</el-button>
        <el-button type="primary" @click="performBatchUpdate" :loading="updating">
          确认更新
        </el-button>
      </template>
    </el-dialog>

    <!-- Batch Import Dialog -->
    <el-dialog
      v-model="showBatchImportDialog"
      title="批量导入"
      width="60%"
    >
      <div class="import-section">
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #default>
            <p>支持导入Excel文件(.xlsx)或CSV文件(.csv)</p>
            <p>请确保文件包含以下列：昵称、期数、费用、粉丝数、小红书主页等</p>
            <el-button type="text" @click="downloadTemplate">下载模板文件</el-button>
          </template>
        </el-alert>

        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :on-change="handleFileChange"
          :before-upload="beforeUpload"
          accept=".xlsx,.csv"
          drag
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              只能上传 xlsx/csv 文件，且不超过 10MB
            </div>
          </template>
        </el-upload>

        <div v-if="importPreview.length > 0" class="import-preview">
          <h4>预览数据 (前5条)</h4>
          <el-table :data="importPreview.slice(0, 5)" border>
            <el-table-column
              v-for="(value, key) in importPreview[0]"
              :key="key"
              :prop="key"
              :label="key"
              show-overflow-tooltip
            />
          </el-table>
          <p class="preview-info">
            共 {{ importPreview.length }} 条数据待导入
          </p>
        </div>
      </div>

      <template #footer>
        <el-button @click="showBatchImportDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="performBatchImport" 
          :loading="importing"
          :disabled="importPreview.length === 0"
        >
          确认导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Download, Upload, Delete, UploadFilled } from '@element-plus/icons-vue'
import { api } from '../utils/api-simple'
import * as XLSX from 'xlsx'

const props = defineProps<{
  selectedIds: string[]
  periodOptions: string[]
}>()

const emit = defineEmits<{
  refresh: []
  clearSelection: []
}>()

const showBatchUpdateDialog = ref(false)
const showBatchImportDialog = ref(false)
const exporting = ref(false)
const deleting = ref(false)
const updating = ref(false)
const importing = ref(false)

const updateFields = reactive({
  period: false,
  hasConnection: false,
  arrivedAtStore: false,
  reviewed: false,
  published: false,
  contactPerson: false,
  cooperationMethod: false
})

const batchUpdateForm = reactive({
  period: '',
  hasConnection: false,
  arrivedAtStore: false,
  reviewed: false,
  published: false,
  contactPerson: '',
  cooperationMethod: ''
})

const importPreview = ref([])
const uploadRef = ref()

const batchExport = async () => {
  exporting.value = true
  try {
    const response = await api.post('/darens/batch', {
      operation: 'export',
      ids: props.selectedIds
    })
    
    const data = response.data.data
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '达人数据')
    
    const fileName = `达人数据_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error(error)
  } finally {
    exporting.value = false
  }
}

const batchDelete = async () => {
  deleting.value = true
  try {
    await api.post('/darens/batch', {
      operation: 'delete',
      ids: props.selectedIds
    })
    
    ElMessage.success('删除成功')
    emit('refresh')
    emit('clearSelection')
  } catch (error) {
    ElMessage.error('删除失败')
    console.error(error)
  } finally {
    deleting.value = false
  }
}

const performBatchUpdate = async () => {
  const updateData = {}
  Object.keys(updateFields).forEach(key => {
    if (updateFields[key]) {
      updateData[key] = batchUpdateForm[key]
    }
  })
  
  if (Object.keys(updateData).length === 0) {
    ElMessage.warning('请至少选择一个要更新的字段')
    return
  }
  
  updating.value = true
  try {
    await api.post('/darens/batch', {
      operation: 'update',
      ids: props.selectedIds,
      data: updateData
    })
    
    ElMessage.success('批量更新成功')
    showBatchUpdateDialog.value = false
    emit('refresh')
    emit('clearSelection')
  } catch (error) {
    ElMessage.error('批量更新失败')
    console.error(error)
  } finally {
    updating.value = false
  }
}

const handleFileChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      importPreview.value = jsonData
      ElMessage.success(`成功解析 ${jsonData.length} 条数据`)
    } catch (error) {
      ElMessage.error('文件解析失败，请检查文件格式')
      console.error(error)
    }
  }
  reader.readAsArrayBuffer(file.raw)
}

const beforeUpload = (file) => {
  const isValidType = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                     file.type === 'text/csv'
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isValidType) {
    ElMessage.error('只能上传 Excel 或 CSV 文件!')
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB!')
  }
  return false // 阻止自动上传
}

const performBatchImport = async () => {
  importing.value = true
  try {
    const promises = importPreview.value.map(item => 
      api.post('/darens', {
        nickname: item['昵称'] || item['nickname'],
        period: item['期数'] || item['period'],
        fee: parseFloat(item['费用'] || item['fee']) || 0,
        followers: item['粉丝数'] || item['followers'],
        homePage: item['小红书主页'] || item['homePage'],
        contactPerson: item['对接人'] || item['contactPerson'],
        xiaohongshuId: item['小红书ID'] || item['xiaohongshuId'],
        ipLocation: item['IP属地'] || item['ipLocation']
      })
    )
    
    await Promise.all(promises)
    ElMessage.success(`成功导入 ${importPreview.value.length} 条数据`)
    showBatchImportDialog.value = false
    importPreview.value = []
    emit('refresh')
  } catch (error) {
    ElMessage.error('导入失败')
    console.error(error)
  } finally {
    importing.value = false
  }
}

const downloadTemplate = () => {
  const template = [
    {
      '昵称': '示例达人',
      '期数': '2024Q1',
      '费用': 5000,
      '粉丝数': '10万',
      '小红书主页': 'https://www.xiaohongshu.com/user/profile/xxx',
      '对接人': '张三',
      '小红书ID': 'example123',
      'IP属地': '上海'
    }
  ]
  
  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '导入模板')
  XLSX.writeFile(wb, '达人导入模板.xlsx')
}
</script>

<style scoped>
.batch-operations {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}

.operation-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.batch-form-item {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.import-section {
  padding: 20px 0;
}

.import-preview {
  margin-top: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.import-preview h4 {
  margin-top: 0;
  color: #303133;
}

.preview-info {
  margin-top: 10px;
  color: #606266;
  font-size: 14px;
}
</style>
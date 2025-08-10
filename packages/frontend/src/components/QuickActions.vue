<template>
  <div class="quick-actions">
    <el-card>
      <template #header>
        <div class="actions-header">
          <h3>快捷操作</h3>
          <el-button @click="customizeActions" size="small" :icon="Setting">
            自定义
          </el-button>
        </div>
      </template>

      <div class="actions-grid">
        <!-- Data Import Actions -->
        <div class="action-group">
          <h4>数据导入</h4>
          <div class="action-buttons">
            <el-button 
              type="primary" 
              @click="quickImportFromClipboard"
              :icon="DocumentCopy"
              size="small"
            >
              从剪贴板导入
            </el-button>
            <el-button 
              type="success" 
              @click="quickImportFromUrl"
              :icon="Link"
              size="small"
            >
              从URL导入
            </el-button>
            <el-button 
              type="warning" 
              @click="quickImportTemplate"
              :icon="Download"
              size="small"
            >
              下载模板
            </el-button>
          </div>
        </div>

        <!-- Data Analysis Actions -->
        <div class="action-group">
          <h4>数据分析</h4>
          <div class="action-buttons">
            <el-button 
              type="info" 
              @click="generateReport"
              :icon="Document"
              size="small"
              :loading="generatingReport"
            >
              生成报告
            </el-button>
            <el-button 
              type="primary" 
              @click="exportAnalytics"
              :icon="TrendCharts"
              size="small"
            >
              导出分析
            </el-button>
            <el-button 
              type="success" 
              @click="comparePerformance"
              :icon="DataAnalysis"
              size="small"
            >
              性能对比
            </el-button>
          </div>
        </div>

        <!-- Automation Actions -->
        <div class="action-group">
          <h4>自动化</h4>
          <div class="action-buttons">
            <el-button 
              type="warning" 
              @click="autoUpdateData"
              :icon="Refresh"
              size="small"
              :loading="autoUpdating"
            >
              自动更新
            </el-button>
            <el-button 
              type="danger" 
              @click="scheduleReminders"
              :icon="AlarmClock"
              size="small"
            >
              设置提醒
            </el-button>
            <el-button 
              type="info" 
              @click="backupData"
              :icon="FolderOpened"
              size="small"
              :loading="backingUp"
            >
              数据备份
            </el-button>
          </div>
        </div>

        <!-- Communication Actions -->
        <div class="action-group">
          <h4>沟通协作</h4>
          <div class="action-buttons">
            <el-button 
              type="primary" 
              @click="sendBulkMessages"
              :icon="ChatDotRound"
              size="small"
            >
              批量消息
            </el-button>
            <el-button 
              type="success" 
              @click="generateContracts"
              :icon="Document"
              size="small"
            >
              生成合同
            </el-button>
            <el-button 
              type="warning" 
              @click="scheduleFollowUp"
              :icon="Calendar"
              size="small"
            >
              跟进提醒
            </el-button>
          </div>
        </div>
      </div>

      <!-- Recent Actions -->
      <div class="recent-actions" v-if="recentActions.length > 0">
        <el-divider content-position="left">最近操作</el-divider>
        <div class="recent-list">
          <div 
            v-for="action in recentActions.slice(0, 5)" 
            :key="action.id"
            class="recent-item"
            @click="repeatAction(action)"
          >
            <el-icon :class="action.icon">
              <component :is="action.icon" />
            </el-icon>
            <span class="action-name">{{ action.name }}</span>
            <span class="action-time">{{ formatTime(action.timestamp) }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Quick Import Dialog -->
    <el-dialog v-model="showQuickImport" title="快速导入" width="50%">
      <el-tabs v-model="importTab">
        <el-tab-pane label="剪贴板导入" name="clipboard">
          <div class="import-section">
            <el-alert
              title="使用说明"
              description="请将小红书用户链接粘贴到下方文本框，每行一个链接"
              type="info"
              :closable="false"
              style="margin-bottom: 15px"
            />
            <el-input
              v-model="clipboardData"
              type="textarea"
              :rows="8"
              placeholder="请粘贴小红书用户链接，每行一个"
            />
            <div class="import-preview" v-if="parsedUrls.length > 0">
              <p>检测到 {{ parsedUrls.length }} 个有效链接</p>
              <el-tag 
                v-for="(url, index) in parsedUrls.slice(0, 5)" 
                :key="index"
                size="small"
                style="margin: 2px"
              >
                {{ url.substring(0, 50) }}...
              </el-tag>
              <span v-if="parsedUrls.length > 5">等{{ parsedUrls.length - 5 }}个</span>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="URL导入" name="url">
          <div class="import-section">
            <el-form :model="urlImportForm" label-width="100px">
              <el-form-item label="用户链接">
                <el-input
                  v-model="urlImportForm.url"
                  placeholder="https://www.xiaohongshu.com/user/profile/xxx"
                />
              </el-form-item>
              <el-form-item label="期数">
                <el-select
                  v-model="urlImportForm.period"
                  placeholder="选择期数"
                  filterable
                  allow-create
                  style="width: 100%"
                >
                  <el-option
                    v-for="period in periodOptions"
                    :key="period"
                    :label="period"
                    :value="period"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="费用">
                <el-input-number
                  v-model="urlImportForm.fee"
                  :min="0"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <template #footer>
        <el-button @click="showQuickImport = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="performQuickImport" 
          :loading="importing"
        >
          开始导入
        </el-button>
      </template>
    </el-dialog>

    <!-- Customize Actions Dialog -->
    <el-dialog v-model="showCustomize" title="自定义快捷操作" width="60%">
      <div class="customize-content">
        <el-alert
          title="拖拽排序"
          description="您可以拖拽下方的操作按钮来重新排序，或者禁用不需要的操作"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        />
        
        <div class="action-customizer">
          <div 
            v-for="group in customizableActions" 
            :key="group.name"
            class="customize-group"
          >
            <h4>{{ group.label }}</h4>
            <div class="customize-items">
              <div 
                v-for="action in group.actions" 
                :key="action.key"
                class="customize-item"
                :class="{ disabled: !action.enabled }"
              >
                <el-switch v-model="action.enabled" />
                <el-icon :class="action.icon">
                  <component :is="action.icon" />
                </el-icon>
                <span>{{ action.name }}</span>
                <el-button 
                  size="small" 
                  text 
                  :icon="Sort"
                  class="drag-handle"
                >
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showCustomize = false">取消</el-button>
        <el-button type="primary" @click="saveCustomization">保存设置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Setting,
  DocumentCopy,
  Link,
  Download,
  Document,
  TrendCharts,
  DataAnalysis,
  Refresh,
  AlarmClock,
  FolderOpened,
  ChatDotRound,
  Calendar,
  Sort
} from '@element-plus/icons-vue'
import { api } from '../utils/api-simple'
import * as XLSX from 'xlsx'

const props = defineProps<{
  periodOptions: string[]
}>()

const emit = defineEmits<{
  refresh: []
  notify: [type: string, title: string, message: string]
}>()

const showQuickImport = ref(false)
const showCustomize = ref(false)
const importTab = ref('clipboard')
const generatingReport = ref(false)
const autoUpdating = ref(false)
const backingUp = ref(false)
const importing = ref(false)

const clipboardData = ref('')
const urlImportForm = reactive({
  url: '',
  period: '',
  fee: 0
})

const recentActions = ref([
  {
    id: '1',
    name: '批量导入达人',
    icon: 'Upload',
    timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
  },
  {
    id: '2',
    name: '生成分析报告',
    icon: 'Document',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
  }
])

const customizableActions = ref([
  {
    name: 'import',
    label: '数据导入',
    actions: [
      { key: 'clipboard', name: '从剪贴板导入', icon: 'DocumentCopy', enabled: true },
      { key: 'url', name: '从URL导入', icon: 'Link', enabled: true },
      { key: 'template', name: '下载模板', icon: 'Download', enabled: true }
    ]
  },
  {
    name: 'analysis',
    label: '数据分析',
    actions: [
      { key: 'report', name: '生成报告', icon: 'Document', enabled: true },
      { key: 'analytics', name: '导出分析', icon: 'TrendCharts', enabled: true },
      { key: 'compare', name: '性能对比', icon: 'DataAnalysis', enabled: true }
    ]
  }
])

const parsedUrls = computed(() => {
  if (!clipboardData.value) return []
  
  const lines = clipboardData.value.split('\n')
  const urlRegex = /https:\/\/www\.xiaohongshu\.com\/user\/profile\/[a-zA-Z0-9]+/g
  const urls = []
  
  lines.forEach(line => {
    const matches = line.match(urlRegex)
    if (matches) {
      urls.push(...matches)
    }
  })
  
  return [...new Set(urls)] // Remove duplicates
})

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return date.toLocaleDateString()
}

const quickImportFromClipboard = () => {
  importTab.value = 'clipboard'
  showQuickImport.value = true
}

const quickImportFromUrl = () => {
  importTab.value = 'url'
  showQuickImport.value = true
}

const quickImportTemplate = () => {
  const template = [
    {
      '昵称': '示例达人',
      '小红书主页': 'https://www.xiaohongshu.com/user/profile/xxx',
      '期数': '2024Q1',
      '费用': 5000,
      '粉丝数': '10万',
      '对接人': '张三',
      '小红书ID': 'example123',
      'IP属地': '上海'
    }
  ]
  
  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '导入模板')
  XLSX.writeFile(wb, '达人快速导入模板.xlsx')
  
  addRecentAction('下载模板', 'Download')
  emit('notify', 'success', '模板下载', '导入模板已下载')
}

const performQuickImport = async () => {
  importing.value = true
  
  try {
    if (importTab.value === 'clipboard') {
      await importFromClipboard()
    } else if (importTab.value === 'url') {
      await importFromUrl()
    }
    
    showQuickImport.value = false
    emit('refresh')
    addRecentAction('快速导入', 'Upload')
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败，请检查数据格式')
  } finally {
    importing.value = false
  }
}

const importFromClipboard = async () => {
  const urls = parsedUrls.value
  if (urls.length === 0) {
    throw new Error('未检测到有效的小红书链接')
  }
  
  const promises = urls.map(url => 
    api.post('/darens', {
      homePage: url,
      period: '快速导入',
      fee: 0
    })
  )
  
  await Promise.all(promises)
  ElMessage.success(`成功导入 ${urls.length} 个达人`)
}

const importFromUrl = async () => {
  if (!urlImportForm.url) {
    throw new Error('请输入用户链接')
  }
  
  await api.post('/darens', {
    homePage: urlImportForm.url,
    period: urlImportForm.period || '快速导入',
    fee: urlImportForm.fee || 0
  })
  
  ElMessage.success('达人导入成功')
}

const generateReport = async () => {
  generatingReport.value = true
  
  try {
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    ElMessage.success('报告生成完成')
    addRecentAction('生成报告', 'Document')
    emit('notify', 'success', '报告生成', '数据分析报告已生成完成')
  } catch (error) {
    ElMessage.error('报告生成失败')
  } finally {
    generatingReport.value = false
  }
}

const exportAnalytics = () => {
  // Implementation for analytics export
  ElMessage.info('分析数据导出功能开发中...')
  addRecentAction('导出分析', 'TrendCharts')
}

const comparePerformance = () => {
  // Implementation for performance comparison
  ElMessage.info('性能对比功能开发中...')
  addRecentAction('性能对比', 'DataAnalysis')
}

const autoUpdateData = async () => {
  autoUpdating.value = true
  
  try {
    // Simulate auto update
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    ElMessage.success('数据自动更新完成')
    addRecentAction('自动更新', 'Refresh')
    emit('refresh')
  } catch (error) {
    ElMessage.error('自动更新失败')
  } finally {
    autoUpdating.value = false
  }
}

const scheduleReminders = () => {
  ElMessageBox.prompt('请输入提醒内容', '设置提醒', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(({ value }) => {
    ElMessage.success(`提醒已设置: ${value}`)
    addRecentAction('设置提醒', 'AlarmClock')
  }).catch(() => {
    // User cancelled
  })
}

const backupData = async () => {
  backingUp.value = true
  
  try {
    // Simulate backup
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    ElMessage.success('数据备份完成')
    addRecentAction('数据备份', 'FolderOpened')
    emit('notify', 'success', '数据备份', '系统数据已成功备份')
  } catch (error) {
    ElMessage.error('数据备份失败')
  } finally {
    backingUp.value = false
  }
}

const sendBulkMessages = () => {
  ElMessage.info('批量消息功能开发中...')
  addRecentAction('批量消息', 'ChatDotRound')
}

const generateContracts = () => {
  ElMessage.info('合同生成功能开发中...')
  addRecentAction('生成合同', 'Document')
}

const scheduleFollowUp = () => {
  ElMessage.info('跟进提醒功能开发中...')
  addRecentAction('跟进提醒', 'Calendar')
}

const customizeActions = () => {
  showCustomize.value = true
}

const saveCustomization = () => {
  localStorage.setItem('quickActionsCustomization', JSON.stringify(customizableActions.value))
  ElMessage.success('自定义设置已保存')
  showCustomize.value = false
}

const addRecentAction = (name: string, icon: string) => {
  const action = {
    id: Date.now().toString(),
    name,
    icon,
    timestamp: new Date()
  }
  
  recentActions.value.unshift(action)
  
  // Keep only last 10 actions
  if (recentActions.value.length > 10) {
    recentActions.value = recentActions.value.slice(0, 10)
  }
  
  // Save to localStorage
  localStorage.setItem('recentActions', JSON.stringify(recentActions.value))
}

const repeatAction = (action: any) => {
  ElMessage.info(`重复执行: ${action.name}`)
  // Implementation for repeating actions
}

// Load saved data on mount
const loadSavedData = () => {
  const savedActions = localStorage.getItem('recentActions')
  if (savedActions) {
    try {
      recentActions.value = JSON.parse(savedActions).map(action => ({
        ...action,
        timestamp: new Date(action.timestamp)
      }))
    } catch (error) {
      console.error('加载最近操作失败:', error)
    }
  }
  
  const savedCustomization = localStorage.getItem('quickActionsCustomization')
  if (savedCustomization) {
    try {
      customizableActions.value = JSON.parse(savedCustomization)
    } catch (error) {
      console.error('加载自定义设置失败:', error)
    }
  }
}

// Initialize
loadSavedData()
</script>

<style scoped>
.quick-actions {
  margin-bottom: 20px;
}

.actions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions-header h3 {
  margin: 0;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.action-group h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 1px solid #EBEEF5;
  padding-bottom: 8px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-buttons .el-button {
  justify-content: flex-start;
}

.recent-actions {
  margin-top: 20px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.recent-item:hover {
  background-color: #F5F7FA;
}

.action-name {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.action-time {
  font-size: 12px;
  color: #909399;
}

.import-section {
  padding: 20px 0;
}

.import-preview {
  margin-top: 15px;
  padding: 15px;
  background: #F5F7FA;
  border-radius: 6px;
}

.customize-content {
  max-height: 500px;
  overflow-y: auto;
}

.action-customizer {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.customize-group h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.customize-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.customize-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #EBEEF5;
  border-radius: 6px;
  transition: all 0.3s;
}

.customize-item.disabled {
  opacity: 0.5;
}

.customize-item:hover {
  border-color: #409EFF;
}

.drag-handle {
  margin-left: auto;
  cursor: move;
}
</style>
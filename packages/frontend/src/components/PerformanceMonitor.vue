<template>
  <div class="performance-monitor">
    <el-card>
      <template #header>
        <div class="monitor-header">
          <h3>系统性能监控</h3>
          <div class="header-actions">
            <el-switch
              v-model="monitoring"
              active-text="监控中"
              inactive-text="已停止"
              @change="toggleMonitoring"
            />
            <el-button @click="clearMetrics" size="small" :icon="Delete">
              清除数据
            </el-button>
          </div>
        </div>
      </template>

      <!-- Performance Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">API响应时间</span>
            <el-tag :type="getResponseTimeType(metrics.avgResponseTime)">
              {{ metrics.avgResponseTime }}ms
            </el-tag>
          </div>
          <div class="metric-chart">
            <div class="mini-chart">
              <div 
                v-for="(time, index) in responseTimeHistory.slice(-20)" 
                :key="index"
                class="chart-bar"
                :style="{ 
                  height: `${Math.min(time / 10, 100)}%`,
                  backgroundColor: getResponseTimeColor(time)
                }"
              ></div>
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">内存使用</span>
            <el-tag :type="getMemoryType(metrics.memoryUsage)">
              {{ metrics.memoryUsage.toFixed(1) }}MB
            </el-tag>
          </div>
          <div class="metric-progress">
            <el-progress 
              :percentage="Math.min(metrics.memoryUsage / 100, 100)" 
              :color="getMemoryColor(metrics.memoryUsage)"
              :show-text="false"
            />
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">错误率</span>
            <el-tag :type="getErrorRateType(metrics.errorRate)">
              {{ metrics.errorRate.toFixed(2) }}%
            </el-tag>
          </div>
          <div class="metric-info">
            <span class="metric-detail">
              成功: {{ metrics.successCount }} | 失败: {{ metrics.errorCount }}
            </span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">活跃用户</span>
            <el-tag type="info">{{ metrics.activeUsers }}</el-tag>
          </div>
          <div class="metric-info">
            <span class="metric-detail">
              在线时长: {{ formatDuration(metrics.sessionDuration) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Detailed Performance Data -->
      <el-tabs v-model="activeTab" class="performance-tabs">
        <el-tab-pane label="API调用统计" name="api">
          <el-table :data="apiStats" size="small">
            <el-table-column prop="endpoint" label="接口" />
            <el-table-column prop="count" label="调用次数" width="100" />
            <el-table-column prop="avgTime" label="平均响应时间" width="120">
              <template #default="scope">
                {{ scope.row.avgTime }}ms
              </template>
            </el-table-column>
            <el-table-column prop="errorRate" label="错误率" width="100">
              <template #default="scope">
                {{ scope.row.errorRate.toFixed(2) }}%
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="scope">
                <el-tag 
                  :type="scope.row.errorRate > 5 ? 'danger' : scope.row.avgTime > 1000 ? 'warning' : 'success'"
                  size="small"
                >
                  {{ scope.row.errorRate > 5 ? '异常' : scope.row.avgTime > 1000 ? '慢' : '正常' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="错误日志" name="errors">
          <div class="error-logs">
            <div 
              v-for="error in errorLogs.slice(-10)" 
              :key="error.id"
              class="error-item"
            >
              <div class="error-header">
                <el-tag type="danger" size="small">{{ error.type }}</el-tag>
                <span class="error-time">{{ formatTime(error.timestamp) }}</span>
              </div>
              <div class="error-message">{{ error.message }}</div>
              <div class="error-stack" v-if="error.stack">
                <el-collapse>
                  <el-collapse-item title="查看详情" name="stack">
                    <pre>{{ error.stack }}</pre>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </div>
            
            <div v-if="errorLogs.length === 0" class="no-errors">
              <el-empty description="暂无错误记录" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="系统信息" name="system">
          <div class="system-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="浏览器">
                {{ systemInfo.browser }}
              </el-descriptions-item>
              <el-descriptions-item label="操作系统">
                {{ systemInfo.os }}
              </el-descriptions-item>
              <el-descriptions-item label="屏幕分辨率">
                {{ systemInfo.screenResolution }}
              </el-descriptions-item>
              <el-descriptions-item label="网络状态">
                <el-tag :type="systemInfo.online ? 'success' : 'danger'">
                  {{ systemInfo.online ? '在线' : '离线' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="页面加载时间">
                {{ systemInfo.pageLoadTime }}ms
              </el-descriptions-item>
              <el-descriptions-item label="DOM节点数">
                {{ systemInfo.domNodes }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- Performance Alerts -->
      <div v-if="alerts.length > 0" class="performance-alerts">
        <el-alert
          v-for="alert in alerts"
          :key="alert.id"
          :title="alert.title"
          :description="alert.message"
          :type="alert.type"
          :closable="true"
          @close="dismissAlert(alert.id)"
          style="margin-bottom: 10px"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Delete } from '@element-plus/icons-vue'

interface PerformanceMetrics {
  avgResponseTime: number
  memoryUsage: number
  errorRate: number
  successCount: number
  errorCount: number
  activeUsers: number
  sessionDuration: number
}

interface ApiStat {
  endpoint: string
  count: number
  avgTime: number
  errorRate: number
}

interface ErrorLog {
  id: string
  type: string
  message: string
  stack?: string
  timestamp: Date
}

interface Alert {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
}

const monitoring = ref(true)
const activeTab = ref('api')

const metrics = reactive<PerformanceMetrics>({
  avgResponseTime: 0,
  memoryUsage: 0,
  errorRate: 0,
  successCount: 0,
  errorCount: 0,
  activeUsers: 1,
  sessionDuration: 0
})

const responseTimeHistory = ref<number[]>([])
const apiStats = ref<ApiStat[]>([])
const errorLogs = ref<ErrorLog[]>([])
const alerts = ref<Alert[]>([])

const systemInfo = reactive({
  browser: '',
  os: '',
  screenResolution: '',
  online: navigator.onLine,
  pageLoadTime: 0,
  domNodes: 0
})

let monitoringInterval: number
let sessionStartTime = Date.now()

const getResponseTimeType = (time: number) => {
  if (time < 200) return 'success'
  if (time < 500) return 'warning'
  return 'danger'
}

const getResponseTimeColor = (time: number) => {
  if (time < 200) return '#67C23A'
  if (time < 500) return '#E6A23C'
  return '#F56C6C'
}

const getMemoryType = (usage: number) => {
  if (usage < 50) return 'success'
  if (usage < 80) return 'warning'
  return 'danger'
}

const getMemoryColor = (usage: number) => {
  if (usage < 50) return '#67C23A'
  if (usage < 80) return '#E6A23C'
  return '#F56C6C'
}

const getErrorRateType = (rate: number) => {
  if (rate < 1) return 'success'
  if (rate < 5) return 'warning'
  return 'danger'
}

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString()
}

const updateMetrics = () => {
  if (!monitoring.value) return
  
  // Update session duration
  metrics.sessionDuration = Date.now() - sessionStartTime
  
  // Update memory usage (estimate)
  if (performance.memory) {
    metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024
  }
  
  // Update DOM nodes count
  systemInfo.domNodes = document.querySelectorAll('*').length
  
  // Check for performance issues
  checkPerformanceAlerts()
}

const recordApiCall = (endpoint: string, responseTime: number, success: boolean) => {
  if (!monitoring.value) return
  
  // Update response time history
  responseTimeHistory.value.push(responseTime)
  if (responseTimeHistory.value.length > 100) {
    responseTimeHistory.value.shift()
  }
  
  // Update overall metrics
  if (success) {
    metrics.successCount++
  } else {
    metrics.errorCount++
  }
  
  const totalCalls = metrics.successCount + metrics.errorCount
  metrics.errorRate = totalCalls > 0 ? (metrics.errorCount / totalCalls) * 100 : 0
  metrics.avgResponseTime = responseTimeHistory.value.reduce((a, b) => a + b, 0) / responseTimeHistory.value.length
  
  // Update API stats
  let apiStat = apiStats.value.find(stat => stat.endpoint === endpoint)
  if (!apiStat) {
    apiStat = { endpoint, count: 0, avgTime: 0, errorRate: 0 }
    apiStats.value.push(apiStat)
  }
  
  apiStat.count++
  apiStat.avgTime = (apiStat.avgTime * (apiStat.count - 1) + responseTime) / apiStat.count
  
  // Update error rate for this endpoint
  const endpointErrors = errorLogs.value.filter(log => log.message.includes(endpoint)).length
  apiStat.errorRate = (endpointErrors / apiStat.count) * 100
}

const recordError = (type: string, message: string, stack?: string) => {
  if (!monitoring.value) return
  
  const error: ErrorLog = {
    id: Date.now().toString(),
    type,
    message,
    stack,
    timestamp: new Date()
  }
  
  errorLogs.value.unshift(error)
  
  // Keep only last 50 errors
  if (errorLogs.value.length > 50) {
    errorLogs.value = errorLogs.value.slice(0, 50)
  }
  
  // Add alert for critical errors
  if (type === 'Error' || type === 'TypeError') {
    addAlert('error', '系统错误', `发生了一个${type}: ${message}`)
  }
}

const checkPerformanceAlerts = () => {
  // Check response time
  if (metrics.avgResponseTime > 1000) {
    addAlert('warning', '响应时间过长', `平均响应时间为${metrics.avgResponseTime}ms，建议优化`)
  }
  
  // Check memory usage
  if (metrics.memoryUsage > 100) {
    addAlert('warning', '内存使用过高', `当前内存使用${metrics.memoryUsage.toFixed(1)}MB`)
  }
  
  // Check error rate
  if (metrics.errorRate > 5) {
    addAlert('error', '错误率过高', `当前错误率为${metrics.errorRate.toFixed(2)}%`)
  }
}

const addAlert = (type: Alert['type'], title: string, message: string) => {
  const existingAlert = alerts.value.find(alert => alert.title === title)
  if (existingAlert) return // Don't duplicate alerts
  
  const alert: Alert = {
    id: Date.now().toString(),
    type,
    title,
    message
  }
  
  alerts.value.push(alert)
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    dismissAlert(alert.id)
  }, 10000)
}

const dismissAlert = (id: string) => {
  const index = alerts.value.findIndex(alert => alert.id === id)
  if (index > -1) {
    alerts.value.splice(index, 1)
  }
}

const toggleMonitoring = (enabled: boolean) => {
  if (enabled) {
    startMonitoring()
  } else {
    stopMonitoring()
  }
}

const startMonitoring = () => {
  monitoringInterval = setInterval(updateMetrics, 5000) // Update every 5 seconds
}

const stopMonitoring = () => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
  }
}

const clearMetrics = () => {
  Object.assign(metrics, {
    avgResponseTime: 0,
    memoryUsage: 0,
    errorRate: 0,
    successCount: 0,
    errorCount: 0,
    activeUsers: 1,
    sessionDuration: 0
  })
  
  responseTimeHistory.value = []
  apiStats.value = []
  errorLogs.value = []
  alerts.value = []
  
  sessionStartTime = Date.now()
}

const initSystemInfo = () => {
  // Browser detection
  const userAgent = navigator.userAgent
  if (userAgent.includes('Chrome')) {
    systemInfo.browser = 'Chrome'
  } else if (userAgent.includes('Firefox')) {
    systemInfo.browser = 'Firefox'
  } else if (userAgent.includes('Safari')) {
    systemInfo.browser = 'Safari'
  } else if (userAgent.includes('Edge')) {
    systemInfo.browser = 'Edge'
  } else {
    systemInfo.browser = 'Unknown'
  }
  
  // OS detection
  if (userAgent.includes('Windows')) {
    systemInfo.os = 'Windows'
  } else if (userAgent.includes('Mac')) {
    systemInfo.os = 'macOS'
  } else if (userAgent.includes('Linux')) {
    systemInfo.os = 'Linux'
  } else {
    systemInfo.os = 'Unknown'
  }
  
  // Screen resolution
  systemInfo.screenResolution = `${screen.width}x${screen.height}`
  
  // Page load time
  if (performance.timing) {
    systemInfo.pageLoadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
  }
}

// Global error handler
const handleGlobalError = (event: ErrorEvent) => {
  recordError('Error', event.message, event.error?.stack)
}

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  recordError('Promise Rejection', event.reason?.message || 'Unhandled promise rejection')
}

onMounted(() => {
  initSystemInfo()
  startMonitoring()
  
  // Add global error listeners
  window.addEventListener('error', handleGlobalError)
  window.addEventListener('unhandledrejection', handleUnhandledRejection)
  
  // Monitor online status
  window.addEventListener('online', () => {
    systemInfo.online = true
  })
  window.addEventListener('offline', () => {
    systemInfo.online = false
  })
})

onUnmounted(() => {
  stopMonitoring()
  
  // Remove global error listeners
  window.removeEventListener('error', handleGlobalError)
  window.removeEventListener('unhandledrejection', handleUnhandledRejection)
})

// Expose methods for external use
defineExpose({
  recordApiCall,
  recordError,
  addAlert
})
</script>

<style scoped>
.performance-monitor {
  margin-bottom: 20px;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.monitor-header h3 {
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card {
  padding: 20px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  background: #FAFAFA;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.metric-title {
  font-weight: 500;
  color: #303133;
}

.metric-chart {
  height: 60px;
}

.mini-chart {
  display: flex;
  align-items: end;
  height: 100%;
  gap: 2px;
}

.chart-bar {
  flex: 1;
  min-height: 2px;
  border-radius: 1px;
  transition: height 0.3s ease;
}

.metric-progress {
  margin-top: 10px;
}

.metric-info {
  margin-top: 10px;
}

.metric-detail {
  font-size: 12px;
  color: #909399;
}

.performance-tabs {
  margin-top: 20px;
}

.error-logs {
  max-height: 400px;
  overflow-y: auto;
}

.error-item {
  padding: 15px;
  border: 1px solid #EBEEF5;
  border-radius: 6px;
  margin-bottom: 10px;
  background: #FEF0F0;
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.error-time {
  font-size: 12px;
  color: #909399;
}

.error-message {
  color: #F56C6C;
  font-weight: 500;
  margin-bottom: 10px;
}

.error-stack pre {
  font-size: 12px;
  color: #606266;
  background: #F5F7FA;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

.no-errors {
  text-align: center;
  padding: 40px;
}

.system-info {
  margin-top: 20px;
}

.performance-alerts {
  margin-top: 20px;
}
</style>
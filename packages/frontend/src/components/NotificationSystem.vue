<template>
  <div class="notification-system">
    <!-- Notification Bell -->
    <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
      <el-button 
        circle 
        :icon="Bell" 
        @click="showNotifications = !showNotifications"
        :class="{ 'has-notifications': unreadCount > 0 }"
      />
    </el-badge>

    <!-- Notifications Dropdown -->
    <el-drawer
      v-model="showNotifications"
      title="系统通知"
      direction="rtl"
      size="400px"
    >
      <div class="notifications-content">
        <!-- Notification Filters -->
        <div class="notification-filters">
          <el-radio-group v-model="activeFilter" @change="filterNotifications">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="unread">未读</el-radio-button>
            <el-radio-button label="important">重要</el-radio-button>
          </el-radio-group>
          
          <el-button 
            v-if="unreadCount > 0"
            type="text" 
            @click="markAllAsRead"
            class="mark-all-read"
          >
            全部标记为已读
          </el-button>
        </div>

        <!-- Notifications List -->
        <div class="notifications-list">
          <div 
            v-for="notification in filteredNotifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ 
              'unread': !notification.read,
              'important': notification.priority === 'high'
            }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon">
              <el-icon v-if="notification.type === 'success'" color="#67C23A">
                <SuccessFilled />
              </el-icon>
              <el-icon v-else-if="notification.type === 'warning'" color="#E6A23C">
                <WarningFilled />
              </el-icon>
              <el-icon v-else-if="notification.type === 'error'" color="#F56C6C">
                <CircleCloseFilled />
              </el-icon>
              <el-icon v-else color="#409EFF">
                <InfoFilled />
              </el-icon>
            </div>
            
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
            </div>
            
            <div class="notification-actions">
              <el-button 
                v-if="!notification.read"
                size="small" 
                type="text" 
                @click.stop="markAsRead(notification.id)"
              >
                标记已读
              </el-button>
              <el-button 
                size="small" 
                type="text" 
                @click.stop="deleteNotification(notification.id)"
              >
                删除
              </el-button>
            </div>
          </div>
          
          <div v-if="filteredNotifications.length === 0" class="empty-notifications">
            <el-empty description="暂无通知" />
          </div>
        </div>

        <!-- Notification Settings -->
        <div class="notification-settings">
          <el-divider content-position="center">通知设置</el-divider>
          <el-form label-width="120px">
            <el-form-item label="数据更新通知">
              <el-switch v-model="settings.dataUpdate" />
            </el-form-item>
            <el-form-item label="任务提醒">
              <el-switch v-model="settings.taskReminder" />
            </el-form-item>
            <el-form-item label="系统消息">
              <el-switch v-model="settings.systemMessage" />
            </el-form-item>
            <el-form-item label="邮件通知">
              <el-switch v-model="settings.emailNotification" />
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Bell, 
  SuccessFilled, 
  WarningFilled, 
  CircleCloseFilled, 
  InfoFilled 
} from '@element-plus/icons-vue'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  priority: 'low' | 'normal' | 'high'
  read: boolean
  createdAt: Date
  data?: any
}

const showNotifications = ref(false)
const activeFilter = ref('all')
const notifications = ref<Notification[]>([])

const settings = reactive({
  dataUpdate: true,
  taskReminder: true,
  systemMessage: true,
  emailNotification: false
})

const unreadCount = computed(() => 
  notifications.value.filter(n => !n.read).length
)

const filteredNotifications = computed(() => {
  let filtered = notifications.value
  
  switch (activeFilter.value) {
    case 'unread':
      filtered = filtered.filter(n => !n.read)
      break
    case 'important':
      filtered = filtered.filter(n => n.priority === 'high')
      break
  }
  
  return filtered.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return new Date(date).toLocaleDateString()
}

const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
  const newNotification: Notification = {
    ...notification,
    id: Date.now().toString(),
    createdAt: new Date()
  }
  
  notifications.value.unshift(newNotification)
  
  // Auto-remove after 30 days
  setTimeout(() => {
    deleteNotification(newNotification.id)
  }, 30 * 24 * 60 * 60 * 1000)
}

const markAsRead = (id: string) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
    saveNotifications()
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
  saveNotifications()
  ElMessage.success('已标记全部通知为已读')
}

const deleteNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
    saveNotifications()
  }
}

const handleNotificationClick = (notification: Notification) => {
  if (!notification.read) {
    markAsRead(notification.id)
  }
  
  // Handle notification action based on type
  if (notification.data?.action) {
    // Emit event or navigate based on notification data
    console.log('Notification action:', notification.data.action)
  }
}

const filterNotifications = () => {
  // Filter logic is handled by computed property
}

const saveNotifications = () => {
  localStorage.setItem('notifications', JSON.stringify(notifications.value))
  localStorage.setItem('notificationSettings', JSON.stringify(settings))
}

const loadNotifications = () => {
  const saved = localStorage.getItem('notifications')
  if (saved) {
    try {
      notifications.value = JSON.parse(saved).map(n => ({
        ...n,
        createdAt: new Date(n.createdAt)
      }))
    } catch (error) {
      console.error('加载通知失败:', error)
    }
  }
  
  const savedSettings = localStorage.getItem('notificationSettings')
  if (savedSettings) {
    try {
      Object.assign(settings, JSON.parse(savedSettings))
    } catch (error) {
      console.error('加载通知设置失败:', error)
    }
  }
}

// Auto-check for system notifications
const checkSystemNotifications = () => {
  // Check for pending tasks
  const now = new Date()
  const today = now.toDateString()
  
  // Example: Check for overdue tasks
  if (settings.taskReminder) {
    // This would typically come from an API
    // addNotification({
    //   type: 'warning',
    //   title: '任务提醒',
    //   message: '您有3个待处理的达人审稿任务',
    //   priority: 'high',
    //   read: false
    // })
  }
}

// Expose methods for external use
const notify = {
  success: (title: string, message: string, priority: 'low' | 'normal' | 'high' = 'normal') => {
    if (settings.systemMessage) {
      addNotification({ type: 'success', title, message, priority, read: false })
    }
  },
  warning: (title: string, message: string, priority: 'low' | 'normal' | 'high' = 'normal') => {
    if (settings.systemMessage) {
      addNotification({ type: 'warning', title, message, priority, read: false })
    }
  },
  error: (title: string, message: string, priority: 'low' | 'normal' | 'high' = 'high') => {
    if (settings.systemMessage) {
      addNotification({ type: 'error', title, message, priority, read: false })
    }
  },
  info: (title: string, message: string, priority: 'low' | 'normal' | 'high' = 'normal') => {
    if (settings.systemMessage) {
      addNotification({ type: 'info', title, message, priority, read: false })
    }
  }
}

let notificationInterval: number

onMounted(() => {
  loadNotifications()
  checkSystemNotifications()
  
  // Check for notifications every 5 minutes
  notificationInterval = setInterval(checkSystemNotifications, 5 * 60 * 1000)
})

onUnmounted(() => {
  if (notificationInterval) {
    clearInterval(notificationInterval)
  }
  saveNotifications()
})

// Watch settings changes
watch(settings, () => {
  saveNotifications()
}, { deep: true })

defineExpose({
  notify,
  addNotification
})
</script>

<style scoped>
.notification-system {
  position: relative;
}

.notification-badge {
  position: relative;
}

.has-notifications {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(64, 158, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}

.notifications-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.notification-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #EBEEF5;
}

.mark-all-read {
  font-size: 12px;
  padding: 0;
}

.notifications-list {
  flex: 1;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px;
  border-bottom: 1px solid #F5F7FA;
  cursor: pointer;
  transition: background-color 0.3s;
}

.notification-item:hover {
  background-color: #F9FAFC;
}

.notification-item.unread {
  background-color: #F0F9FF;
  border-left: 3px solid #409EFF;
}

.notification-item.important {
  border-left: 3px solid #F56C6C;
}

.notification-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
  margin-bottom: 8px;
  word-break: break-word;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empty-notifications {
  padding: 40px 20px;
  text-align: center;
}

.notification-settings {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #EBEEF5;
}
</style>
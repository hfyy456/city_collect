<template>
  <div class="analytics-dashboard">
    <div class="dashboard-header">
      <h2>数据分析面板</h2>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="refreshAnalytics"
        />
        <el-button @click="refreshAnalytics" :loading="loading" :icon="Refresh">
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- Key Metrics Cards -->
    <div class="metrics-grid">
      <el-card class="metric-card">
        <div class="metric-content">
          <div class="metric-icon">👥</div>
          <div class="metric-info">
            <h3>{{ analytics.totalInfluencers }}</h3>
            <p>总达人数</p>
            <span class="metric-change" :class="analytics.influencerGrowth >= 0 ? 'positive' : 'negative'">
              {{ analytics.influencerGrowth >= 0 ? '+' : '' }}{{ analytics.influencerGrowth }}%
            </span>
          </div>
        </div>
      </el-card>

      <el-card class="metric-card">
        <div class="metric-content">
          <div class="metric-icon">💰</div>
          <div class="metric-info">
            <h3>¥{{ formatNumber(analytics.totalInvestment) }}</h3>
            <p>总投入费用</p>
            <span class="metric-change" :class="analytics.investmentGrowth >= 0 ? 'positive' : 'negative'">
              {{ analytics.investmentGrowth >= 0 ? '+' : '' }}{{ analytics.investmentGrowth }}%
            </span>
          </div>
        </div>
      </el-card>

      <el-card class="metric-card">
        <div class="metric-content">
          <div class="metric-icon">📈</div>
          <div class="metric-info">
            <h3>{{ formatNumber(analytics.totalEngagement) }}</h3>
            <p>总互动量</p>
            <span class="metric-change" :class="analytics.engagementGrowth >= 0 ? 'positive' : 'negative'">
              {{ analytics.engagementGrowth >= 0 ? '+' : '' }}{{ analytics.engagementGrowth }}%
            </span>
          </div>
        </div>
      </el-card>

      <el-card class="metric-card">
        <div class="metric-content">
          <div class="metric-icon">🎯</div>
          <div class="metric-info">
            <h3>{{ analytics.avgROI }}%</h3>
            <p>平均ROI</p>
            <span class="metric-change" :class="analytics.roiGrowth >= 0 ? 'positive' : 'negative'">
              {{ analytics.roiGrowth >= 0 ? '+' : '' }}{{ analytics.roiGrowth }}%
            </span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card title="合作进度分布">
            <div class="chart-container">
              <div class="progress-chart">
                <div 
                  v-for="(item, index) in progressData" 
                  :key="index"
                  class="progress-item"
                >
                  <div class="progress-label">{{ item.label }}</div>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: item.percentage + '%', backgroundColor: item.color }"
                    ></div>
                  </div>
                  <div class="progress-value">{{ item.count }} ({{ item.percentage }}%)</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card title="期数对比">
            <div class="chart-container">
              <div class="period-comparison">
                <div 
                  v-for="period in periodComparison" 
                  :key="period.name"
                  class="period-item"
                >
                  <div class="period-header">
                    <h4>{{ period.name }}</h4>
                    <el-tag :type="period.status === 'active' ? 'success' : 'info'">
                      {{ period.status === 'active' ? '进行中' : '已完成' }}
                    </el-tag>
                  </div>
                  <div class="period-stats">
                    <div class="stat">
                      <span class="stat-label">达人数:</span>
                      <span class="stat-value">{{ period.influencerCount }}</span>
                    </div>
                    <div class="stat">
                      <span class="stat-label">费用:</span>
                      <span class="stat-value">¥{{ formatNumber(period.totalFee) }}</span>
                    </div>
                    <div class="stat">
                      <span class="stat-label">完成率:</span>
                      <span class="stat-value">{{ period.completionRate }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Performance Table -->
    <el-card title="达人表现排行" class="performance-table">
      <el-table :data="topPerformers" stripe>
        <el-table-column prop="nickname" label="达人昵称" width="150" />
        <el-table-column prop="period" label="期数" width="100" />
        <el-table-column prop="totalEngagement" label="总互动量" width="120">
          <template #default="scope">
            {{ formatNumber(scope.row.totalEngagement) }}
          </template>
        </el-table-column>
        <el-table-column prop="engagementRate" label="互动率" width="100">
          <template #default="scope">
            {{ scope.row.engagementRate }}%
          </template>
        </el-table-column>
        <el-table-column prop="roi" label="ROI" width="100">
          <template #default="scope">
            {{ scope.row.roi }}%
          </template>
        </el-table-column>
        <el-table-column prop="fee" label="费用" width="120">
          <template #default="scope">
            ¥{{ formatNumber(scope.row.fee) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.published ? 'success' : 'warning'">
              {{ scope.row.published ? '已发布' : '进行中' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { api } from '../utils/api-simple'

const loading = ref(false)
const dateRange = ref([])

const analytics = reactive({
  totalInfluencers: 0,
  influencerGrowth: 0,
  totalInvestment: 0,
  investmentGrowth: 0,
  totalEngagement: 0,
  engagementGrowth: 0,
  avgROI: 0,
  roiGrowth: 0
})

const progressData = ref([
  { label: '已建联', count: 0, percentage: 0, color: '#67C23A' },
  { label: '已到店', count: 0, percentage: 0, color: '#E6A23C' },
  { label: '已审稿', count: 0, percentage: 0, color: '#409EFF' },
  { label: '已发布', count: 0, percentage: 0, color: '#F56C6C' }
])

const periodComparison = ref([])
const topPerformers = ref([])

const formatNumber = (num: number) => {
  if (!num) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

const refreshAnalytics = async () => {
  loading.value = true
  try {
    const response = await api.get('/analytics', {
      params: {
        startDate: dateRange.value?.[0],
        endDate: dateRange.value?.[1]
      }
    })
    
    const data = response.data
    Object.assign(analytics, data.overview)
    progressData.value = data.progressData
    periodComparison.value = data.periodComparison
    topPerformers.value = data.topPerformers
  } catch (error) {
    console.error('获取分析数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshAnalytics()
})
</script>

<style scoped>
.analytics-dashboard {
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.metric-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.metric-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
}

.metric-info h3 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.metric-info p {
  margin: 5px 0;
  color: #909399;
  font-size: 14px;
}

.metric-change {
  font-size: 12px;
  font-weight: bold;
}

.metric-change.positive {
  color: #67C23A;
}

.metric-change.negative {
  color: #F56C6C;
}

.charts-section {
  margin-bottom: 30px;
}

.chart-container {
  height: 300px;
  padding: 20px;
}

.progress-chart {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.progress-label {
  width: 80px;
  font-weight: bold;
  color: #303133;
}

.progress-bar {
  flex: 1;
  height: 20px;
  background: #f5f7fa;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.progress-value {
  width: 100px;
  text-align: right;
  font-weight: bold;
  color: #606266;
}

.period-comparison {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.period-item {
  padding: 15px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
}

.period-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.period-header h4 {
  margin: 0;
  color: #303133;
}

.period-stats {
  display: flex;
  justify-content: space-between;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-weight: bold;
  color: #303133;
}

.performance-table {
  margin-top: 20px;
}
</style>
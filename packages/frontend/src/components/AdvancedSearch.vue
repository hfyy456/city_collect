<template>
  <div class="advanced-search">
    <el-card>
      <template #header>
        <div class="search-header">
          <h3>高级搜索</h3>
          <div class="header-actions">
            <el-button @click="resetFilters" :icon="Refresh">重置</el-button>
            <el-button @click="saveCurrentSearch" type="primary" :icon="Star">保存搜索</el-button>
          </div>
        </div>
      </template>

      <el-form :model="searchForm" label-width="100px" class="search-form">
        <el-row :gutter="20">
          <!-- 基本信息搜索 -->
          <el-col :span="8">
            <el-form-item label="达人昵称">
              <el-input
                v-model="searchForm.nickname"
                placeholder="支持模糊搜索"
                clearable
                @input="handleSearch"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="期数">
              <el-select
                v-model="searchForm.periods"
                placeholder="选择期数"
                multiple
                clearable
                @change="handleSearch"
              >
                <el-option
                  v-for="period in periodOptions"
                  :key="period"
                  :label="period"
                  :value="period"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="对接人">
              <el-input
                v-model="searchForm.contactPerson"
                placeholder="对接人姓名"
                clearable
                @input="handleSearch"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <!-- 状态筛选 -->
          <el-col :span="6">
            <el-form-item label="建联状态">
              <el-select v-model="searchForm.hasConnection" clearable @change="handleSearch">
                <el-option label="已建联" :value="true" />
                <el-option label="未建联" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="到店状态">
              <el-select v-model="searchForm.arrivedAtStore" clearable @change="handleSearch">
                <el-option label="已到店" :value="true" />
                <el-option label="未到店" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="审稿状态">
              <el-select v-model="searchForm.reviewed" clearable @change="handleSearch">
                <el-option label="已审稿" :value="true" />
                <el-option label="未审稿" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="发布状态">
              <el-select v-model="searchForm.published" clearable @change="handleSearch">
                <el-option label="已发布" :value="true" />
                <el-option label="未发布" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <!-- 数值范围搜索 -->
          <el-col :span="8">
            <el-form-item label="费用范围">
              <div class="range-input">
                <el-input-number
                  v-model="searchForm.feeMin"
                  :min="0"
                  placeholder="最小值"
                  controls-position="right"
                  @change="handleSearch"
                />
                <span class="range-separator">-</span>
                <el-input-number
                  v-model="searchForm.feeMax"
                  :min="0"
                  placeholder="最大值"
                  controls-position="right"
                  @change="handleSearch"
                />
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="点赞范围">
              <div class="range-input">
                <el-input-number
                  v-model="searchForm.likesMin"
                  :min="0"
                  placeholder="最小值"
                  controls-position="right"
                  @change="handleSearch"
                />
                <span class="range-separator">-</span>
                <el-input-number
                  v-model="searchForm.likesMax"
                  :min="0"
                  placeholder="最大值"
                  controls-position="right"
                  @change="handleSearch"
                />
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="创建时间">
              <el-date-picker
                v-model="searchForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="handleSearch"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <!-- 地区和平台 -->
          <el-col :span="8">
            <el-form-item label="IP属地">
              <el-select
                v-model="searchForm.ipLocations"
                placeholder="选择地区"
                multiple
                clearable
                filterable
                @change="handleSearch"
              >
                <el-option
                  v-for="location in ipLocationOptions"
                  :key="location"
                  :label="location"
                  :value="location"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="合作方式">
              <el-input
                v-model="searchForm.cooperationMethod"
                placeholder="合作方式"
                clearable
                @input="handleSearch"
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="排序方式">
              <el-select v-model="searchForm.sortBy" @change="handleSearch">
                <el-option label="创建时间 ↓" value="createdAt_desc" />
                <el-option label="创建时间 ↑" value="createdAt_asc" />
                <el-option label="费用 ↓" value="fee_desc" />
                <el-option label="费用 ↑" value="fee_asc" />
                <el-option label="点赞数 ↓" value="likes_desc" />
                <el-option label="点赞数 ↑" value="likes_asc" />
                <el-option label="昵称 A-Z" value="nickname_asc" />
                <el-option label="昵称 Z-A" value="nickname_desc" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 保存的搜索 -->
      <div v-if="savedSearches.length > 0" class="saved-searches">
        <el-divider content-position="left">保存的搜索</el-divider>
        <div class="saved-search-list">
          <el-tag
            v-for="search in savedSearches"
            :key="search.id"
            class="saved-search-tag"
            closable
            @click="loadSavedSearch(search)"
            @close="deleteSavedSearch(search.id)"
          >
            {{ search.name }}
          </el-tag>
        </div>
      </div>

      <!-- 搜索统计 -->
      <div class="search-stats">
        <el-divider content-position="left">搜索结果统计</el-divider>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">匹配结果:</span>
            <span class="stat-value">{{ searchStats.total }} 条</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总费用:</span>
            <span class="stat-value">¥{{ formatNumber(searchStats.totalFee) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已发布:</span>
            <span class="stat-value">{{ searchStats.publishedCount }} 条</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">完成率:</span>
            <span class="stat-value">{{ searchStats.completionRate }}%</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 保存搜索对话框 -->
    <el-dialog v-model="showSaveDialog" title="保存搜索" width="400px">
      <el-form :model="saveForm" label-width="80px">
        <el-form-item label="搜索名称" required>
          <el-input v-model="saveForm.name" placeholder="输入搜索名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="saveForm.description"
            type="textarea"
            placeholder="可选的描述信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSaveDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmSaveSearch">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Star } from '@element-plus/icons-vue'

const props = defineProps<{
  periodOptions: string[]
  ipLocationOptions: string[]
}>()

const emit = defineEmits<{
  search: [filters: any]
  statsUpdate: [stats: any]
}>()

const searchForm = reactive({
  nickname: '',
  periods: [],
  contactPerson: '',
  hasConnection: null,
  arrivedAtStore: null,
  reviewed: null,
  published: null,
  feeMin: null,
  feeMax: null,
  likesMin: null,
  likesMax: null,
  dateRange: [],
  ipLocations: [],
  cooperationMethod: '',
  sortBy: 'createdAt_desc'
})

const searchStats = reactive({
  total: 0,
  totalFee: 0,
  publishedCount: 0,
  completionRate: 0
})

const savedSearches = ref([])
const showSaveDialog = ref(false)
const saveForm = reactive({
  name: '',
  description: ''
})

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

const handleSearch = () => {
  const filters = { ...searchForm }
  
  // 处理日期范围
  if (filters.dateRange && filters.dateRange.length === 2) {
    filters.startDate = filters.dateRange[0]
    filters.endDate = filters.dateRange[1]
  }
  delete filters.dateRange
  
  emit('search', filters)
}

const resetFilters = () => {
  Object.keys(searchForm).forEach(key => {
    if (Array.isArray(searchForm[key])) {
      searchForm[key] = []
    } else if (typeof searchForm[key] === 'string') {
      searchForm[key] = ''
    } else {
      searchForm[key] = null
    }
  })
  searchForm.sortBy = 'createdAt_desc'
  handleSearch()
}

const saveCurrentSearch = () => {
  showSaveDialog.value = true
}

const confirmSaveSearch = () => {
  if (!saveForm.name.trim()) {
    ElMessage.warning('请输入搜索名称')
    return
  }
  
  const searchData = {
    id: Date.now(),
    name: saveForm.name,
    description: saveForm.description,
    filters: { ...searchForm },
    createdAt: new Date().toISOString()
  }
  
  savedSearches.value.push(searchData)
  localStorage.setItem('savedSearches', JSON.stringify(savedSearches.value))
  
  ElMessage.success('搜索已保存')
  showSaveDialog.value = false
  saveForm.name = ''
  saveForm.description = ''
}

const loadSavedSearch = (search: any) => {
  Object.assign(searchForm, search.filters)
  handleSearch()
  ElMessage.success(`已加载搜索: ${search.name}`)
}

const deleteSavedSearch = (id: number) => {
  const index = savedSearches.value.findIndex(s => s.id === id)
  if (index > -1) {
    savedSearches.value.splice(index, 1)
    localStorage.setItem('savedSearches', JSON.stringify(savedSearches.value))
    ElMessage.success('搜索已删除')
  }
}

// 监听搜索结果更新统计
const updateStats = (results: any[]) => {
  searchStats.total = results.length
  searchStats.totalFee = results.reduce((sum, item) => sum + (item.fee || 0), 0)
  searchStats.publishedCount = results.filter(item => item.published).length
  searchStats.completionRate = searchStats.total > 0 
    ? Math.round((searchStats.publishedCount / searchStats.total) * 100)
    : 0
  
  emit('statsUpdate', { ...searchStats })
}

// 加载保存的搜索
onMounted(() => {
  const saved = localStorage.getItem('savedSearches')
  if (saved) {
    try {
      savedSearches.value = JSON.parse(saved)
    } catch (error) {
      console.error('加载保存的搜索失败:', error)
    }
  }
})

// 暴露方法给父组件
defineExpose({
  updateStats
})
</script>

<style scoped>
.advanced-search {
  margin-bottom: 20px;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-header h3 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-form {
  margin-bottom: 20px;
}

.range-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.range-separator {
  color: #909399;
  font-weight: bold;
}

.saved-searches {
  margin-bottom: 20px;
}

.saved-search-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.saved-search-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.saved-search-tag:hover {
  background-color: #409eff;
  color: white;
}

.search-stats {
  margin-top: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f5f7fa;
  border-radius: 6px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.stat-value {
  font-weight: bold;
  color: #303133;
}
</style>
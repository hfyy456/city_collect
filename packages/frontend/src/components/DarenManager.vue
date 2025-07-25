<template>
  <el-container style="height: 100vh">
    <el-header> </el-header>
    <el-main>
      <!-- Enhanced Toolbar -->
      <div class="enhanced-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" @click="showAddDialog" :icon="Plus">
            添加新达人
          </el-button>
          <el-button type="success" @click="showBatchImport = true" :icon="Upload">
            批量导入
          </el-button>
          <el-button type="warning" @click="exportData" :icon="Download" :loading="exporting">
            导出数据
          </el-button>
        </div>
        
        <div class="toolbar-center">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索昵称、联系人..."
            clearable
            style="width: 250px"
            :prefix-icon="Search"
            @input="handleSearch"
          />
          <el-select
            v-model="periodFilter"
            placeholder="选择期数"
            clearable
            style="width: 150px; margin-left: 10px"
            @change="fetchDarens"
          >
            <el-option
              v-for="period in periodOptions"
              :key="period"
              :label="period"
              :value="period"
            />
          </el-select>
          <el-select
            v-model="statusFilter"
            placeholder="合作状态"
            clearable
            style="width: 150px; margin-left: 10px"
            @change="fetchDarens"
          >
            <el-option label="已建联" value="hasConnection" />
            <el-option label="已到店" value="arrivedAtStore" />
            <el-option label="已审稿" value="reviewed" />
            <el-option label="已发布" value="published" />
          </el-select>
        </div>

        <div class="toolbar-right">
          <!-- 视图模式切换 -->
          <el-radio-group v-model="viewMode" @change="handleViewModeChange" class="view-mode-switch">
            <el-radio-button label="person">
              <el-icon><User /></el-icon>
              看人
            </el-radio-button>
            <el-radio-button label="work">
              <el-icon><Document /></el-icon>
              看作品
            </el-radio-button>
          </el-radio-group>
          
          <el-button type="info" @click="showCookieModal = true" :icon="Setting">
            Cookie管理
          </el-button>
          <el-button @click="showColumnSettings = true" :icon="Grid">
            列设置
          </el-button>
          <el-button @click="refreshData" :icon="Refresh" :loading="loading">
            刷新
          </el-button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats">
        <el-card class="stats-card">
          <div class="stat-item">
            <span class="stat-label">总计</span>
            <span class="stat-value">{{ total }}</span>
          </div>
        </el-card>
        <el-card class="stats-card">
          <div class="stat-item">
            <span class="stat-label">已建联</span>
            <span class="stat-value stat-success">{{ getStatusCount('hasConnection') }}</span>
          </div>
        </el-card>
        <el-card class="stats-card">
          <div class="stat-item">
            <span class="stat-label">已发布</span>
            <span class="stat-value stat-primary">{{ getStatusCount('published') }}</span>
          </div>
        </el-card>
        <el-card class="stats-card">
          <div class="stat-item">
            <span class="stat-label">待跟进</span>
            <span class="stat-value stat-warning">{{ getPendingCount() }}</span>
          </div>
        </el-card>
        <el-card class="stats-card highlight-card">
          <div class="stat-item">
            <span class="stat-label">总费用</span>
            <span class="stat-value stat-price">¥{{ formatNumber(getTotalFee()) }}</span>
          </div>
        </el-card>
      </div>

      <!-- 看人模式 - 表格视图 -->
      <el-table
        v-if="viewMode === 'person'"
        :data="darenList"
        v-loading="loading"
        style="width: 100%"
        border
        stripe
        height="calc(100vh - 140px)"
        :row-key="'_id'"
        :row-class-name="({ row }) => editingId === row._id ? 'edit-row' : ''"
        @sort-change="handleSortChange"
      >
        <!-- 原有的表格列内容 -->
        <!-- Operations Column (Fixed) -->
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="scope">
            <div v-if="editingId === scope.row._id">
              <el-button
                size="small"
                type="success"
                @click="handleSave(scope.row)"
                :loading="saving"
                >保存</el-button
              >
              <el-button size="small" @click="handleCancelEdit">取消</el-button>
            </div>
            <div v-else style="display: flex; gap: 4px; flex-wrap: wrap">
              <el-button size="small" type="primary" plain @click="showDetails(scope.row)" :icon="View">
                详情
              </el-button>
              
              <el-button size="small" @click="handleEdit(scope.row)">
                编辑
              </el-button>

              <el-dropdown trigger="click" size="small">
                <el-button size="small" type="info">
                  更新<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      @click="updateUserProfile(scope.row)"
                      :disabled="!scope.row.homePage"
                    >
                      更新主页数据
                    </el-dropdown-item>
                    <el-dropdown-item
                      @click="updateNoteData(scope.row)"
                      :disabled="!scope.row.mainPublishLink"
                    >
                      更新笔记数据
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>

              <el-popconfirm
                title="确定删除这位达人吗？"
                @confirm="handleDelete(scope.row._id)"
              >
                <template #reference>
                  <el-button size="small" type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>

        <!-- Data Columns -->
        <el-table-column prop="nickname" label="昵称" width="150" fixed>
          <template #default="scope">
            <el-link
              v-if="scope.row.homePage"
              :href="scope.row.homePage"
              target="_blank"
              type="primary"
              :underline="false"
            >
              {{ scope.row.nickname }}
            </el-link>
            <span v-else>{{ scope.row.nickname }}</span>
          </template>
        </el-table-column>

        <!-- Grouped Columns -->
        <el-table-column
          v-for="group in personModeColumns"
          :key="group.label"
          :label="group.label"
        >
          <el-table-column
            v-for="column in group.children"
            :key="column.prop"
            :prop="column.prop"
            :label="column.label"
            :min-width="column.width || 150"
          >
            <template #default="scope">
              <TableColumnRenderer 
                :column="column" 
                :row="scope.row" 
                :is-editing="editingId === scope.row._id" 
                v-model="editForm"
              />
            </template>
          </el-table-column>
        </el-table-column>
      </el-table>

      <!-- 看作品模式 - 卡片视图 -->
      <div v-else-if="viewMode === 'work'" class="work-mode-container">
        <div class="work-grid" v-loading="loading">
          <div 
            v-for="daren in darenList" 
            :key="daren._id"
            class="work-card"
            @click="showWorkDetails(daren)"
          >
            <!-- 作品卡片头部 -->
            <div class="work-card-header">
              <div class="work-info">
                <h3 class="work-title">{{ daren.nickname }}的作品</h3>
                <div class="work-meta">
                  <el-tag size="small" type="info">{{ daren.period || '未设置期数' }}</el-tag>
                  <el-tag 
                    v-if="daren.published" 
                    size="small" 
                    type="success"
                  >
                    已发布
                  </el-tag>
                  <el-tag 
                    v-else-if="daren.reviewed" 
                    size="small" 
                    type="warning"
                  >
                    已审稿
                  </el-tag>
                </div>
              </div>
              <div class="work-actions">
                <el-button 
                  v-if="daren.mainPublishLink"
                  size="small" 
                  type="primary" 
                  link
                  @click.stop="openLink(daren.mainPublishLink)"
                >
                  查看作品
                </el-button>
              </div>
            </div>

            <!-- 作品数据指标 -->
            <div class="work-metrics">
              <div class="metric-item">
                <div class="metric-icon">❤️</div>
                <div class="metric-info">
                  <span class="metric-value">{{ formatNumber(daren.likes) }}</span>
                  <span class="metric-label">点赞</span>
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-icon">⭐</div>
                <div class="metric-info">
                  <span class="metric-value">{{ formatNumber(daren.collections) }}</span>
                  <span class="metric-label">收藏</span>
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-icon">💬</div>
                <div class="metric-info">
                  <span class="metric-value">{{ formatNumber(daren.comments) }}</span>
                  <span class="metric-label">评论</span>
                </div>
              </div>
            </div>

            <!-- 作品链接 -->
            <div class="work-links" v-if="daren.mainPublishLink || daren.syncPublishLink">
              <div v-if="daren.mainPublishLink" class="link-item">
                <el-icon><Link /></el-icon>
                <span class="link-text">主发布链接</span>
                <el-button 
                  size="small" 
                  text 
                  @click.stop="copyLink(daren.mainPublishLink)"
                >
                  复制
                </el-button>
              </div>
              <div v-if="daren.syncPublishLink" class="link-item">
                <el-icon><Link /></el-icon>
                <span class="link-text">同步链接</span>
                <el-button 
                  size="small" 
                  text 
                  @click.stop="copyLink(daren.syncPublishLink)"
                >
                  复制
                </el-button>
              </div>
            </div>

            <!-- 作品状态进度条 -->
            <div class="work-progress">
              <div class="progress-steps">
                <div class="step" :class="{ active: daren.hasConnection }">
                  <div class="step-icon">📞</div>
                  <span class="step-label">已建联</span>
                </div>
                <div class="step" :class="{ active: daren.arrivedAtStore }">
                  <div class="step-icon">🏪</div>
                  <span class="step-label">已到店</span>
                </div>
                <div class="step" :class="{ active: daren.reviewed }">
                  <div class="step-icon">📝</div>
                  <span class="step-label">已审稿</span>
                </div>
                <div class="step" :class="{ active: daren.published }">
                  <div class="step-icon">🚀</div>
                  <span class="step-label">已发布</span>
                </div>
              </div>
            </div>

            <!-- 费用信息 -->
            <div class="work-footer">
              <div class="fee-info">
                <span class="fee-label">合作费用：</span>
                <span class="fee-value">¥{{ formatNumber(daren.fee) }}</span>
              </div>
              <div class="work-card-actions">
                <el-button size="small" @click.stop="showDetails(daren)">详情</el-button>
                <el-button size="small" type="primary" @click.stop="handleEdit(daren)">编辑</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-container">
        <div class="pagination-info">
          <span class="total-info">
            共 {{ total }} 条记录，第 {{ currentPage }} / {{ Math.ceil(total / pageSize) }} 页
          </span>
          <el-select 
            v-model="pageSize" 
            @change="handleSizeChange"
            style="width: 120px; margin-left: 10px"
          >
            <el-option label="10 条/页" :value="10" />
            <el-option label="20 条/页" :value="20" />
            <el-option label="50 条/页" :value="50" />
            <el-option label="100 条/页" :value="100" />
          </el-select>
        </div>
        
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="pagination-component"
        />
      </div>

      <!-- Add Daren Dialog -->
      <el-dialog
        v-model="addDialogVisible"
        title="添加新达人"
        width="60%"
        @close="resetAddForm"
      >
        <el-form
          :model="addForm"
          ref="addFormRef"
          :rules="rules"
          label-width="120px"
        >
          <el-alert
            type="info"
            :closable="false"
            style="margin-bottom: 15px"
          >
            <template #title>
              <div class="cookie-info">
                <span>系统将自动使用已保存的Cookie解析数据</span>
                <el-button 
                  type="primary" 
                  link 
                  @click="showCookieModal = true"
                  style="padding: 0 0 0 10px"
                >
                  管理Cookie
                </el-button>
              </div>
            </template>
          </el-alert>
          <el-form-item label="小红书主页" prop="homePage">
            <el-input
              v-model="addForm.homePage"
              placeholder="粘贴小红书用户主页链接，格式如：https://www.xiaohongshu.com/user/profile/xxx"
              style="width: 100%"
              @input="handleHomePageInput"
              @focus="showUrlFormatTip = true"
              @blur="showUrlFormatTip = false"
            ></el-input>
            <el-tooltip v-if="showUrlFormatTip" effect="light" placement="top-start">
              <template #content>
                格式示例: https://www.xiaohongshu.com/user/profile/xxx
              </template>
              <div class="url-format-tip">请输入正确格式的用户主页链接</div>
            </el-tooltip>
          </el-form-item>

          <el-divider content-position="left">基本信息</el-divider>

          <el-row :gutter="20">
            <el-col :span="12" style="margin-bottom: 16px"
              ><el-form-item label="达人昵称" prop="nickname"
                ><el-input v-model="addForm.nickname"></el-input></el-form-item
            ></el-col>
            <el-col :span="12"
              ><el-form-item label="小红书ID" prop="xiaohongshuId"
                ><el-input
                  v-model="addForm.xiaohongshuId"
                ></el-input></el-form-item
            ></el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="期数" prop="period">
                <el-select
                  v-model="addForm.period"
                  placeholder="选择或输入期数"
                  filterable
                  allow-create
                  default-first-option
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in periodOptions"
                    :key="item"
                    :label="item"
                    :value="item"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="费用" prop="fee">
                <el-input-number
                  v-model="addForm.fee"
                  :min="0"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12"
              ><el-form-item label="粉丝数" prop="followers"
                ><el-input v-model="addForm.followers"></el-input></el-form-item
            ></el-col>
            <el-col :span="12"
              ><el-form-item label="获赞与收藏" prop="likesAndCollections"
                ><el-input
                  v-model="addForm.likesAndCollections"
                ></el-input></el-form-item
            ></el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12"
              ><el-form-item label="IP属地" prop="ipLocation"
                ><el-input
                  v-model="addForm.ipLocation"
                ></el-input></el-form-item
            ></el-col>
          </el-row>

          <el-divider content-position="left">发布链接</el-divider>

          <el-form-item label="主发布链接" prop="mainPublishLink">
            <el-input
              v-model="addForm.mainPublishLink"
              placeholder="粘贴小红书笔记链接，系统将自动解析数据指标"
              @blur="handleMainPublishLinkChange"
            ></el-input>
          </el-form-item>

          <el-form-item label="同步链接" prop="syncPublishLink">
            <el-input
              v-model="addForm.syncPublishLink"
              placeholder="同步发布链接"
            ></el-input>
          </el-form-item>

          <el-divider content-position="left">数据指标</el-divider>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="点赞数" prop="likes">
                <el-input
                  v-model="addForm.likes"
                  placeholder="如: 1.2k, 10万+"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="收藏数" prop="collections">
                <el-input
                  v-model="addForm.collections"
                  placeholder="如: 1.2k, 10万+"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="评论数" prop="comments">
                <el-input
                  v-model="addForm.comments"
                  placeholder="如: 1.2k, 10万+"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="addDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleAddNew" :loading="submitting">提交</el-button>
          </span>
        </template>
      </el-dialog>

    <!-- Cookie Management Modal -->
    <el-dialog
      v-model="showCookieModal"
      title="小红书Cookie管理"
      width="60%"
    >
      <el-form size="large">
        <div class="cookie-status">
          <el-tag :type="cookie ? 'success' : 'danger'" effect="dark">
            {{ cookie ? 'Cookie已设置' : 'Cookie未设置' }}
          </el-tag>
          <span class="cookie-status-text">
            {{ cookie ? '系统将使用已保存的Cookie解析数据' : '请设置Cookie以获取完整数据' }}
          </span>
        </div>
        
        <el-form-item label="当前Cookie" style="margin-bottom: 20px">
          <el-input
            v-model="cookie"
            type="textarea"
            :rows="6"
            placeholder="请输入小红书Cookie"
          ></el-input>
        </el-form-item>
        
        <el-alert
          title="注意"
          type="info"
          description="Cookie用于获取小红书用户数据和笔记信息，有效期通常为7-30天。当解析功能失败时，请更新Cookie。"
          show-icon
        ></el-alert>
        
        <el-divider content-position="center">如何获取Cookie</el-divider>
        
        <ol class="cookie-instructions">
          <li>在浏览器中登录小红书网页版</li>
          <li>打开开发者工具（按F12或右键点击"检查"）</li>
          <li>切换到"网络"或"Network"标签</li>
          <li>刷新页面，找到任意一个请求</li>
          <li>在请求头中找到"Cookie"字段并复制其值</li>
        </ol>
      </el-form>
      <template #footer>
        <el-button @click="showCookieModal = false">取消</el-button>
        <el-button type="primary" @click="saveCookie">保存</el-button>
        <el-button type="danger" @click="clearCookieAndClose">清除Cookie</el-button>
      </template>
    </el-dialog>
    
    <!-- Column Settings Dialog -->
    <el-dialog
      v-model="showColumnSettings"
      title="列设置"
      width="50%"
    >
      <div class="column-settings">
        <p class="settings-description">选择要显示的列</p>
        <el-divider />
        
        <div v-for="group in columnGroups" :key="group.label" class="column-group">
          <h3 class="group-title">{{ group.label }}</h3>
          <div class="column-checkboxes">
            <el-checkbox 
              v-for="column in group.children" 
              :key="column.prop"
              v-model="visibleColumns[column.prop]"
              :label="column.label"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showColumnSettings = false">取消</el-button>
        <el-button type="primary" @click="applyColumnSettings">应用</el-button>
        <el-button @click="resetColumnSettings">重置为默认</el-button>
      </template>
    </el-dialog>
    
    <!-- Daren Details Dialog -->
    <el-dialog
      v-model="showDetailsDialog"
      :title="`达人详情: ${currentDaren?.nickname || ''}`"
      width="70%"
      class="details-dialog"
      top="5vh"
    >
      <div v-if="currentDaren" class="daren-details">
        <!-- 基本信息卡片 -->
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <h3>基本信息</h3>
              <el-switch
                v-if="isDetailEditing"
                v-model="isDetailEditing"
                active-text="编辑模式"
                inactive-text="查看模式"
                style="display: none;"
              />
            </div>
          </template>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">昵称</span>
              <template v-if="isDetailEditing">
                <el-input v-model="detailEditForm.nickname" size="small" />
              </template>
              <span v-else class="detail-value">{{ currentDaren.nickname }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">平台</span>
              <template v-if="isDetailEditing">
                <el-input v-model="detailEditForm.platform" size="small" placeholder="小红书" />
              </template>
              <span v-else class="detail-value">{{ currentDaren.platform || '小红书' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">期数</span>
              <template v-if="isDetailEditing">
                <el-select
                  v-model="detailEditForm.period"
                  placeholder="选择或输入期数"
                  filterable
                  allow-create
                  default-first-option
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in periodOptions"
                    :key="item"
                    :label="item"
                    :value="item"
                  />
                </el-select>
              </template>
              <span v-else class="detail-value">{{ currentDaren.period || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">费用</span>
              <template v-if="isDetailEditing">
                <el-input-number
                  v-model="detailEditForm.fee"
                  :min="0"
                  controls-position="right"
                  size="small"
                  style="width: 100%"
                />
              </template>
              <span v-else class="detail-value">¥{{ formatNumber(currentDaren.fee) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">粉丝数</span>
              <template v-if="isDetailEditing">
                <el-input v-model="detailEditForm.followers" size="small" />
              </template>
              <span v-else class="detail-value">{{ currentDaren.followers || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">小红书ID</span>
              <template v-if="isDetailEditing">
                <el-input v-model="detailEditForm.xiaohongshuId" size="small" />
              </template>
              <span v-else class="detail-value">{{ currentDaren.xiaohongshuId || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">IP属地</span>
              <template v-if="isDetailEditing">
                <el-input v-model="detailEditForm.ipLocation" size="small" />
              </template>
              <span v-else class="detail-value">{{ currentDaren.ipLocation || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">获赞与收藏</span>
              <template v-if="isDetailEditing">
                <el-input v-model="detailEditForm.likesAndCollections" size="small" />
              </template>
              <span v-else class="detail-value">{{ currentDaren.likesAndCollections || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">账号类型</span>
              <template v-if="isDetailEditing">
                <el-input v-model="detailEditForm.accountType" size="small" />
              </template>
              <span v-else class="detail-value">{{ currentDaren.accountType || '-' }}</span>
            </div>
          </div>
        </el-card>

        <!-- 联系与进度卡片 -->
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <h3>联系与进度</h3>
            </div>
          </template>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">对接人</span>
              <template v-if="isDetailEditing">
                <el-input v-model="detailEditForm.contactPerson" size="small" />
              </template>
              <span v-else class="detail-value">{{ currentDaren.contactPerson || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">联系方式</span>
              <template v-if="isDetailEditing">
                <el-input v-model="detailEditForm.contactInfo" size="small" />
              </template>
              <span v-else class="detail-value">{{ currentDaren.contactInfo || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">已建联</span>
              <template v-if="isDetailEditing">
                <el-switch v-model="detailEditForm.hasConnection" />
              </template>
              <el-tag v-else :type="currentDaren.hasConnection ? 'success' : 'info'">
                {{ currentDaren.hasConnection ? '是' : '否' }}
              </el-tag>
            </div>
            <div class="detail-item">
              <span class="detail-label">在群</span>
              <template v-if="isDetailEditing">
                <el-switch v-model="detailEditForm.inGroup" />
              </template>
              <el-tag v-else :type="currentDaren.inGroup ? 'success' : 'info'">
                {{ currentDaren.inGroup ? '是' : '否' }}
              </el-tag>
            </div>
            <div class="detail-item">
              <span class="detail-label">到店时间</span>
              <template v-if="isDetailEditing">
                <el-date-picker
                  v-model="detailEditForm.storeArrivalTime"
                  type="date"
                  placeholder="选择日期"
                  size="small"
                  style="width: 100%"
                />
              </template>
              <span v-else class="detail-value">{{ currentDaren.storeArrivalTime ? formatDate(currentDaren.storeArrivalTime) : '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">已到店</span>
              <template v-if="isDetailEditing">
                <el-switch v-model="detailEditForm.arrivedAtStore" />
              </template>
              <el-tag v-else :type="currentDaren.arrivedAtStore ? 'success' : 'info'">
                {{ currentDaren.arrivedAtStore ? '是' : '否' }}
              </el-tag>
            </div>
            <div class="detail-item">
              <span class="detail-label">已审稿</span>
              <template v-if="isDetailEditing">
                <el-switch v-model="detailEditForm.reviewed" />
              </template>
              <el-tag v-else :type="currentDaren.reviewed ? 'success' : 'info'">
                {{ currentDaren.reviewed ? '是' : '否' }}
              </el-tag>
            </div>
            <div class="detail-item">
              <span class="detail-label">已发布</span>
              <template v-if="isDetailEditing">
                <el-switch v-model="detailEditForm.published" />
              </template>
              <el-tag v-else :type="currentDaren.published ? 'success' : 'info'">
                {{ currentDaren.published ? '是' : '否' }}
              </el-tag>
            </div>
          </div>
        </el-card>

        <!-- 平台链接卡片 -->
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <h3>平台链接</h3>
            </div>
          </template>
          <div v-if="isDetailEditing" class="detail-links-edit">
            <div class="detail-link-edit-item">
              <span class="detail-label">小红书主页</span>
              <el-input v-model="detailEditForm.homePage" size="small" placeholder="小红书主页链接" />
            </div>
            <div class="detail-link-edit-item">
              <span class="detail-label">抖音主页</span>
              <el-input v-model="detailEditForm.douyinLink" size="small" placeholder="抖音主页链接" />
            </div>
            <div class="detail-link-edit-item">
              <span class="detail-label">大众点评</span>
              <el-input v-model="detailEditForm.dianping" size="small" placeholder="大众点评链接" />
            </div>
            <div class="detail-link-edit-item">
              <span class="detail-label">主发布链接</span>
              <el-input v-model="detailEditForm.mainPublishLink" size="small" placeholder="主发布链接" />
            </div>
            <div class="detail-link-edit-item">
              <span class="detail-label">同步链接</span>
              <el-input v-model="detailEditForm.syncPublishLink" size="small" placeholder="同步链接" />
            </div>
          </div>
          <div v-else class="detail-links">
            <div class="detail-link-item" v-if="currentDaren.homePage">
              <div class="link-label">
                <el-icon><Link /></el-icon>
                <span>小红书主页</span>
              </div>
              <el-link :href="currentDaren.homePage" target="_blank" type="primary">
                {{ currentDaren.homePage }}
              </el-link>
            </div>
            <div class="detail-link-item" v-if="currentDaren.douyinLink">
              <div class="link-label">
                <el-icon><Link /></el-icon>
                <span>抖音主页</span>
              </div>
              <el-link :href="currentDaren.douyinLink" target="_blank" type="primary">
                {{ currentDaren.douyinLink }}
              </el-link>
            </div>
            <div class="detail-link-item" v-if="currentDaren.dianping">
              <div class="link-label">
                <el-icon><Link /></el-icon>
                <span>大众点评</span>
              </div>
              <el-link :href="currentDaren.dianping" target="_blank" type="primary">
                {{ currentDaren.dianping }}
              </el-link>
            </div>
            <div class="detail-link-item" v-if="currentDaren.mainPublishLink">
              <div class="link-label">
                <el-icon><Link /></el-icon>
                <span>主发布链接</span>
              </div>
              <el-link :href="currentDaren.mainPublishLink" target="_blank" type="primary">
                {{ currentDaren.mainPublishLink }}
              </el-link>
            </div>
            <div class="detail-link-item" v-if="currentDaren.syncPublishLink">
              <div class="link-label">
                <el-icon><Link /></el-icon>
                <span>同步链接</span>
              </div>
              <el-link :href="currentDaren.syncPublishLink" target="_blank" type="primary">
                {{ currentDaren.syncPublishLink }}
              </el-link>
            </div>
            <div class="no-links" v-if="!hasAnyLinks">
              <el-empty description="暂无链接" />
            </div>
          </div>
        </el-card>

        <!-- 数据指标卡片 -->
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <h3>数据指标</h3>
            </div>
          </template>
          <div v-if="isDetailEditing" class="metrics-grid-edit">
            <div class="metric-edit-item">
              <span class="detail-label">点赞</span>
              <el-input v-model="detailEditForm.likes" size="small" placeholder="如: 1.2k, 10万+" />
            </div>
            <div class="metric-edit-item">
              <span class="detail-label">收藏</span>
              <el-input v-model="detailEditForm.collections" size="small" placeholder="如: 1.2k, 10万+" />
            </div>
            <div class="metric-edit-item">
              <span class="detail-label">评论</span>
              <el-input v-model="detailEditForm.comments" size="small" placeholder="如: 1.2k, 10万+" />
            </div>
            <div class="metric-edit-item">
              <span class="detail-label">曝光</span>
              <el-input v-model="detailEditForm.exposure" size="small" placeholder="如: 1.2k, 10万+" />
            </div>
            <div class="metric-edit-item">
              <span class="detail-label">阅读</span>
              <el-input v-model="detailEditForm.reads" size="small" placeholder="如: 1.2k, 10万+" />
            </div>
            <div class="metric-edit-item">
              <span class="detail-label">转发</span>
              <el-input v-model="detailEditForm.forwards" size="small" placeholder="如: 1.2k, 10万+" />
            </div>
          </div>
          <div v-else class="metrics-grid">
            <div class="metric-item">
              <div class="metric-value">{{ formatNumber(currentDaren.likes) }}</div>
              <div class="metric-label">点赞</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">{{ formatNumber(currentDaren.collections) }}</div>
              <div class="metric-label">收藏</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">{{ formatNumber(currentDaren.comments) }}</div>
              <div class="metric-label">评论</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">{{ formatNumber(currentDaren.exposure) }}</div>
              <div class="metric-label">曝光</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">{{ formatNumber(currentDaren.reads) }}</div>
              <div class="metric-label">阅读</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">{{ formatNumber(currentDaren.forwards) }}</div>
              <div class="metric-label">转发</div>
            </div>
          </div>
        </el-card>

        <!-- 其他信息卡片 -->
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <h3>其他信息</h3>
            </div>
          </template>
          <div class="detail-grid">
            <div class="detail-item full-width">
              <span class="detail-label">合作方式</span>
              <template v-if="isDetailEditing">
                <el-input v-model="detailEditForm.cooperationMethod" size="small" />
              </template>
              <span v-else class="detail-value">{{ currentDaren.cooperationMethod || '-' }}</span>
            </div>
            <div class="detail-item full-width">
              <span class="detail-label">备注</span>
              <template v-if="isDetailEditing">
                <el-input 
                  v-model="detailEditForm.remarks" 
                  type="textarea" 
                  :rows="3"
                  size="small" 
                />
              </template>
              <div v-else class="remarks-content">{{ currentDaren.remarks || '无备注' }}</div>
            </div>
            <div class="detail-item full-width">
              <span class="detail-label">创建时间</span>
              <span class="detail-value">{{ currentDaren.createdAt ? formatDateTime(currentDaren.createdAt) : '-' }}</span>
            </div>
            <div class="detail-item full-width">
              <span class="detail-label">更新时间</span>
              <span class="detail-value">{{ currentDaren.updatedAt ? formatDateTime(currentDaren.updatedAt) : '-' }}</span>
            </div>
          </div>
        </el-card>
      </div>
      <template #footer>
        <div class="details-footer">
          <el-button @click="cancelDetailEdit">取消</el-button>
          <el-button type="primary" @click="saveDetailEdit" :loading="detailSaving">保存</el-button>
          <el-button 
            type="success" 
            @click="updateUserProfile(currentDaren)" 
            :disabled="!currentDaren?.homePage"
          >
            更新主页数据
          </el-button>
          <el-button 
            type="warning" 
            @click="updateNoteData(currentDaren)" 
            :disabled="!currentDaren?.mainPublishLink"
          >
            更新笔记数据
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Batch Import Dialog -->
    <el-dialog
      v-model="showBatchImport"
      title="批量导入达人"
      width="60%"
    >
      <el-form>
        <el-form-item label="导入格式">
          <el-radio-group v-model="importFormat">
            <el-radio label="csv">CSV文件</el-radio>
            <el-radio label="excel">Excel文件</el-radio>
            <el-radio label="json">JSON格式</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="上传文件">
          <el-upload
            action="#"
            :auto-upload="false"
            :on-change="handleImportFileChange"
            :limit="1"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                请上传符合格式要求的文件，支持.csv, .xlsx, .json格式
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleBatchImport" :loading="importing">开始导入</el-button>
          <el-button @click="showBatchImport = false">取消</el-button>
        </el-form-item>
        
        <el-divider />
        
        <el-alert
          title="导入说明"
          type="info"
          description="CSV/Excel文件的列名应与系统字段名一致。JSON格式应为对象数组，每个对象代表一位达人。"
          show-icon
          :closable="false"
        />
        
        <div class="template-download">
          <p>下载导入模板：</p>
          <el-button size="small" @click="downloadTemplate('csv')">CSV模板</el-button>
          <el-button size="small" @click="downloadTemplate('excel')">Excel模板</el-button>
          <el-button size="small" @click="downloadTemplate('json')">JSON模板</el-button>
        </div>
      </el-form>
    </el-dialog>

  </el-main>
</el-container>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch, computed } from 'vue';
import axios from 'axios';

import { ElMessage, ElMessageBox } from "element-plus";
import { getCookie, setCookie } from '@/utils/cookieManager';
import { 
  ArrowDown, 
  Plus, 
  Upload, 
  Download, 
  Search, 
  Setting, 
  Grid, 
  Refresh,
  View,
  Link,
  User,
  Document
} from "@element-plus/icons-vue";
import TableColumnRenderer from './TableColumnRenderer.vue';

import type { FormInstance, FormRules } from "element-plus";

// Refs for table and dialogs
const loading = ref(true);
const exporting = ref(false);
const searchKeyword = ref("");
const statusFilter = ref("");
const showBatchImport = ref(false);
const showColumnSettings = ref(false);
const visibleColumns = ref<Record<string, boolean>>({});
const showDetailsDialog = ref(false);
const currentDaren = ref<any>(null);
const isDetailEditing = ref(false);
const detailEditForm = ref<any>({});
const detailSaving = ref(false);
const viewMode = ref('person'); // 'person' 或 'work'

// 为不同视图模式定义不同的列配置
const personModeColumns = computed(() => columnGroups);

// 视图模式切换处理函数
const handleViewModeChange = (mode: string) => {
  console.log('切换视图模式:', mode);
  // 可以在这里添加视图切换时的特殊逻辑
};

// 作品详情显示函数
const showWorkDetails = (daren: any) => {
  showDetails(daren);
};

// 打开链接函数
const openLink = (url: string) => {
  window.open(url, '_blank');
};

// 复制链接函数
const copyLink = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
    ElMessage.success('链接已复制到剪贴板');
  } catch (err) {
    ElMessage.error('复制失败，请手动复制');
  }
};

const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const darenList = ref<any[]>([]);
const addDialogVisible = ref(false);
const parsing = ref(false);
const periodFilter = ref("");
const periodOptions = ref<string[]>([]);

// Refs for in-table editing
const editingId = ref<string | null>(null);
  const editForm = ref<any>({});
  const saving = ref(false);
  const submitting = ref(false);
  const showCookieModal = ref(false);

// Refs for adding new daren
const addFormRef = ref<FormInstance>();
const cookie = ref(getCookie());

  // Table column definitions with grouping
// 添加排序功能的列定义
const columnGroups = [
  { label: '基本信息', children: [
    { prop: 'platform', label: '平台', width: 100, sortable: true },
    { prop: 'period', label: '期数', width: 100, sortable: true },
    { prop: 'fee', label: '费用', type: 'number', width: 120, sortable: true, formatter: (row: any) => `¥${formatNumber(row.fee)}` },
    { prop: 'followers', label: '粉丝数', width: 120, sortable: true },
    { prop: 'xiaohongshuId', label: '小红书ID', width: 150 },
    { prop: 'ipLocation', label: 'IP属地', width: 120 },
    { prop: 'likesAndCollections', label: '获赞与收藏', width: 120, sortable: true },
    { prop: 'accountType', label: '账号类型', width: 120 }
  ]},
  {
    label: "基本信息",
    children: [
      { prop: "platform", label: "平台", width: 100 },
      { prop: "period", label: "期数", width: 100 },
      { prop: "fee", label: "费用", type: "number", width: 120 },
      { prop: "followers", label: "粉丝数", width: 120 },
      { prop: "xiaohongshuId", label: "小红书ID", width: 150 },
      { prop: "ipLocation", label: "IP属地", width: 120 },
      { prop: "likesAndCollections", label: "获赞与收藏", width: 120 },
      { prop: "accountType", label: "账号类型", width: 120 },
    ],
  },
  {
    label: "联系与进度",
    children: [
      { prop: "contactPerson", label: "对接人", width: 120 },
      { prop: "contactInfo", label: "联系方式", width: 150 },
      { prop: "hasConnection", label: "已建联", type: "switch", width: 90 },
      { prop: "inGroup", label: "在群", type: "switch", width: 90 },
      { prop: "storeArrivalTime", label: "到店时间", type: "date", width: 120 },
      { prop: "arrivedAtStore", label: "已到店", type: "switch", width: 90 },
      { prop: "reviewed", label: "已审稿", type: "switch", width: 90 },
      { prop: "published", label: "已发布", type: "switch", width: 90 },
    ],
  },
  {
    label: "链接",
    children: [
      { prop: "platformHomePages", label: "平台主页", width: 250 },
      { prop: "mainPublishLink", label: "主发布链接", width: 250 },
      { prop: "syncPublishLink", label: "同步链接", width: 250 },
    ],
  },
  {
    label: "数据指标",
    children: [
      { prop: "likes", label: "点赞", width: 120, sortable: true },
      { prop: "collections", label: "收藏", width: 120, sortable: true },
      { prop: "comments", label: "评论", width: 120, sortable: true },
    ],
  },
  {
    label: "其他",
    children: [
      { prop: "cooperationMethod", label: "合作方式", width: 150 },
      { prop: "remarks", label: "备注", width: 250 },
    ],
  },
];
const isUrl = (prop: string) =>
  ["mainPublishLink", "syncPublishLink"].includes(prop);

// Function to format date to YYYY-MM-DD
// 数字格式化函数 - 处理数字和非数字格式
const formatNumber = (value: number | string): string => {
  if (!value) return '0';
  
  // 如果是字符串且不能转换为数字，则直接返回原值
  if (typeof value === 'string' && isNaN(Number(value))) {
    return value;
  }
  
  // 否则按数字格式化
  const number = typeof value === 'string' ? parseFloat(value) : value;
  return number.toLocaleString('zh-CN');
};

// 日期格式化函数
const formatDate = (dateString: string | Date): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return String(dateString);
  }
  return date.toISOString().split("T")[0];
};

// 日期时间格式化函数
const formatDateTime = (dateString: string | Date): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return String(dateString);
  }
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 显示达人详情（默认可编辑）
const showDetails = (daren: any) => {
  currentDaren.value = { ...daren };
  detailEditForm.value = { ...daren }; // 初始化编辑表单
  showDetailsDialog.value = true;
  isDetailEditing.value = true; // 默认进入编辑模式
};

// 开始编辑详情
const startDetailEdit = () => {
  detailEditForm.value = { ...currentDaren.value };
  isDetailEditing.value = true;
};

// 取消编辑详情
const cancelDetailEdit = () => {
  showDetailsDialog.value = false; // 直接关闭对话框
  detailEditForm.value = {};
};

// 保存详情编辑
const saveDetailEdit = async () => {
  if (!currentDaren.value || !currentDaren.value._id) return;
  
  detailSaving.value = true;
  try {
    const response = await api.put(`/darens/${currentDaren.value._id}`, detailEditForm.value);
    
    // 更新当前显示的达人数据
    currentDaren.value = { ...response.data };
    
    // 更新列表中的数据
    const index = darenList.value.findIndex(item => item._id === currentDaren.value._id);
    if (index !== -1) {
      darenList.value[index] = { ...response.data };
    }
    
    isDetailEditing.value = false;
    ElMessage.success('保存成功');
  } catch (error) {
    ElMessage.error('保存失败，请重试');
    console.error('保存详情失败:', error);
  } finally {
    detailSaving.value = false;
  }
};

// 检查是否有任何链接
const hasAnyLinks = computed(() => {
  if (!currentDaren.value) return false;
  return !!(
    currentDaren.value.homePage || 
    currentDaren.value.douyinLink || 
    currentDaren.value.dianping || 
    currentDaren.value.mainPublishLink || 
    currentDaren.value.syncPublishLink
  );
});

const getEmptyForm = () => ({
  _id: null,
  nickname: "",
  platform: "小红书",
  accountType: "",
  followers: "",
  homePage: "",
  contactPerson: "",
  hasConnection: false,
  contactInfo: "",
  inGroup: false,
  storeArrivalTime: null,
  arrivedAtStore: false,
  reviewed: false,
  published: false,
  mainPublishLink: "",
  syncPublishLink: "",
  remarks: "",
  douyinLink: "",
  dianping: "",
  exposure: 0,
  reads: 0,
  likes: 0,
  comments: 0,
  collections: 0,
  forwards: 0,
  cooperationMethod: "",
  period: "",
  fee: 0,
  xiaohongshuId: "",
  ipLocation: "",
  likesAndCollections: "",
});
const addForm = ref(getEmptyForm());

// Validation rules
const rules = reactive<FormRules>({
  nickname: [{ required: true, message: "达人昵称不能为空", trigger: "blur" }],
  homePage: [{ type: "url", message: "请输入有效的主页链接", trigger: "blur" }],
  period: [{ required: true, message: '请选择期数', trigger: 'change' }],
  followers: [
    { required: true, message: "粉丝数不能为空", trigger: "blur" }
    // 移除数字类型验证，允许输入如"10万+"等格式
  ],
  // 移除对点赞、收藏、评论数的数字类型验证
  likes: [],
  collections: [],
  comments: []
});



// API setup
const api = axios.create({ baseURL: "http://localhost:3000/api" });

// --- Component Logic ---

// Load initial data and cookie
onMounted(() => {
  console.log('组件已挂载，准备获取达人列表');
  fetchDarens();
  fetchPeriods();
});

// Cookie management functions
const saveCookie = () => {
  setCookie(cookie.value);
  ElMessage.success('Cookie已保存');
  showCookieModal.value = false;
};

const clearCookieAndClose = () => {
  ElMessageBox.confirm('确定要清除Cookie吗？这可能会影响数据解析功能。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    cookie.value = '';
    setCookie('');
    ElMessage.success('Cookie已清除');
    showCookieModal.value = false;
  }).catch(() => {});
};

// Watch for cookie changes to save them
watch(cookie, (newCookie) => {
  // 自动保存已禁用，现在需要点击保存按钮
  // setCookie(newCookie);
});

// Fetch all darens from backend
// Pagination handlers
  const handleSizeChange = (val: number) => {
    pageSize.value = val;
    currentPage.value = 1;
    fetchDarens();
  };

  const handleCurrentChange = (val: number) => {
    currentPage.value = val;
    fetchDarens();
  };

  // 排序状态管理
  const sortField = ref<string | null>(null);
  const sortOrder = ref<'ascending' | 'descending' | null>(null);

  const handleSortChange = (column: any) => {
    sortField.value = column.prop;
    sortOrder.value = column.order;
    fetchDarens();
  };

  const fetchDarens = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    // 调试分页参数
    console.log('分页参数:', currentPage.value, pageSize.value);
    params.append('page', currentPage.value.toString());
    params.append('limit', pageSize.value.toString());
    if (sortField.value && sortOrder.value) {
      params.append('sortBy', sortField.value);
      params.append('sortOrder', sortOrder.value === 'ascending' ? 'asc' : 'desc');
    }
    if (periodFilter.value) {
      params.append("period", periodFilter.value);
    }
    console.log('Fetching darens with parameters:', params.toString());
    const { data } = await api.get("/darens", { params });
    darenList.value = data.items || [];
      total.value = data.total || 0;
      console.log('获取达人列表成功:', (data.items || []).length, '条记录');
      } catch (error) {
    // 详细错误信息处理
      if (error.response) {
        // 服务器返回错误响应
        const status = error.response.status;
        const statusText = error.response.statusText;
        const data = error.response.data;
        const errorMsg = data?.message || `服务器错误: ${status} ${statusText}`;
        ElMessage.error(`获取达人列表失败: ${errorMsg}`);
        console.error('API错误详情:', error.response);
      } else if (error.request) {
        // 请求已发送但无响应
        ElMessage.error('获取达人列表失败: 服务器无响应，请检查后端服务是否运行');
        console.error('网络错误详情:', error.request);
      } else {
        // 请求配置错误
        ElMessage.error(`获取达人列表失败: ${error.message}`);
        console.error('请求错误详情:', error.message);
      }
  } finally {
    loading.value = false;
  }
};

// Fetch distinct periods for dropdown
const fetchPeriods = async () => {
  try {
    const { data } = await api.get("/periods");
    periodOptions.value = data;
  } catch (error) {
    ElMessage.error("获取期数列表失败");
  }
};

// Watch for filter changes
watch(periodFilter, (newValue) => {
  fetchDarens();
});

// --- In-Table Editing Logic ---

const handleEdit = (row: any) => {
  editingId.value = row._id;
  editForm.value = { ...row }; // Create a copy for editing
};

const handleCancelEdit = () => {
  editingId.value = null;
};

const handleSave = async (row: any) => {
    saving.value = true;
    try {
    await api.put(`/darens/${row._id}`, editForm.value);
    ElMessage.success("更新成功");
    editingId.value = null;
    fetchDarens(); // Refresh data
  } catch (error) {
      ElMessage.error("更新失败");
    } finally {
      saving.value = false;
    }
};

// --- Add New Daren Logic ---

const showAddDialog = () => {
  addDialogVisible.value = true;
};

const resetAddForm = () => {
  addForm.value = getEmptyForm();
};

// 自动解析延迟计时器
  const parseTimer = ref<NodeJS.Timeout | null>(null);

  // 处理主页链接输入变化
  const handleHomePageInput = (val: string) => {
    // 清除之前的计时器
    if (parseTimer.value) clearTimeout(parseTimer.value);

    // 验证URL格式
    if (val && val.includes("/user/profile/")) {
      // 延迟500ms解析，避免频繁触发
      parseTimer.value = setTimeout(() => {
        parsePageInfo();
      }, 500);
    }
  };

  const parsePageInfo = async (parseType: string = "auto") => {
  if (!addForm.value.homePage) {
    ElMessage.warning("请先粘贴用户主页链接");
    return;
  }

  // 检查是否为用户主页链接
  if (!addForm.value.homePage.includes("/user/profile/")) {
    ElMessage.warning(
      "请输入小红书用户主页链接，格式如：https://www.xiaohongshu.com/user/profile/xxx"
    );
    return;
  }

  parsing.value = true;
  try {
    ElMessage.info("正在解析用户主页信息...");

    const response = await api.post("/parse-xhs-user", {
      url: addForm.value.homePage,
      cookie: cookie.value,
    });

    const data = response.data;

    if (data.type === "user" && data.nickname) {
      // 只处理用户页面数据
      const {
        nickname,
        xiaohongshuId,
        followers,
        likesAndCollections,
        ipLocation,
      } = data;

      if (nickname) addForm.value.nickname = nickname;
      if (xiaohongshuId) addForm.value.xiaohongshuId = xiaohongshuId;
      if (followers) addForm.value.followers = followers;
      if (likesAndCollections)
        addForm.value.likesAndCollections = likesAndCollections;
      if (ipLocation) addForm.value.ipLocation = ipLocation;

      ElMessage.success("用户主页解析成功！");
    } else {
      ElMessage.error(`解析失败：${data.message || '无法获取用户信息'}`);
    }
  } catch (error: any) {
    const message =
      error.response?.data?.message || "解析失败，请检查链接或Cookie";
    ElMessage.error(`解析用户信息失败：${message}`);
  } finally {
    parsing.value = false;
  }
};

// --- Handle Main Publish Link Change ---

const handleMainPublishLinkChange = async () => {
  const link = addForm.value.mainPublishLink?.trim();

  // 检查是否为小红书笔记链接
  if (
    !link ||
    (!link.includes("/explore/") && !link.includes("/discovery/item/"))
  ) {
    return; // 不是笔记链接，不处理
  }

  try {
    ElMessage.info("检测到笔记链接，正在解析数据指标...");

    const response = await api.post("/parse-xhs-note-simple", {
      url: link,
      cookie: cookie.value,
    });

    const data = response.data;

    if (data.success) {
      // 更新数据指标
      addForm.value.likes = data.likes || 0;
      addForm.value.collections = data.collections || 0;
      addForm.value.comments = data.comments || 0;

      ElMessage.success(
        `笔记数据解析成功！点赞: ${data.likes}, 收藏: ${data.collections}, 评论: ${data.comments}`
      );
    } else {
      ElMessage.warning("笔记数据解析失败，请检查链接或Cookie");
    }
  } catch (error: any) {
    console.error("解析笔记数据失败:", error);
    ElMessage.warning("笔记数据解析失败，请检查链接或网络连接");
  }
};

const handleAddNew = async () => {
    if (!addFormRef.value) return;
    await addFormRef.value.validate(async (valid, invalidFields) => {
      if (valid) submitting.value = true;
      if (valid) {
        try {
            await api.post("/darens", addForm.value);
            ElMessage.success("添加成功");
            addDialogVisible.value = false;
            fetchDarens();
          } catch (error: any) {
            const message = error.response?.data?.message || "操作失败，请重试";
            ElMessage.error(message);
          } finally {
            submitting.value = false;
          }
      } else {
        // 自动滚动到第一个错误字段
        const firstErrorField = Object.keys(invalidFields)[0];
        if (firstErrorField) {
          const errorEl = document.querySelector(`[prop="${firstErrorField}"]`);
          if (errorEl) {
            errorEl.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
            // 聚焦到第一个错误输入框
            (errorEl.querySelector('input, select') as HTMLElement)?.focus();
          }
        }
      }
    });
  };

// --- Update Functions ---

const updateUserProfile = async (row: any) => {
  if (!row.homePage) {
    ElMessage.warning("该达人没有设置小红书主页链接");
    return;
  }

  try {
    ElMessage.info("正在更新用户主页数据...");

    const response = await api.post("/parse-xhs-user", {
      url: row.homePage,
      cookie: cookie.value,
    });

    const data = response.data;

    if (data.type === "user" && data.nickname) {
      // 准备更新的数据
      const updateData = { ...row };

      if (data.nickname) updateData.nickname = data.nickname;
      if (data.xiaohongshuId) updateData.xiaohongshuId = data.xiaohongshuId;
      if (data.followers) updateData.followers = data.followers;
      if (data.likesAndCollections)
        updateData.likesAndCollections = data.likesAndCollections;
      if (data.ipLocation) updateData.ipLocation = data.ipLocation;

      // 更新到数据库
      await api.put(`/darens/${row._id}`, updateData);

      ElMessage.success("用户主页数据更新成功！");
      fetchDarens(); // 刷新列表
    } else {
      ElMessage.error("更新失败：" + (data.message || "无法获取用户信息"));
    }
  } catch (error: any) {
    const message =
      error.response?.data?.message || "更新失败，请检查链接或Cookie";
    ElMessage.error(message);
  }
};

const updateNoteData = async (row: any) => {
  if (!row.mainPublishLink) {
    ElMessage.warning("该达人没有设置主发布链接");
    return;
  }

  // 检查是否为小红书笔记链接
  if (
    !row.mainPublishLink.includes("/explore/") &&
    !row.mainPublishLink.includes("/discovery/item/")
  ) {
    ElMessage.warning("主发布链接不是小红书笔记链接");
    return;
  }

  try {
    ElMessage.info("正在更新笔记数据指标...");

    const response = await api.post("/parse-xhs-note-simple", {
      url: row.mainPublishLink,
      cookie: cookie.value,
    });

    const data = response.data;

    if (data.success) {
      // 准备更新的数据
      const updateData = {
        ...row,
        likes: data.likes || 0,
        collections: data.collections || 0,
        comments: data.comments || 0,
      };

      // 更新到数据库
      await api.put(`/darens/${row._id}`, updateData);

      ElMessage.success(
        `笔记数据更新成功！点赞: ${data.likes}, 收藏: ${data.collections}, 评论: ${data.comments}`
      );
      fetchDarens(); // 刷新列表
    } else {
      ElMessage.warning("笔记数据更新失败，请检查链接或Cookie");
    }
  } catch (error: any) {
    console.error("更新笔记数据失败:", error);
    ElMessage.error("笔记数据更新失败，请检查链接或网络连接");
  }
};

// --- Delete Logic ---

const handleDelete = async (id: string) => {
  try {
    await api.delete(`/darens/${id}`);
    ElMessage.success("删除成功");
    fetchDarens();
  } catch (error) {
    ElMessage.error("删除失败");
  }
};

// --- New Feature Implementations ---

// Refresh data
const refreshData = () => {
  fetchDarens();
  fetchPeriods();
  ElMessage.success('数据已刷新');
};

// Search functionality
const handleSearch = () => {
  // Reset to first page when searching
  currentPage.value = 1;
  fetchDarens();
};

// Column visibility settings
const initColumnSettings = () => {
  // Initialize all columns as visible by default
  columnGroups.forEach(group => {
    group.children.forEach(column => {
      visibleColumns.value[column.prop] = true;
    });
  });
  
  // Try to load saved settings
  const savedSettings = localStorage.getItem('column_settings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      visibleColumns.value = { ...visibleColumns.value, ...parsed };
    } catch (e) {
      console.error('Failed to parse saved column settings');
    }
  }
};

const applyColumnSettings = () => {
  // Save settings to localStorage
  localStorage.setItem('column_settings', JSON.stringify(visibleColumns.value));
  showColumnSettings.value = false;
  ElMessage.success('列设置已保存');
};

const resetColumnSettings = () => {
  // Reset all columns to visible
  columnGroups.forEach(group => {
    group.children.forEach(column => {
      visibleColumns.value[column.prop] = true;
    });
  });
  ElMessage.info('已重置为默认设置');
};

// Export data functionality
const exportData = async () => {
  exporting.value = true;
  try {
    // Get all data for export (no pagination)
    const params = new URLSearchParams();
    if (periodFilter.value) {
      params.append("period", periodFilter.value);
    }
    if (statusFilter.value) {
      params.append(statusFilter.value, "true");
    }
    if (searchKeyword.value) {
      params.append("search", searchKeyword.value);
    }
    
    const { data } = await api.get("/darens", { params });
    const exportData = data.items || [];
    
    if (exportData.length === 0) {
      ElMessage.warning('没有数据可导出');
      exporting.value = false;
      return;
    }
    
    // Convert to CSV
    const headers = columnGroups.flatMap(group => 
      group.children.map(col => ({ title: col.label, prop: col.prop }))
    );
    
    const csvContent = [
      // Header row
      headers.map(h => `"${h.title}"`).join(','),
      // Data rows
      ...exportData.map(row => 
        headers.map(h => {
          const value = row[h.prop];
          // Handle different data types
          if (value === null || value === undefined) return '""';
          if (typeof value === 'boolean') return value ? '"是"' : '"否"';
          if (typeof value === 'object' && value instanceof Date) return `"${formatDate(value)}"`;
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `达人数据_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    ElMessage.success('数据导出成功');
  } catch (error) {
    ElMessage.error('导出失败');
    console.error('Export error:', error);
  } finally {
    exporting.value = false;
  }
};

// Batch import functionality
const importFormat = ref('csv');
const importing = ref(false);
const importFile = ref<File | null>(null);

const handleImportFileChange = (file: any) => {
  importFile.value = file.raw;
};

const handleBatchImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请先选择要导入的文件');
    return;
  }
  
  importing.value = true;
  try {
    // Read file content
    const fileContent = await readFileAsText(importFile.value);
    let dataToImport: any[] = [];
    
    // Parse based on format
    if (importFormat.value === 'csv') {
      dataToImport = parseCSV(fileContent);
    } else if (importFormat.value === 'excel') {
      ElMessage.error('Excel导入功能需要额外的库支持，请使用CSV或JSON格式');
      importing.value = false;
      return;
    } else if (importFormat.value === 'json') {
      try {
        dataToImport = JSON.parse(fileContent);
        if (!Array.isArray(dataToImport)) {
          throw new Error('JSON格式必须是数组');
        }
      } catch (e) {
        ElMessage.error('JSON解析失败，请检查格式');
        importing.value = false;
        return;
      }
    }
    
    if (dataToImport.length === 0) {
      ElMessage.warning('没有找到可导入的数据');
      importing.value = false;
      return;
    }
    
    // Confirm import
    const confirmImport = await ElMessageBox.confirm(
      `确认导入 ${dataToImport.length} 条记录？`,
      '批量导入',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).catch(() => false);
    
    if (!confirmImport) {
      importing.value = false;
      return;
    }
    
    // Process import
    let successCount = 0;
    let failCount = 0;
    
    for (const item of dataToImport) {
      try {
        await api.post('/darens', item);
        successCount++;
      } catch (e) {
        failCount++;
        console.error('Import item failed:', e);
      }
    }
    
    ElMessage.success(`导入完成：成功 ${successCount} 条，失败 ${failCount} 条`);
    showBatchImport.value = false;
    fetchDarens();
  } catch (error) {
    ElMessage.error('导入失败');
    console.error('Import error:', error);
  } finally {
    importing.value = false;
  }
};

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

const parseCSV = (csvText: string): any[] => {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];
  
  // Parse header
  const headers = lines[0].split(',').map(h => 
    h.trim().replace(/^"(.*)"$/, '$1')
  );
  
  // Parse data rows
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',').map(v => 
        v.trim().replace(/^"(.*)"$/, '$1')
      );
      
      const item: Record<string, any> = {};
      headers.forEach((header, index) => {
        if (index < values.length) {
          const value = values[index];
          // Convert values based on column type
          if (value === '是') item[header] = true;
          else if (value === '否') item[header] = false;
          else if (!isNaN(Number(value)) && value !== '') item[header] = Number(value);
          else item[header] = value;
        }
      });
      
      return item;
    });
};

const downloadTemplate = (format: string) => {
  // Create template based on column definitions
  const templateData: Record<string, any> = {};
  columnGroups.forEach(group => {
    group.children.forEach(col => {
      if (col.type === 'number') templateData[col.prop] = 0;
      else if (col.type === 'switch') templateData[col.prop] = false;
      else if (col.type === 'date') templateData[col.prop] = '';
      else templateData[col.prop] = '';
    });
  });
  
  if (format === 'json') {
    // JSON template
    const jsonStr = JSON.stringify([templateData], null, 2);
    downloadTextFile(jsonStr, 'template.json', 'application/json');
  } else if (format === 'csv') {
    // CSV template
    const headers = Object.keys(templateData).join(',');
    const values = Object.values(templateData).map(v => typeof v === 'string' ? `"${v}"` : v).join(',');
    downloadTextFile(`${headers}\n${values}`, 'template.csv', 'text/csv');
  } else {
    ElMessage.info('Excel模板下载需要额外的库支持，请使用CSV或JSON格式');
  }
};

const downloadTextFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Status count functions for quick stats
const getStatusCount = (status: string): number => {
  return darenList.value.filter(daren => daren[status]).length;
};

const getPendingCount = (): number => {
  return darenList.value.filter(daren => 
    daren.hasConnection && !daren.published
  ).length;
};

// 计算当前筛选结果的总费用
const getTotalFee = (): number => {
  return darenList.value.reduce((total, daren) => {
    // 确保fee是数字类型
    const fee = typeof daren.fee === 'string' ? parseFloat(daren.fee) : (daren.fee || 0);
    return total + fee;
  }, 0);
};

// Initialize column settings on mount
onMounted(() => {
  initColumnSettings();
});
</script>

<style>
/* Header styles */
.el-header {
  background-color: #409eff;
  color: #fff;
  line-height: 60px;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.app-title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* Main content area */
.el-main {
  padding: 20px;
  background-color: #f5f7fa;
}

/* Enhanced toolbar */
.enhanced-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.toolbar-left, .toolbar-center, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-center {
  flex-grow: 1;
  justify-content: center;
}

/* Quick stats cards */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stats-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
}

.stat-success {
  color: #67c23a;
}

.stat-primary {
  color: #409eff;
}

.stat-warning {
  color: #e6a23c;
}

.stat-price {
  color: #f56c6c;
  font-weight: 700;
}

.highlight-card {
  background-color: #fef9e7;
  border-left: 3px solid #f56c6c;
}

/* Table styles */
.el-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.el-table .el-input-number .el-input__inner {
  text-align: left;
}

.el-table__header th {
  background-color: #f2f3f5 !important;
  font-weight: 500;
  padding: 12px 0;
}

.el-table .cell {
  padding: 12px 16px;
}

.el-table__row:hover > td {
  background-color: #f9fafc !important;
}

/* 编辑状态高亮 */
.edit-row {
  background-color: #e6f7ff !important;
  border-left: 3px solid #1890ff;
}

.edit-row:hover > td {
  background-color: #e6f7ff !important;
}

/* Column settings dialog */
.column-settings {
  padding: 10px;
}

.settings-description {
  color: #606266;
  margin-bottom: 10px;
}

.column-group {
  margin-bottom: 20px;
}

.group-title {
  font-size: 16px;
  margin-bottom: 10px;
  color: #303133;
}

.column-checkboxes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

/* Batch import dialog */
.template-download {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

/* Form optimization */
.el-form-item {
  margin-bottom: 16px;
}

/* Button spacing */
.el-button + .el-button {
  margin-left: 8px;
}

/* 链接格式提示样式 */
.url-format-tip {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
}

/* 操作按钮组优化 */
.operation-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

/* 表单标签宽度统一 */
.el-form-item__label {
  width: 120px !important;
}

/* Cookie modal styles */
.el-dialog__body .el-textarea__inner {
  font-family: monospace;
  font-size: 13px;
  line-height: 1.5;
}

/* Cookie管理样式 */
.cookie-status {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.cookie-status-text {
  margin-left: 10px;
  font-size: 14px;
  color: #606266;
}

.cookie-instructions {
  padding-left: 20px;
  color: #606266;
  line-height: 1.8;
}

.cookie-instructions li {
  margin-bottom: 8px;
}

.cookie-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Daren Details Dialog Styles */
.details-dialog {
  max-width: 1200px;
}

.daren-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.detail-card {
  margin-bottom: 0;
  height: 100%;
  transition: all 0.3s ease;
}

.detail-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item.full-width {
  grid-column: span 2;
}

.detail-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 5px;
}

.detail-value {
  font-size: 14px;
  color: #303133;
}

.remarks-content {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  min-height: 60px;
  white-space: pre-line;
}

.detail-links {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-link-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.link-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #909399;
}

.no-links {
  padding: 20px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 10px 0;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.metric-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 5px;
}

.metric-label {
  font-size: 14px;
  color: #606266;
}

.details-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Pagination Styles */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  background-color: #fff;
  border-top: 1px solid #e4e7ed;
  margin-top: 10px;
}

.pagination-info {
  display: flex;
  align-items: center;
  color: #606266;
  font-size: 14px;
}

.total-info {
  margin-right: 10px;
}

.pagination-component {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.pagination-component .el-pagination {
  padding: 0;
}

/* 分页器按钮优化 */
.pagination-component .el-pager li {
  min-width: 32px;
  height: 32px;
  line-height: 30px;
  border-radius: 4px;
  margin: 0 2px;
}

.pagination-component .el-pager li.active {
  background-color: #409eff;
  color: white;
}

.pagination-component .btn-prev,
.pagination-component .btn-next {
  border-radius: 4px;
  height: 32px;
  line-height: 30px;
}

/* View Mode Switch Styles */
.view-mode-switch {
  margin-right: 15px;
}

.view-mode-switch .el-radio-button__inner {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
}

/* Work Mode Styles */
.work-mode-container {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  min-height: calc(100vh - 300px);
}

.work-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.work-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #e4e7ed;
}

.work-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #409eff;
}

.work-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.work-info {
  flex: 1;
}

.work-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.work-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.work-actions {
  margin-left: 12px;
}

.work-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.work-metrics .metric-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metric-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.metric-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.metric-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.metric-label {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.work-links {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #fafbfc;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.link-item:last-child {
  margin-bottom: 0;
}

.link-text {
  flex: 1;
  font-size: 13px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-progress {
  margin-bottom: 16px;
}

.progress-steps {
  display: flex;
  justify-content: space-between;
  position: relative;
}

.progress-steps::before {
  content: '';
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  height: 2px;
  background-color: #e4e7ed;
  z-index: 1;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  background-color: white;
  padding: 0 4px;
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #f5f7fa;
  border: 2px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  margin-bottom: 4px;
  transition: all 0.3s ease;
}

.step.active .step-icon {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
}

.step-label {
  font-size: 11px;
  color: #909399;
  text-align: center;
  line-height: 1.2;
}

.step.active .step-label {
  color: #409eff;
  font-weight: 500;
}

.work-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.fee-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.fee-label {
  font-size: 13px;
  color: #909399;
}

.fee-value {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
}

.work-card-actions {
  display: flex;
  gap: 8px;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .column-checkboxes {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .daren-details {
    grid-template-columns: 1fr;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .pagination-container {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .pagination-component {
    width: 100%;
    justify-content: center;
  }
  
  .work-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  
  .work-metrics {
    grid-template-columns: 1fr;
  }
  
  .progress-steps {
    flex-wrap: wrap;
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .enhanced-toolbar {
    flex-direction: column;
    gap: 15px;
  }
  
  .toolbar-center {
    width: 100%;
  }
  
  .quick-stats {
    grid-template-columns: 1fr;
  }
  
  .column-checkboxes {
    grid-template-columns: 1fr;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-item.full-width {
    grid-column: span 1;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .work-grid {
    grid-template-columns: 1fr;
  }
  
  .work-card-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .work-actions {
    margin-left: 0;
    align-self: flex-start;
  }
  
  .work-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .enhanced-toolbar {
    flex-direction: column;
    gap: 15px;
  }
  
  .toolbar-center {
    width: 100%;
  }
  
  .quick-stats {
    grid-template-columns: 1fr;
  }
  
  .column-checkboxes {
    grid-template-columns: 1fr;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-item.full-width {
    grid-column: span 1;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
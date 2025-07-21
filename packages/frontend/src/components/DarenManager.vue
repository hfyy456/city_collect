<template>
  <el-container style="height: 100vh">
    <el-header> </el-header>
    <el-main>
      <div class="toolbar">
        <el-button type="primary" @click="showAddDialog">添加新达人</el-button>
        <el-button type="info" @click="showCookieModal = true" style="margin-left: 10px">
          Cookie管理
        </el-button>
        <el-input
          v-model="periodFilter"
          placeholder="按期数筛选 (例如: 7.22)"
          clearable
          style="width: 200px; margin-left: 10px"
          @clear="fetchDarens"
        />
        <span style="margin-left: 20px; color: #606266"
          >共 {{ darenList.length }} 条记录</span
        >
      </div>

      <!-- Main Data Table -->
      <el-table
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
              <el-button size="small" @click="handleEdit(scope.row)"
                >编辑</el-button
              >

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
          v-for="group in columnGroups"
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
              <!-- Special handling for our virtual column -->
              <div v-if="column.prop === 'platformHomePages'">
                <div v-if="editingId === scope.row._id">
                  <el-form-item label="小红书主页" style="margin-bottom: 8px">
                    <el-input
                      v-model="editForm.homePage"
                      placeholder="小红书主页链接"
                    ></el-input>
                  </el-form-item>
                  <el-form-item label="抖音主页" style="margin-bottom: 8px">
                    <el-input
                      v-model="editForm.douyinLink"
                      placeholder="抖音主页链接"
                    ></el-input>
                  </el-form-item>
                  <el-form-item label="大众点评主页" style="margin-bottom: 0">
                    <el-input
                      v-model="editForm.dianping"
                      placeholder="大众点评主页链接"
                    ></el-input>
                  </el-form-item>
                </div>
                <div v-else>
                  <el-dropdown
                    trigger="click"
                    v-if="
                      scope.row.homePage ||
                      scope.row.douyinLink ||
                      scope.row.dianping
                    "
                    style="width: 100%"
                  >
                    <el-link
                      :href="
                        scope.row.homePage ||
                        scope.row.douyinLink ||
                        scope.row.dianping
                      "
                      target="_blank"
                      type="primary"
                      style="
                        display: block;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                      "
                    >
                      {{
                        scope.row.homePage ||
                        scope.row.douyinLink ||
                        scope.row.dianping
                      }}
                    </el-link>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item v-if="scope.row.homePage">
                          <el-link
                            :href="scope.row.homePage"
                            target="_blank"
                            :underline="false"
                            >小红书主页</el-link
                          >
                        </el-dropdown-item>
                        <el-dropdown-item v-if="scope.row.douyinLink">
                          <el-link
                            :href="scope.row.douyinLink"
                            target="_blank"
                            :underline="false"
                            >抖音主页</el-link
                          >
                        </el-dropdown-item>
                        <el-dropdown-item v-if="scope.row.dianping">
                          <el-link
                            :href="scope.row.dianping"
                            target="_blank"
                            :underline="false"
                            >大众点评链接</el-link
                          >
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <span v-else>N/A</span>
                </div>
              </div>

              <!-- Regular column handling -->
              <div v-else>
                <div v-if="editingId === scope.row._id">
                  <el-input-number
                    v-if="column.type === 'number'"
                    v-model="editForm[column.prop]"
                    controls-position="right"
                    style="width: 100%"
                  ></el-input-number>
                  <el-switch
                    v-else-if="column.type === 'switch'"
                    v-model="editForm[column.prop]"
                  ></el-switch>
                  <el-date-picker
                    v-else-if="column.type === 'date'"
                    v-model="editForm[column.prop]"
                    type="date"
                    value-format="YYYY-MM-DD"
                    placeholder="选择日期"
                    style="width: 100%"
                  ></el-date-picker>
                  <el-input v-else v-model="editForm[column.prop]"></el-input>
                </div>
                <div v-else>
                  <el-tag
                    v-if="column.type === 'switch'"
                    :type="scope.row[column.prop] ? 'success' : 'info'"
                    >{{ scope.row[column.prop] ? "是" : "否" }}</el-tag
                  >
                  <el-link
                    v-else-if="isUrl(column.prop) && scope.row[column.prop]"
                    :href="scope.row[column.prop]"
                    target="_blank"
                    type="primary"
                    >{{ scope.row[column.prop] }}</el-link
                  >
                  <span
                    v-else-if="column.type === 'date' && scope.row[column.prop]"
                    >{{ formatDate(scope.row[column.prop]) }}</span
                  >
                  <span v-else-if="column.type === 'number'">{{ formatNumber(scope.row[column.prop]) }}</span>
                  <span v-else>{{ scope.row[column.prop] }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table-column>
      </el-table>

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
          <el-form-item label="Cookie">
            <el-input
              v-model="cookie"
              type="textarea"
              :rows="3"
              placeholder="请在此处粘贴小红书页面的Cookie，以获取更完整的信息"
            ></el-input>
          </el-form-item>
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
                <el-input-number
                  v-model="addForm.likes"
                  :min="0"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="收藏数" prop="collections">
                <el-input-number
                  v-model="addForm.collections"
                  :min="0"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="评论数" prop="comments">
                <el-input-number
                  v-model="addForm.comments"
                  :min="0"
                  controls-position="right"
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
      </el-form>
      <template #footer>
        <el-button @click="showCookieModal = false">取消</el-button>
        <el-button type="primary" @click="showCookieModal = false">保存</el-button>
      </template>
    </el-dialog>

  </el-main>
</el-container>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from 'vue';
import axios from 'axios';

import { ElMessage } from "element-plus";
import { getCookie, setCookie } from '@/utils/cookieManager';
import { ArrowDown } from "@element-plus/icons-vue";

import type { FormInstance, FormRules } from "element-plus";

// Refs for table and dialogs
const loading = ref(true);


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
      { prop: "likes", label: "点赞", type: "number", width: 120, sortable: true },
      { prop: "collections", label: "收藏", type: "number", width: 120, sortable: true },
      { prop: "comments", label: "评论", type: "number", width: 120, sortable: true },
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
// 数字格式化函数 - 添加千分位和货币符号
const formatNumber = (num: number | string): string => {
  if (!num) return '0';
  const number = typeof num === 'string' ? parseFloat(num) : num;
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
      { required: true, message: "粉丝数不能为空", trigger: "blur" },
      { type: "number", message: "请输入有效的数字", trigger: "blur" }
    ],
    likes: [
      { type: "number", message: "请输入有效的数字", trigger: "blur" }
    ],
    collections: [
      { type: "number", message: "请输入有效的数字", trigger: "blur" }
    ],
    comments: [
      { type: "number", message: "请输入有效的数字", trigger: "blur" }
    ]
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

// Watch for cookie changes to save them
watch(cookie, (newCookie) => {
    setCookie(newCookie);
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
</script>

<style>
.el-header {
  background-color: #409eff;
  color: #fff;
  line-height: 60px;
  text-align: center;
}
.toolbar {
  padding-bottom: 20px;
  text-align: left;
}
.el-main {
  padding: 20px;
}
.el-table .el-input-number .el-input__inner {
  text-align: left;
}

/* Pagination styles */
.table-pagination {
  padding: 10px 0;
}

/* Form optimization */
.el-form-item {
  margin-bottom: 16px;
}

/* Table cell padding */
.el-table .cell {
  padding: 12px 16px;
}

/* 表格行悬停效果 */
.el-table__row:hover > td {
  background-color: #f9fafc !important;
}

/* 表头样式优化 */
.el-table__header th {
  background-color: #f2f3f5 !important;
  font-weight: 500;
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

/* 编辑状态高亮 */
.edit-row {
  background-color: #e6f7ff !important;
  border-left: 3px solid #1890ff;
}

.edit-row:hover > td {
  background-color: #e6f7ff !important;
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
</style>
<template>
  <el-container style="height: 100vh;">
    <el-header>
    </el-header>
    <el-main>
      <div class="toolbar">
        <el-button type="primary" @click="showAddDialog">添加新达人</el-button>
      </div>

      <!-- Main Data Table -->
      <el-table :data="darenList" v-loading="loading" style="width: 100%" border stripe height="calc(100vh - 140px)">
        <!-- Operations Column (Fixed) -->
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="scope">
            <div v-if="editingId === scope.row._id">
              <el-button size="small" type="success" @click="handleSave(scope.row)">保存</el-button>
              <el-button size="small" @click="handleCancelEdit">取消</el-button>
            </div>
            <div v-else>
              <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
              <el-popconfirm title="确定删除这位达人吗？" @confirm="handleDelete(scope.row._id)">
                <template #reference>
                  <el-button size="small" type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>

        <!-- Data Columns -->
        <el-table-column prop="nickname" label="昵称" width="150" fixed />
        
        <!-- Grouped Columns -->
        <el-table-column v-for="group in columnGroups" :key="group.label" :label="group.label">
            <el-table-column v-for="column in group.children" :key="column.prop" :prop="column.prop" :label="column.label" :min-width="column.width || 150">
                <template #default="scope">
                    <div v-if="editingId === scope.row._id">
                        <el-input-number v-if="column.type === 'number'" v-model="editForm[column.prop]" controls-position="right" style="width: 100%"></el-input-number>
                        <el-switch v-else-if="column.type === 'switch'" v-model="editForm[column.prop]"></el-switch>
                        <el-date-picker v-else-if="column.type === 'datetime'" v-model="editForm[column.prop]" type="datetime" style="width: 100%"></el-date-picker>
                        <el-input v-else v-model="editForm[column.prop]"></el-input>
                    </div>
                    <div v-else>
                        <el-tag v-if="column.type === 'switch'" :type="scope.row[column.prop] ? 'success' : 'info'">{{ scope.row[column.prop] ? '是' : '否' }}</el-tag>
                        <el-link v-else-if="isUrl(column.prop) && scope.row[column.prop]" :href="scope.row[column.prop]" target="_blank" type="primary">{{ scope.row[column.prop] }}</el-link>
                        <span v-else>{{ scope.row[column.prop] }}</span>
                    </div>
                </template>
            </el-table-column>
        </el-table-column>
      </el-table>

      <!-- Add Daren Dialog -->
      <el-dialog v-model="addDialogVisible" title="添加新达人" width="60%" @close="resetAddForm">
        <el-form :model="addForm" ref="addFormRef" :rules="rules" label-width="120px">
           <el-form-item label="Cookie">
              <el-input v-model="cookie" type="textarea" :rows="3" placeholder="请在此处粘贴小红书页面的Cookie，以获取更完整的信息"></el-input>
            </el-form-item>
            <el-form-item label="小红书主页" prop="homePage">
                <el-input v-model="addForm.homePage" placeholder="粘贴小红书主页链接，然后点击右侧按钮可自动识别" style="width: calc(100% - 80px); margin-right: 8px;"></el-input>
                <el-button @click="parsePageInfo" :loading="parsing">识别</el-button>
            </el-form-item>
            
            <el-divider content-position="left">识别结果</el-divider>

            <el-row :gutter="20">
              <el-col :span="12"><el-form-item label="达人昵称" prop="nickname"><el-input v-model="addForm.nickname"></el-input></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="小红书ID" prop="xiaohongshuId"><el-input v-model="addForm.xiaohongshuId"></el-input></el-form-item></el-col>
            </el-row>
            <el-row :gutter="20">
                <el-col :span="12"><el-form-item label="粉丝数" prop="followers"><el-input v-model="addForm.followers"></el-input></el-form-item></el-col>
                <el-col :span="12"><el-form-item label="获赞与收藏" prop="likesAndCollections"><el-input v-model="addForm.likesAndCollections"></el-input></el-form-item></el-col>
            </el-row>
            <el-row :gutter="20">
                <el-col :span="12"><el-form-item label="IP属地" prop="ipLocation"><el-input v-model="addForm.ipLocation"></el-input></el-form-item></el-col>
            </el-row>
             <!-- You can add other fields here if you want to edit them upon creation -->
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="addDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleAddNew">提交</el-button>
            </span>
        </template>
      </el-dialog>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from 'vue';
import axios from 'axios';
import { ElMessage, FormInstance, FormRules } from 'element-plus';

// Refs for table and dialogs
const loading = ref(true);
const darenList = ref<any[]>([]);
const addDialogVisible = ref(false);
const parsing = ref(false);

// Refs for in-table editing
const editingId = ref<string | null>(null);
const editForm = ref<any>({});

// Refs for adding new daren
const addFormRef = ref<FormInstance>();
const cookie = ref('');

// Table column definitions with grouping
const columnGroups = [
  {
    label: '基本信息',
    children: [
      { prop: 'platform', label: '平台', width: 100 },
      { prop: 'followers', label: '粉丝数', width: 120 },
      { prop: 'xiaohongshuId', label: '小红书ID', width: 150 },
      { prop: 'ipLocation', label: 'IP属地', width: 120 },
      { prop: 'likesAndCollections', label: '获赞与收藏', width: 120 },
      { prop: 'accountType', label: '账号类型', width: 120 },
      { prop: 'homePage', label: '主页链接', width: 250 },
    ]
  },
  {
    label: '联系与进度',
    children: [
      { prop: 'contactPerson', label: '对接人', width: 120 },
      { prop: 'contactInfo', label: '联系方式', width: 150 },
      { prop: 'hasConnection', label: '已建联', type: 'switch', width: 90 },
      { prop: 'inGroup', label: '在群', type: 'switch', width: 90 },
      { prop: 'storeArrivalTime', label: '到店时间', type: 'datetime', width: 200 },
      { prop: 'arrivedAtStore', label: '已到店', type: 'switch', width: 90 },
      { prop: 'reviewed', label: '已审稿', type: 'switch', width: 90 },
      { prop: 'published', label: '已发布', type: 'switch', width: 90 },
    ]
  },
  {
    label: '链接',
    children: [
      { prop: 'mainPublishLink', label: '主发布链接', width: 250 },
      { prop: 'syncPublishLink', label: '同步链接', width: 250 },
    ]
  },
  {
      label: '数据指标',
      children: [
        { prop: 'exposure', label: '曝光', type: 'number', width: 120 },
        { prop: 'reads', label: '阅读', type: 'number', width: 120 },
        { prop: 'likes', label: '点赞', type: 'number', width: 120 },
        { prop: 'comments', label: '评论', type: 'number', width: 120 },
        { prop: 'collections', label: '收藏', type: 'number', width: 120 },
        { prop: 'forwards', label: '转发', type: 'number', width: 120 },
      ]
  },
  {
      label: '其他',
      children: [
        { prop: 'cooperationMethod', label: '合作方式', width: 150 },
        { prop: 'dianping', label: '大众点评', width: 150 },
        { prop: 'remarks', label: '备注', width: 250 },
      ]
  }
];
const isUrl = (prop: string) => ['homePage', 'mainPublishLink', 'syncPublishLink'].includes(prop);

const getEmptyForm = () => ({
  _id: null,
  nickname: '',
  platform: '小红书',
  accountType: '',
  followers: '',
  homePage: '',
  contactPerson: '',
  hasConnection: false,
  contactInfo: '',
  inGroup: false,
  storeArrivalTime: null,
  arrivedAtStore: false,
  reviewed: false,
  published: false,
  mainPublishLink: '',
  syncPublishLink: '',
  remarks: '',
  dianping: '',
  exposure: 0,
  reads: 0,
  likes: 0,
  comments: 0,
  collections: 0,
  forwards: 0,
  cooperationMethod: '',
  xiaohongshuId: '',
  ipLocation: '',
  likesAndCollections: '',
});
const addForm = ref(getEmptyForm());

// Validation rules
const rules = reactive<FormRules>({
  nickname: [{ required: true, message: '达人昵称不能为空', trigger: 'blur' }],
  homePage: [{ type: 'url', message: '请输入有效的主页链接', trigger: 'blur' }],
});

// API setup
const api = axios.create({ baseURL: 'http://localhost:3000/api' });

// --- Component Logic ---

// Load initial data and cookie
onMounted(() => {
  const savedCookie = localStorage.getItem('xhs_cookie');
  if (savedCookie) cookie.value = savedCookie;
  fetchDarens();
});

// Watch for cookie changes to save them
watch(cookie, (newCookie) => {
  if(newCookie) {
    localStorage.setItem('xhs_cookie', newCookie);
    ElMessage({ message: 'Cookie 已自动保存至浏览器', type: 'success', duration: 2000 });
  }
});

// Fetch all darens from backend
const fetchDarens = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/darens');
    darenList.value = data;
  } catch (error) { ElMessage.error('获取达人列表失败'); } 
  finally { loading.value = false; }
};

// --- In-Table Editing Logic ---

const handleEdit = (row: any) => {
  editingId.value = row._id;
  editForm.value = { ...row }; // Create a copy for editing
};

const handleCancelEdit = () => {
  editingId.value = null;
};

const handleSave = async (row: any) => {
  try {
    await api.put(`/darens/${row._id}`, editForm.value);
    ElMessage.success('更新成功');
    editingId.value = null;
    fetchDarens(); // Refresh data
  } catch (error) {
    ElMessage.error('更新失败');
  }
};

// --- Add New Daren Logic ---

const showAddDialog = () => {
  addDialogVisible.value = true;
};

const resetAddForm = () => {
    addForm.value = getEmptyForm();
};

const parsePageInfo = async () => {
  if (!addForm.value.homePage) return ElMessage.warning('请输入小红书主页链接');
  parsing.value = true;
  try {
    const { data } = await api.post('/parse-xhs-page', { url: addForm.value.homePage, cookie: cookie.value });
    Object.assign(addForm.value, data); // Use Object.assign for robust reactivity
    ElMessage.success('信息识别成功');
  } catch (error) { ElMessage.error('信息识别失败，请检查链接、Cookie或手动输入'); } 
  finally { parsing.value = false; }
};

const handleAddNew = async () => {
  if (!addFormRef.value) return;
  await addFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await api.post('/darens', addForm.value);
        ElMessage.success('添加成功');
        addDialogVisible.value = false;
        fetchDarens();
      } catch (error) { ElMessage.error('操作失败'); }
    }
  });
};

// --- Delete Logic ---

const handleDelete = async (id: string) => {
  try {
    await api.delete(`/darens/${id}`);
    ElMessage.success('删除成功');
    fetchDarens();
  } catch (error) { ElMessage.error('删除失败'); }
};
</script>

<style>
.el-header { background-color: #409eff; color: #fff; line-height: 60px; text-align: center; }
.toolbar { padding-bottom: 20px; text-align: left; }
.el-main { padding: 20px; }
.el-table .el-input-number .el-input__inner { text-align: left; }
</style> 
<!-- 
  TableColumnRenderer.vue
  This component extracts the complex column rendering logic from DarenManager.vue
  to make the main component more maintainable.
-->
<template>
  <div>
    <!-- Special handling for platform home pages -->
    <div v-if="column.prop === 'platformHomePages'">
      <div v-if="isEditing">
        <el-form-item label="小红书主页" style="margin-bottom: 8px">
          <el-input
            v-model="modelValue.homePage"
            placeholder="小红书主页链接"
          ></el-input>
        </el-form-item>
        <el-form-item label="抖音主页" style="margin-bottom: 8px">
          <el-input
            v-model="modelValue.douyinLink"
            placeholder="抖音主页链接"
          ></el-input>
        </el-form-item>
        <el-form-item label="大众点评主页" style="margin-bottom: 0">
          <el-input
            v-model="modelValue.dianping"
            placeholder="大众点评主页链接"
          ></el-input>
        </el-form-item>
      </div>
      <div v-else>
        <el-dropdown
          trigger="click"
          v-if="row.homePage || row.douyinLink || row.dianping"
          style="width: 100%"
        >
          <el-link
            :href="row.homePage || row.douyinLink || row.dianping"
            target="_blank"
            type="primary"
            style="
              display: block;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            "
          >
            {{ row.homePage || row.douyinLink || row.dianping }}
          </el-link>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="row.homePage">
                <el-link
                  :href="row.homePage"
                  target="_blank"
                  :underline="false"
                  >小红书主页</el-link
                >
              </el-dropdown-item>
              <el-dropdown-item v-if="row.douyinLink">
                <el-link
                  :href="row.douyinLink"
                  target="_blank"
                  :underline="false"
                  >抖音主页</el-link
                >
              </el-dropdown-item>
              <el-dropdown-item v-if="row.dianping">
                <el-link
                  :href="row.dianping"
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
      <div v-if="isEditing">
        <el-input
          v-if="isMetricField(column.prop)"
          v-model="modelValue[column.prop]"
          placeholder="如: 1.2k, 10万+"
          style="width: 100%"
        ></el-input>
        <el-input-number
          v-else-if="column.type === 'number'"
          v-model="modelValue[column.prop]"
          controls-position="right"
          style="width: 100%"
        ></el-input-number>
        <el-switch
          v-else-if="column.type === 'switch'"
          v-model="modelValue[column.prop]"
        ></el-switch>
        <el-date-picker
          v-else-if="column.type === 'date'"
          v-model="modelValue[column.prop]"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择日期"
          style="width: 100%"
        ></el-date-picker>
        <el-input v-else v-model="modelValue[column.prop]"></el-input>
      </div>
      <div v-else>
        <el-tag
          v-if="column.type === 'switch'"
          :type="row[column.prop] ? 'success' : 'info'"
          >{{ row[column.prop] ? "是" : "否" }}</el-tag
        >
        <el-link
          v-else-if="isUrl(column.prop) && row[column.prop]"
          :href="row[column.prop]"
          target="_blank"
          type="primary"
          >{{ row[column.prop] }}</el-link
        >
        <span
          v-else-if="column.type === 'date' && row[column.prop]"
          >{{ formatDate(row[column.prop]) }}</span
        >
        <span v-else-if="column.type === 'number'">{{ formatNumber(row[column.prop]) }}</span>
        <span v-else>{{ row[column.prop] }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  column: {
    type: Object,
    required: true
  },
  row: {
    type: Object,
    required: true
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: Object,
    required: true
  }
});

defineEmits(['update:modelValue']);

// Helper functions
const isUrl = (prop: string) => ["mainPublishLink", "syncPublishLink"].includes(prop);

// 判断是否为指标字段（允许非数字格式）
const isMetricField = (prop: string) => ["followers", "likes", "comments", "collections", "exposure", "reads", "forwards", "likesAndCollections"].includes(prop);

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
</script>
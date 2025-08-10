# 列设置功能完整指南

## 🎯 功能概述

列设置功能允许用户自定义表格显示的列，并将设置保存到浏览器本地存储中，实现个性化的数据展示体验。

## ✨ 主要特性

### 1. **智能本地存储**
- ✅ 自动保存到 `localStorage`
- ✅ 版本控制，防止配置冲突
- ✅ 错误恢复机制
- ✅ 自动防抖保存（1秒延迟）

### 2. **丰富的操作选项**
- ✅ 全选/全不选
- ✅ 按分组显示/隐藏
- ✅ 预设配置快速应用
- ✅ 重置为默认设置

### 3. **预设配置**
- **基础视图**: 只显示核心信息
- **完整视图**: 显示所有列
- **数据分析视图**: 专注于数据指标
- **进度跟踪视图**: 专注于合作进度

### 4. **用户体验优化**
- ✅ 实时预览统计信息
- ✅ 隐藏列数量徽章提示
- ✅ 分组管理界面
- ✅ 响应式设计

## 🔧 技术实现

### 数据结构

```typescript
// 列设置存储格式
interface ColumnSettings {
  version: string;           // 版本号
  settings: Record<string, boolean>; // 列可见性设置
  timestamp: string;         // 保存时间
  columnCount: number;       // 列总数
}
```

### 核心方法

#### 1. 初始化设置
```typescript
const initColumnSettings = () => {
  // 1. 设置默认值（所有列可见）
  // 2. 从 localStorage 加载保存的设置
  // 3. 版本兼容性检查
  // 4. 错误处理和恢复
}
```

#### 2. 保存设置
```typescript
const saveColumnSettings = () => {
  // 1. 构建设置数据对象
  // 2. 保存到 localStorage
  // 3. 错误处理
  // 4. 返回操作结果
}
```

#### 3. 应用设置
```typescript
const applyColumnSettings = () => {
  // 1. 保存当前设置
  // 2. 关闭设置对话框
  // 3. 显示成功消息
  // 4. 触发表格重新渲染
}
```

### 表格列过滤

```typescript
// 根据可见性设置过滤列
const filteredPersonModeColumns = computed(() => {
  return columnGroups.map(group => ({
    ...group,
    children: group.children.filter(column => visibleColumns.value[column.prop])
  })).filter(group => group.children.length > 0);
});
```

## 📱 用户界面

### 主界面
- **列设置按钮**: 带有隐藏列数量徽章
- **表格**: 根据设置动态显示/隐藏列

### 设置对话框
- **统计信息**: 显示当前可见/隐藏列数量
- **快捷操作**: 全选、全不选、预设配置
- **分组管理**: 按功能分组的列设置
- **预览信息**: 实时显示设置效果

## 🎨 样式设计

### 设计原则
- **清晰的层次结构**: 使用分组和间距
- **直观的视觉反馈**: 徽章、标签、颜色编码
- **响应式布局**: 适配不同屏幕尺寸
- **一致的交互体验**: 统一的按钮和操作风格

### 关键样式类
```css
.column-settings-dialog    // 对话框主容器
.settings-header          // 头部信息区域
.quick-actions           // 快捷操作区域
.column-groups          // 列分组容器
.group-header           // 分组头部
.column-checkboxes      // 复选框网格布局
.settings-preview       // 预览信息区域
```

## 🔄 数据流程

### 初始化流程
1. 组件挂载 → `onMounted`
2. 调用 `initColumnSettings()`
3. 从 localStorage 读取设置
4. 应用到 `visibleColumns`
5. 表格根据设置渲染

### 设置变更流程
1. 用户修改设置 → `visibleColumns` 变化
2. `watch` 监听器触发
3. 防抖延迟 1 秒后自动保存
4. 表格实时更新显示

### 应用设置流程
1. 用户点击"应用设置"
2. 调用 `applyColumnSettings()`
3. 保存到 localStorage
4. 关闭对话框
5. 显示成功消息

## 🛠 配置选项

### 存储配置
```typescript
const COLUMN_SETTINGS_KEY = 'daren_manager_column_settings';
const COLUMN_SETTINGS_VERSION = '1.0';
```

### 预设配置
```typescript
const columnPresets = [
  {
    name: '基础视图',
    description: '只显示最基本的信息',
    columns: ['nickname', 'period', 'fee', 'hasConnection', 'arrivedAtStore', 'reviewed', 'published']
  },
  // ... 更多预设
];
```

## 🔍 调试和维护

### 调试信息
- 控制台日志记录关键操作
- 可选的调试信息显示（开发模式）
- 错误捕获和用户友好的错误提示

### 维护要点
1. **版本兼容性**: 更新列结构时需要更新版本号
2. **性能优化**: 使用防抖避免频繁保存
3. **错误处理**: 完善的错误恢复机制
4. **用户体验**: 及时的反馈和状态提示

## 📋 使用指南

### 基本操作
1. 点击工具栏中的"列设置"按钮
2. 在对话框中勾选/取消勾选要显示的列
3. 使用快捷操作或预设配置快速设置
4. 点击"应用设置"保存并生效

### 高级功能
- **预设配置**: 根据使用场景快速切换视图
- **分组操作**: 按功能分组批量显示/隐藏列
- **自动保存**: 设置会自动保存，无需手动操作

### 最佳实践
1. 根据工作需要选择合适的预设配置
2. 定期检查隐藏的列，避免遗漏重要信息
3. 使用分组操作提高设置效率
4. 利用重置功能快速恢复默认状态

## 🚀 未来扩展

### 可能的增强功能
- [ ] 列宽度自定义
- [ ] 列顺序拖拽调整
- [ ] 多套配置方案保存
- [ ] 导入/导出配置
- [ ] 团队配置共享
- [ ] 列固定位置设置

---

**版本**: v1.0  
**更新时间**: 2024年11月  
**兼容性**: 支持现代浏览器的 localStorage API
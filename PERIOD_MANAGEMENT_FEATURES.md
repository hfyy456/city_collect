# 期数管理功能说明

## 功能概述

期数管理是City Collect达人管理系统的核心功能之一，允许用户按期数维度管理达人合作，包括添加现有达人到指定期数、设置报价、跟踪合作进度和记录作品数据。

## 主要功能

### 1. 期数视图 (`/periods`)

- **期数选择**: 显示所有可用期数，支持快速切换
- **期数统计**: 显示当期参与达人数、总投入、总互动数、已完成作品数
- **达人列表**: 按期数显示参与的达人及其详细信息

### 2. 添加达人到期数

通过 `AddDarenToPeriodDialog` 组件实现：

#### 达人选择
- 搜索现有达人（按昵称或小红书ID）
- 自动过滤已参与当前期数的达人
- 显示达人基本信息和历史参与期数

#### 期数信息填写
- **基本信息**:
  - 报价（元）
  - 合作方式（探店/种草/直播/图文/视频）
  - 联系人

- **合作进度**:
  - 已联系
  - 已入群
  - 已到店
  - 已审核
  - 已发布

- **时间记录**:
  - 到店时间（日期时间选择器）

- **作品链接**:
  - 主发布链接
  - 同步发布链接

- **作品数据**:
  - 曝光数
  - 阅读数
  - 点赞数
  - 评论数
  - 收藏数
  - 转发数

- **备注**:
  - 期数备注（多行文本）

### 3. 编辑期数数据

通过 `EditPeriodDataDialog` 组件实现：

- 支持修改达人在指定期数的所有信息
- 表单预填充现有数据
- 实时保存更新

### 4. 期数数据展示

在期数管理页面的表格中显示：

| 列名 | 说明 |
|------|------|
| 达人信息 | 昵称、小红书ID、IP位置 |
| 当期报价 | 本期合作费用 |
| 当期状态 | 合作进度状态徽章 |
| 到店时间 | 具体到店日期和时间 |
| 作品链接 | 主发布和同步发布链接 |
| 曝光数 | 作品曝光量 |
| 阅读数 | 作品阅读量 |
| 点赞数 | 作品点赞数（红色显示） |
| 评论数 | 作品评论数（蓝色显示） |
| 收藏数 | 作品收藏数（黄色显示） |
| 转发数 | 作品转发数（绿色显示） |
| 操作 | 编辑按钮 |

## 技术实现

### 前端组件

1. **AddDarenToPeriodDialog.tsx**
   - 达人选择和搜索
   - 期数信息表单
   - 数据验证和提交

2. **EditPeriodDataDialog.tsx**
   - 期数数据编辑
   - 表单预填充
   - 数据更新

3. **期数管理页面** (`/app/periods/page.tsx`)
   - 期数选择界面
   - 统计数据展示
   - 达人列表表格
   - 集成添加和编辑功能

### 后端API

1. **期数相关API**:
   - `GET /api/periods` - 获取所有期数
   - `GET /api/periods/:period/darens` - 获取指定期数的达人
   - `GET /api/periods/:period/stats` - 获取期数统计

2. **期数数据管理API**:
   - `POST /api/darens/:id/periods` - 为达人添加期数数据
   - `PUT /api/darens/:id/periods/:period` - 更新达人期数数据
   - `DELETE /api/darens/:id/periods/:period` - 删除达人期数数据

### 数据模型

期数数据存储在达人模型的 `periodData` 数组中，每个期数数据包含：

```javascript
{
  period: String,           // 期数名称
  fee: Number,             // 报价
  cooperationMethod: String, // 合作方式
  contactPerson: String,    // 联系人
  hasConnection: Boolean,   // 是否已联系
  inGroup: Boolean,        // 是否已入群
  arrivedAtStore: Boolean, // 是否已到店
  reviewed: Boolean,       // 是否已审核
  published: Boolean,      // 是否已发布
  storeArrivalTime: Date,  // 到店时间
  mainPublishLink: String, // 主发布链接
  syncPublishLink: String, // 同步发布链接
  exposure: Number,        // 曝光数
  reads: Number,          // 阅读数
  likes: Number,          // 点赞数
  comments: Number,       // 评论数
  collections: Number,    // 收藏数
  forwards: Number,       // 转发数
  periodRemarks: String,  // 期数备注
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 更新时间
}
```

## 使用流程

1. **访问期数管理**: 从主页点击"期数管理"按钮
2. **选择期数**: 在期数选择区域点击要管理的期数
3. **添加达人**: 点击"添加达人到本期"按钮
4. **选择达人**: 在弹窗中搜索并选择要添加的达人
5. **填写信息**: 完善报价、合作方式、进度状态等信息
6. **保存数据**: 提交表单完成添加
7. **编辑数据**: 在表格中点击编辑按钮修改期数数据
8. **查看统计**: 在统计卡片中查看期数整体数据

## 状态管理

合作进度通过以下状态进行跟踪：

1. **待联系** - 初始状态
2. **已联系** - hasConnection = true
3. **已到店** - arrivedAtStore = true
4. **已审核** - reviewed = true
5. **已发布** - published = true

状态通过不同颜色的徽章进行可视化展示。

## 数据统计

期数统计包括：

- **参与达人数**: 当期参与的达人总数
- **总投入**: 所有达人报价的总和
- **总互动数**: 点赞+评论+收藏的总和
- **已完成作品**: 已发布状态的作品数量

这些统计数据实时计算并在页面顶部的卡片中展示。
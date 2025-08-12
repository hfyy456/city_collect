# City Collect Frontend (Next.js)

基于 React + Next.js + Shadcn UI 的现代化达人管理系统前端。

## 技术栈

- **React 18** - 现代化的 React 框架
- **Next.js 14** - 全栈 React 框架
- **TypeScript** - 类型安全的 JavaScript
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Shadcn UI** - 高质量的 React 组件库
- **Lucide React** - 美观的图标库
- **Axios** - HTTP 客户端

## 功能特性

- 📊 **仪表板** - 实时统计数据和关键指标
- 👥 **达人管理** - 完整的 CRUD 操作
- 🔍 **智能搜索** - 多维度搜索和筛选
- 📱 **响应式设计** - 适配各种设备
- 🎨 **现代化 UI** - 基于 Shadcn UI 的精美界面
- 🔗 **自动解析** - 支持小红书链接自动解析
- 📈 **数据可视化** - 直观的数据展示

## 开发环境

### 安装依赖

```bash
# 在项目根目录
yarn install:all

# 或者只安装前端依赖
cd packages/frontend-next
yarn install
```

### 启动开发服务器

```bash
# 在项目根目录，同时启动后端和前端
yarn dev:next

# 或者分别启动
yarn workspace backend start    # 后端 (端口 3000)
yarn workspace frontend-next dev # 前端 (端口 3001)
```

### 构建生产版本

```bash
yarn build:next
```

### 启动生产服务器

```bash
yarn start:next
```

## 项目结构

```
packages/frontend-next/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── globals.css     # 全局样式
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 首页
│   ├── components/         # React 组件
│   │   ├── ui/            # Shadcn UI 组件
│   │   └── AddDarenDialog.tsx # 自定义组件
│   └── lib/               # 工具库
│       ├── api.ts         # API 接口
│       └── utils.ts       # 工具函数
├── package.json           # 依赖配置
├── tailwind.config.js     # Tailwind 配置
├── tsconfig.json          # TypeScript 配置
└── next.config.js         # Next.js 配置
```

## API 集成

前端通过 `/lib/api.ts` 与后端 API 集成，支持：

- 达人 CRUD 操作
- 期数维度管理
- 作品数据管理
- 数据分析和统计
- 小红书链接解析

## 组件说明

### UI 组件 (`/components/ui/`)

基于 Shadcn UI 的可复用组件：
- `Button` - 按钮组件
- `Card` - 卡片组件
- `Input` - 输入框组件
- `Table` - 表格组件
- `Dialog` - 对话框组件
- `Badge` - 标签组件

### 业务组件

- `AddDarenDialog` - 添加达人对话框，支持手动输入和链接解析

## 开发指南

### 添加新页面

1. 在 `src/app/` 下创建新的路由文件夹
2. 添加 `page.tsx` 文件
3. 使用 TypeScript 和 Tailwind CSS

### 添加新组件

1. 在 `src/components/` 下创建组件文件
2. 使用 TypeScript 接口定义 props
3. 遵循 Shadcn UI 的设计规范

### API 调用

```typescript
import { darenApi } from '@/lib/api'

// 获取达人列表
const darens = await darenApi.list({ page: 1, limit: 20 })

// 创建新达人
const newDaren = await darenApi.create(darenData)
```

## 环境配置

### 开发环境

- 前端端口：3001
- 后端端口：3000
- API 代理：通过 Next.js rewrites 配置

### 生产环境

需要配置正确的 API 基础 URL。

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request
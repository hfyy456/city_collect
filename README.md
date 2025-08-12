# City Collect - 达人管理系统

基于 Node.js + Fastify + MongoDB 后端和 React + Next.js 前端的小红书达人管理系统。

## 项目结构

```
city-collect/
├── packages/
│   ├── backend/           # Fastify 后端服务
│   └── frontend-next/     # Next.js 前端应用
├── package.json           # 根工作区配置
├── yarn.lock             # Yarn 锁定文件
└── .yarnrc.yml           # Yarn 配置
```

## 技术栈

### 后端
- **Node.js** + **Fastify** - 高性能 Web 框架
- **MongoDB** + **Mongoose** - 数据库和 ODM
- **Cheerio** + **Puppeteer** - 网页抓取
- **Axios** - HTTP 客户端

### 前端
- **React 18** + **Next.js 14** - 现代化前端框架
- **TypeScript** - 类型安全
- **Tailwind CSS** + **Shadcn UI** - 样式和组件库
- **Axios** - API 客户端

## 快速开始

### 1. 安装依赖

```bash
# 使用 Yarn 安装所有工作区依赖
yarn install
```

### 2. 启动开发环境

```bash
# 同时启动后端和前端服务
yarn dev:next

# 或分别启动
yarn workspace backend start      # 后端 (端口 3000)
yarn workspace frontend-next dev  # 前端 (端口 3001)
```

### 3. 访问应用

- 前端应用: http://localhost:3001
- 后端 API: http://localhost:3000/api

## 开发命令

### 根目录命令
```bash
yarn dev:next          # 启动完整开发环境
yarn build:next         # 构建前端生产版本
yarn start:next         # 启动生产环境
yarn install:all        # 安装所有依赖
```

### 工作区命令
```bash
# 后端
yarn workspace backend start
yarn workspace backend add <package>

# 前端
yarn workspace frontend-next dev
yarn workspace frontend-next build
yarn workspace frontend-next add <package>
```

## 功能特性

- 📊 **达人数据管理** - 完整的达人信息 CRUD 操作
- 🔍 **智能搜索** - 多维度搜索和筛选功能
- 🔗 **链接解析** - 自动解析小红书用户和笔记信息
- 📈 **数据分析** - 期数统计和性能分析
- 📱 **响应式设计** - 适配各种设备屏幕
- 🎨 **现代化 UI** - 基于 Shadcn UI 的美观界面

## 环境要求

- Node.js >= 16
- MongoDB >= 4.4
- Yarn >= 1.22

## 部署

### 开发环境
```bash
yarn dev:next
```

### 生产环境
```bash
yarn build:next
yarn start:next
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 ISC 许可证。
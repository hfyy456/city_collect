# 启动开发环境

## 方式一：使用根目录脚本（推荐）

```bash
# 在项目根目录
yarn dev:next
```

这会同时启动：
- 后端服务器 (http://localhost:3000)
- Next.js 前端 (http://localhost:3001)

## 方式二：分别启动

### 启动后端
```bash
cd packages/backend
npm start
```

### 启动前端
```bash
cd packages/frontend-next
npm run dev
```

## 访问地址

- 前端界面：http://localhost:3001
- 后端API：http://localhost:3000/api

## 功能测试

1. **查看达人列表** - 主页显示所有达人数据
2. **添加达人** - 点击"添加达人"按钮
3. **搜索功能** - 使用搜索框搜索达人
4. **小红书解析** - 在添加达人时输入小红书链接自动解析

## 注意事项

- 确保 MongoDB 服务正在运行
- 后端服务必须先启动
- 前端会自动代理 API 请求到后端
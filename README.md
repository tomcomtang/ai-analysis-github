# AI GitHub Analysis Tool

一个基于 Next.js 的现代化 GitHub 仓库分析工具，支持多条件搜索、实时进度显示和分页浏览。

## ✨ 功能特性

### 🔍 智能搜索
- **多标签关键词搜索**：支持输入多个关键词，按回车添加标签
- **多选语言筛选**：40+ 种编程语言的下拉多选
- **Star 数筛选**：支持自定义 Star 数量条件
- **实时搜索进度**：4个阶段的进度指示器

### 📊 结果展示
- **作者信息**：显示仓库作者头像和用户名
- **分页浏览**：每页显示5条记录，支持翻页
- **详情弹窗**：点击查看完整仓库信息
- **响应式设计**：适配各种屏幕尺寸

### 🎨 视觉设计
- **深色主题**：现代化黑色背景配合网格纹理
- **翠绿色配色**：清新活力的绿色主题
- **流畅动画**：悬停效果和过渡动画
- **组件化架构**：清晰的代码结构

## 🚀 快速开始

### 环境要求
- Node.js 18+ 
- npm 或 yarn

### 安装依赖
```bash
npm install
# 或
yarn install
```

### 环境配置
创建 `.env.local` 文件：
```env
GITHUB_TOKEN=your_github_token_here
```

> **注意**：虽然不设置 token 也能使用，但建议设置 GitHub token 以提高 API 请求限制。

### 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🛠️ 技术栈

- **框架**：Next.js 14 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **状态管理**：React Hooks
- **API**：GitHub REST API
- **实时通信**：Server-Sent Events (SSE)

## 📁 项目结构

```
├── app/
│   ├── api/search/route.ts    # GitHub API 搜索接口
│   ├── globals.css            # 全局样式
│   ├── layout.tsx             # 根布局
│   └── page.tsx               # 主页面
├── components/
│   ├── SearchForm.tsx         # 搜索表单组件
│   ├── ResultsTable.tsx       # 结果表格组件
│   └── StageBar.tsx           # 进度指示器组件
├── package.json
└── README.md
```

## 🔧 核心功能

### 搜索流程
1. **配置搜索条件**：选择语言、设置 Star 数、输入关键词
2. **开始搜索**：点击"开始分析"按钮
3. **实时进度**：查看搜索、分析、输出阶段
4. **浏览结果**：分页查看搜索结果，点击详情查看完整信息

### API 特性
- **分页请求**：自动获取最多 1000 条记录
- **流式传输**：实时显示搜索结果
- **错误处理**：网络异常自动重试
- **速率限制**：支持 GitHub API 速率限制

## 🎯 使用场景

- **技术调研**：快速找到特定技术栈的开源项目
- **学习参考**：发现高质量的学习资源
- **项目发现**：探索热门和新兴的开源项目
- **趋势分析**：了解不同编程语言的使用情况

## 📝 开发说明

### 添加新语言
在 `components/SearchForm.tsx` 中的 `LANGUAGES` 数组添加新语言。

### 自定义主题
修改 `app/globals.css` 中的 CSS 变量和 Tailwind 配置。

### 扩展功能
- 添加更多筛选条件
- 支持收藏功能
- 导出搜索结果
- 添加数据可视化

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**享受探索 GitHub 的乐趣！** 🚀

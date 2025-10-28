# AI 换衣空间

一个基于 Vue 3 + Vite + TypeScript 的 AI 换衣应用，支持上传两张图片并将第二张图片的衣服换到第一张图片上。

## 功能特性

- 🎨 **清亮主题设计** - 现代化的界面设计，支持明暗主题切换
- 📸 **双图片上传** - 支持拖拽和点击上传人物图像和服装图像
- 🎭 **多种艺术风格** - 支持10种不同风格：原图、素描、Q版、卡通、油画、水彩、二次元、像素风、赛博朋克、国风
- 🔄 **AI 换衣处理** - 集成 AI 服务进行智能换衣
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 💾 **结果下载** - 支持一键下载换衣结果
- ⚡ **实时反馈** - 提供成功/错误消息提示
- 🧹 **一键清除** - 快速清除所有上传和生成的内容

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 快速的前端构建工具
- **TypeScript** - 类型安全的 JavaScript
- **Pinia** - Vue 状态管理
- **Vue Router** - 官方路由管理器
- **Lucide Vue Next** - 现代化图标库
- **VueUse** - Vue 组合式 API 工具集

## 项目结构

```
src/
├── services/
│   └── aiService.ts          # AI 换衣服务
├── views/
│   └── HomeView.vue          # 主页面组件
├── App.vue                   # 根组件
├── main.ts                   # 应用入口
├── router/
│   └── index.ts              # 路由配置
└── style.css                 # 全局样式
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 使用说明

1. **上传人物图像** - 点击或拖拽上传包含人物的图片
2. **上传服装图像** - 点击或拖拽上传包含服装的图片
3. **选择宽高比** - 根据需要选择 1:1、3:4 或 9:16 比例
4. **开始换衣** - 点击"开始换衣"按钮进行 AI 处理
5. **下载结果** - 处理完成后可下载换衣结果

## AI 服务集成

项目中的 `aiService.ts` 提供了 AI 换衣服务的接口，您需要：

1. 替换 `simulateChangeClothes` 方法为实际的 AI API 调用
2. 根据您的 AI 服务提供商调整请求和响应格式
3. 添加必要的 API 密钥和认证逻辑

## 自定义配置

### 主题定制

在 `App.vue` 中修改 CSS 变量来自定义主题色彩：

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #22c55e;
  --error-color: #ef4444;
}
```

### 图像限制

在 `aiService.ts` 中调整图像验证规则：

```typescript
const maxSizeInMB = 10; // 最大文件大小
const allowedFormats = ['image/jpeg', 'image/png']; // 允许的格式
```

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 许可证

MIT License
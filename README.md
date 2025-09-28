# 🎨 Image Studio - 您的 AI 视觉创作套件

[![一键部署到Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/milan-chen/image-studio&repository-name=image-studio)

[![语言](https://img.shields.io/badge/language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![框架](https://img.shields.io/badge/framework-React-cyan.svg)](https://reactjs.org/)
[![API](https://img.shields.io/badge/API-OpenAI-4B9AE5.svg)](https://platform.openai.com/docs)

从文字到杰作，从静态到动态。Image Studio 是您的终极 AI 视觉创作套件，集图解、绘画、编辑和视频生成于一体。释放想象，创造非凡。

## ✨ 功能亮点

Image Studio 整合了 OpenAI 最新的多模态能力，提供了一个功能丰富、流程顺畅的视觉内容创作平台。

-   **图解百科 (Illustrated Wiki)**: 将复杂的概念或问题，通过 AI 自动生成一系列图文并茂的解说卡片，让知识更易于理解（基于 `gpt-image-1` 批量生成）。
-   **连环画本 (Comic Strip)**: 输入故事脚本，即可一键生成拥有统一艺术风格的多格连环画，并自动产出视频分镜脚本（基于 `gpt-4.1-mini` + `gpt-image-1`）。
-   **无限画布 (Infinite Canvas)**: 打破画幅限制！上传一张图片作为起点，向任意方向拖拽，AI 将为您无缝地向外延展（Outpainting）画面，创造宏大的视觉场景。
-   **以文生图 (Text-to-Image)**: 强大的文生图功能，内置“灵感词库”帮助您构建更专业、效果更惊艳的提示词，将想象力精准转化为高质量图像。
-   **以图生图 (Image-to-Image)**:
    -   **编辑创作**: 上传图片并结合文本指令，对画面内容进行修改或二次创作。
    -   **灵感启发**: 上传一张参考图，借鉴其独特的艺术风格，生成一个全新主题的图像。
    -   **局部重绘 (Inpainting)**: 在任意图片上涂抹蒙版，并用文字描述您想看到的内容，AI 将智能地重绘该区域。
-   **图生视频 (Image-to-Video)**: 功能界面仍保留，但当前 OpenAI 官方暂未提供等效的视频生成接口，因此会提示暂不支持。
-   **历史记录 (History)**: 所有生成的内容都会被自动保存在本地，支持全文搜索、标签管理、收藏等功能，方便您随时回顾和继续创作。
-   **数据导入导出 (Import/Export)**: 支持将所有创作数据导出为 JSON 文件，便于备份或在不同设备间同步。同样支持从 JSON 文件导入数据，实现跨设备无缝迁移。
-   **一键部署 (Deploy)**: 点击上方部署按钮，即可快速部署到Vercel体验。

## 🧠 使用的 AI 模型

本应用深度集成了 OpenAI 的多模态模型，各司其职，协同创作：

| 功能模块 | 使用模型 | 主要职责 |
| :--- | :--- | :--- |
| **文本理解 & 脚本生成** | `gpt-4.1-mini` | 分析故事、生成连环画的每格提示词、产出分镜脚本等文本任务。 |
| **核心图像生成** | `gpt-image-1` | 高质量的文生图，用于“图解百科”、“以文生图”和“连环画本”的画面绘制。 |
| **图像编辑 & 多模态** | `gpt-image-1` | 负责“以图生图”的编辑、风格启发、“无限画布”的延展和所有局部重绘任务。 |
| **视频生成** | 暂不支持 | OpenAI 当前未提供等效接口，应用将提示功能不可用。 |

## 🛠️ 技术栈

-   **前端框架**: React
-   **语言**: TypeScript
-   **样式**: Tailwind CSS
-   **AI 服务**: OpenAI API (`openai`)
-   **客户端视频处理**: FFmpeg.wasm (用于视频拼接)
-   **本地存储**: IndexedDB (用于历史记录)

## 🚀 运行项目

本项目是一个纯前端应用，可以直接在现代浏览器中运行。

### 配置 API Key

您可以通过以下两种方式配置 OpenAI API Key（需要启用付费帐户或拥有有效额度）：

#### 方法一：使用环境变量（推荐用于开发/测试环境）

1. 复制 `.env.local` 文件：
   ```bash
   cp .env.local.example .env.local
   ```

2. 在 `.env.local` 文件中设置您的 API Key：
   ```
   VITE_OPENAI_API_KEY=your_actual_api_key_here
   # 可选：若使用第三方兼容端点，请同时设置 Base URL（例如：https://your-endpoint.com/v1）
   VITE_OPENAI_BASE_URL=https://your-endpoint.com/v1
   # 可选：预设默认图像模型 ID（不填则使用 gpt-image-1）
   VITE_OPENAI_IMAGE_MODEL=gpt-image-1
   ```

#### 方法二：在应用界面中设置

1. 获取 OpenAI API Key:
   您需要一个 OpenAI API Key 才能使用本应用。可以前往 [OpenAI 控制台](https://platform.openai.com/api-keys) 获取。

2. 配置 API Key:
   应用首次启动或在需要时，会弹出一个对话框，要求您输入 API Key、可选的 Base URL，并允许从接口加载可用的图像模型列表进行选择。您的配置会被保存在浏览器的本地存储 (Local Storage) 中，仅用于您本地的请求，不会上传到任何服务器。

### 启动应用

```bash
npm run dev
```

应用将在 `http://localhost:5173` 上运行。

### 数据导入导出

为了方便用户备份创作数据或在不同设备间同步，Image Studio 提供了数据导入导出功能：

1. **导出数据**：
   - 点击应用顶部导航栏的导入导出按钮（向下箭头图标）
   - 选择"导出数据"选项卡
   - 点击"生成导出数据"按钮
   - 点击"下载导出文件"保存 JSON 格式的备份文件

2. **导入数据**：
   - 点击应用顶部导航栏的导入导出按钮（向下箭头图标）
   - 选择"导入数据"选项卡
   - 点击"选择导入文件"并选择之前导出的 JSON 文件
   - 确认导入操作（注意：导入将替换当前所有数据）

---

祝您创作愉快！

# Image Studio - AI 视觉创作套件

Image Studio 是一个强大的 AI 视觉内容创作平台，集成了文字生图、图生图、图解百科和连环画等功能，帮助您释放想象力，创造非凡的视觉作品。

## ✨ 核心特点

*   **多功能一体**: 整合图解、绘画、编辑和视频生成（部分功能依赖未来 API 支持）。
*   **支持 OpenAI 兼容 API**: 除了官方 OpenAI API 外，应用还支持配置第三方兼容的 Base URL，允许用户连接到其他提供 OpenAI 格式接口的服务端点（如在 `.env.local` 或应用界面中配置 `VITE_OPENAI_BASE_URL`）。
*   **创作功能**:
    *   图解百科 (Illustrated Wiki)：将复杂概念转化为图文解说卡片。
    *   连环画本 (Comic Strip)：一键生成具有统一风格的多格连环画。
    *   无限画布 (Infinite Canvas)：无缝向外延展画面（Outpainting）。
    *   局部重绘 (Inpainting)：智能重绘图片特定区域。
    *   文本生图 (Text-to-Image) / 图像编辑 (Image-to-Image)。
*   **本地数据管理**: 所有历史记录和创作内容自动保存在本地，支持搜索、标签和数据导入导出。

## 感谢

本项目基于 [milan-chen/image-studio](https://github.com/milan-chen/image-studio) 仓库进行开发。衷心感谢原作者的杰出贡献。

## 🚀 启动与配置

这是一个纯前端应用，您可以轻松部署和运行：

1.  **配置 API Key**:
    *   在应用启动后，通过界面弹窗输入您的 **OpenAI API Key**。
    *   如果需要使用第三方服务，您也可以在界面中配置可选的 **Base URL**。
    *   （可选）在本地开发时，可以通过复制 `.env.local.example` 为 `.env.local` 文件来配置 `VITE_OPENAI_API_KEY` 和 `VITE_OPENAI_BASE_URL`。

2.  **启动项目**:
    ```bash
    npm install
    npm run dev
    ```

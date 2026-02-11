<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ams92iy_R-ny5j6_mwiyWNxmnKzeGJPR

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies: `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app: `npm run dev`

---

## 本地部署指南（零基础版）

按下面步骤即可在你自己电脑上运行 MindRefine。

### 第一步：安装 Node.js

1. 打开 [Node.js 官网](https://nodejs.org/)（选左侧 **LTS** 版本）。
2. 下载并安装，安装时一路「下一步」即可。
3. 安装完成后，按 `Win + R` 输入 `cmd` 回车，在黑色窗口里输入：
   ```bash
   node -v
   ```
   若显示类似 `v20.x.x` 就说明安装成功。

### 第二步：安装项目依赖

1. 在资源管理器中进入项目文件夹：`mindrefine`。
2. 在文件夹空白处按住 **Shift** 再点右键，选择「在此处打开 PowerShell 窗口」。
3. 在打开的窗口里输入并回车：
   ```bash
   npm install
   ```
   等待安装完成（可能需要一两分钟）。

### 第三步：配置 Gemini API 密钥

1. 在项目文件夹里找到 `.env.example`，复制一份并改名为 **`.env.local`**（注意前面有个点）。
2. 用记事本打开 `.env.local`，把 `你的API密钥` 换成你在 [Google AI Studio](https://aistudio.google.com/apikey) 获取的 API Key（免费可申请）。
3. 保存并关闭。

### 第四步：运行项目

在同一个 PowerShell 窗口里输入：

```bash
npm run dev
```

看到类似 `Local: http://localhost:3000/` 后，用浏览器打开 **http://localhost:3000** 即可使用。

---

### 打包成可本地运行的文件（可选）

如果想把项目「打包」成一批文件，以后不用再开 `npm run dev` 也能在本地打开：

1. 在项目文件夹的 PowerShell 里执行：
   ```bash
   npm run build
   ```
2. 完成后会多出一个 **`dist`** 文件夹，里面就是打包好的网站文件。
3. 在 PowerShell 里执行：
   ```bash
   npm run preview
   ```
   然后打开提示里的地址（一般是 http://localhost:4173）即可本地预览。

若想用双击打开：把 `dist` 里的 **所有文件** 复制到一个新文件夹，然后双击其中的 **`index.html`** 用浏览器打开。注意：部分功能需要通过网络请求 Gemini API，若完全离线可能无法使用。

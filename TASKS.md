# TASKS.md - 浏览器翻译插件（双语对照）

## 项目信息
- **项目名称**: Browser Translator (双语对照翻译插件)
- **项目路径**: `~/Desktop/coding/projects/2026-03-27-browser-translator/`
- **创建日期**: 2026-03-27
- **状态**: 规划中

## 技术栈
- Chrome Extension Manifest V3
- JavaScript (content script + background + popup)
- Google Translate API (免费)
- DeepL API (用户有 Key)
- HTML/CSS (设置页面)

## 任务拆解

### 任务1：Chrome Extension 基础框架搭建
**预计时间**: 30-45 分钟

**输入**: 无

**输出**:
- `manifest.json` - 扩展配置文件
- `background.js` - 后台服务 worker
- `popup.html` + `popup.js` + `popup.css` - 右上角弹窗
- `content.js` - 内容脚本（空壳）
- `icons/` 目录 + 图标文件

**验收标准**:
- [ ] 扩展可以加载到 Chrome (chrome://extensions/ → 开发者模式 → 加载已解压的扩展程序)
- [ ] 点击右上角图标显示 popup 弹窗
- [ ] popup 中有"整页翻译"和"选中翻译"两个按钮
- [ ] 按钮点击后在 console 打印对应日志

---

### 任务2：Google Translate 翻译模块
**预计时间**: 45-60 分钟

**输入**: 任务1的基础框架

**输出**:
- `translator.js` - 翻译模块
- 支持 Google Translate 免费 API (translate.googleapis.com)
- 支持文本分段（处理长文本）

**验收标准**:
- [ ] `translateText(text, targetLang)` 函数可用
- [ ] 输入英文返回中文翻译
- [ ] 输入日文返回中文翻译
- [ ] 处理 5000 字符以内的文本不报错
- [ ] 有错误处理（网络失败、API 限制等）

---

### 任务3：DeepL API 翻译模块 + 设置页面
**预计时间**: 45-60 分钟

**输入**: 任务1的基础框架

**输出**:
- `options.html` + `options.js` + `options.css` - 设置页面
- DeepL API 翻译函数
- `chrome.storage.sync` 存储 API Key

**验收标准**:
- [ ] 设置页面可配置：翻译引擎选择（Google/DeepL）
- [ ] 选择 DeepL 时显示 API Key 输入框
- [ ] API Key 加密存储（至少 base64）
- [ ] DeepL 翻译函数可用，返回格式与 Google 一致
- [ ] 设置页面有"测试连接"按钮，验证 API Key 有效

---

### 任务4：页面内容提取与双语渲染
**预计时间**: 60 分钟

**输入**: 任务2或任务3的翻译模块

**输出**:
- `content.js` - 完整的内容脚本
- 整页翻译：提取正文段落，双语对照显示
- 选中翻译：划词后悬浮按钮，翻译选中内容

**验收标准**:
- [ ] 整页翻译：识别页面主要文本内容（排除导航、广告等）
- [ ] 原文在上，中文在下，样式区分（原文灰色/斜体，中文黑色）
- [ ] 选中翻译：鼠标划选文本后显示悬浮翻译按钮
- [ ] 点击悬浮按钮，在选中文本下方插入翻译结果
- [ ] 翻译结果有关闭按钮

---

### 任务5：UI 优化与打包
**预计时间**: 30-45 分钟

**输入**: 前4个任务的完整代码

**输出**:
- 优化后的所有文件
- `README.md` - 使用说明
- `browser-translator.zip` - 打包文件

**验收标准**:
- [ ] popup UI 美观，有加载状态
- [ ] 翻译结果样式美观，不破坏原页面布局
- [ ] 支持一键恢复原页面
- [ ] README 包含：安装方法、使用说明、配置说明
- [ ] zip 文件可直接导入 Chrome

---

## 依赖关系

```
任务1 (基础框架)
    ↓
任务2 (Google翻译) ─┐
                   ├──→ 任务4 (内容渲染)
任务3 (DeepL+设置) ─┘
    ↓
任务5 (优化打包)
```

## 当前状态

| 任务 | 状态 | 负责人 | 备注 |
|------|------|--------|------|
| 任务1 | ✅ 已完成 | @FattyCodeBot | 2026-03-27 验收通过 |
| 任务2 | 🔄 进行中 | @FattyCodeBot | 已发送 |
| 任务3 | ⏳ 待开始 | @FattyCodeBot | 依赖任务1 |
| 任务4 | ⏳ 待开始 | @FattyCodeBot | 依赖任务2+3 |
| 任务5 | ⏳ 待开始 | @FattyCodeBot | 依赖任务4 |

---

## 项目2 任务规划（待项目1完成后）

见: `../2026-03-27-video-subtitle/TASKS.md`

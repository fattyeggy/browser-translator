# 双语翻译助手 - Chrome 浏览器扩展 🌐

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-%234285F4?logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore) 
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-%234285F4)](https://developer.chrome.com/docs/extensions/mv3/) 
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

一个智能、美观的双语对照翻译浏览器扩展，支持整页翻译和选中翻译两种模式，提供 Google Translate 和 DeepL 两种翻译引擎。

## ✨ 核心特性

### 🔄 智能翻译模式
- **整页翻译**：一键智能提取页面正文内容，排除导航、广告等干扰
- **选中翻译**：选中任意文本，点击悬浮按钮即时翻译
- **双语对照**：原文（灰色斜体）+ 译文（黑色正常）清晰对照显示

### 🎨 优雅的用户体验
- **悬浮翻译按钮**：跟随选中文本，美观流畅
- **进度指示器**：实时显示翻译进度，避免等待焦虑
- **一键恢复**：右下角恢复按钮，随时还原页面原样
- **暗色模式**：自动适配系统暗色主题

### ⚙️ 灵活配置
- **双引擎支持**：Google Translate（免费）或 DeepL（高精度）
- **多语言**：支持20+种语言互译
- **智能设置**：翻译延迟、最大字符数、显示偏好等

## 📦 安装方法

### 方法一：开发者模式安装（推荐）
1. **下载扩展包**：[browser-translator.zip](browser-translator.zip)
2. **解压文件**：解压到任意目录（如 `~/Desktop/browser-translator/`）
3. **打开 Chrome**：访问 `chrome://extensions/`
4. **开启开发者模式**：点击右上角开关
5. **加载扩展**：点击"加载已解压的扩展程序"，选择解压后的目录
6. **完成**：右上角出现翻译图标 🎉

### 方法二：从源代码构建
```bash
# 克隆项目
git clone <repository-url>
cd browser-translator

# 安装依赖（无需特殊依赖）
# 直接加载到 Chrome
```

## 🚀 快速开始

### 第一步：基本使用
1. **打开任意网页**（如英文新闻网站）
2. **点击扩展图标** → 弹出控制面板
3. **选择目标语言**（默认：简体中文）
4. **点击"翻译整页"** → 自动提取并翻译正文

### 第二步：高级功能
- **划词翻译**：选中文本 → 点击悬浮按钮 🌐
- **翻译设置**：点击扩展图标 → "扩展设置"
- **引擎切换**：设置页面选择 Google 或 DeepL
- **DeepL配置**：需要API密钥（免费版每月50万字符）

## ⚙️ 详细配置

### 翻译引擎选择
| 引擎 | 特点 | 是否需要API | 适用场景 |
|------|------|-------------|----------|
| **Google Translate** | 免费、速度快、支持语言多 | ❌ 不需要 | 日常使用、轻度翻译 |
| **DeepL** | 翻译质量高、自然流畅 | ✅ 需要密钥 | 专业文档、重要内容 |

### DeepL API 密钥获取
1. 访问 [DeepL Pro API](https://www.deepl.com/pro-api)
2. 注册免费账户（无需信用卡）
3. 在控制台获取 API 密钥
4. 粘贴到扩展设置页面
5. 点击"测试连接"验证

### 性能设置建议
| 设置项 | 推荐值 | 说明 |
|--------|--------|------|
| 翻译延迟 | 500ms | 避免 API 请求过于频繁 |
| 最大字符数 | 5000 | 单次翻译上限，防止超限 |
| 自动检测语言 | ✅ 开启 | 自动识别源语言 |
| 始终显示原文 | ✅ 开启 | 双语对照，便于对比 |

## 🎯 使用场景

### 📚 学习阅读
- **英文技术文档** → 中文对照，快速理解
- **外语新闻** → 母语翻译，掌握时事
- **学术论文** → 专业术语准确翻译

### 💼 工作场景
- **海外网站** → 快速了解产品信息
- **外文邮件** → 即时翻译沟通
- **技术博客** → 学习最新技术趋势

### 🌍 日常浏览
- **旅游网站** → 了解当地信息
- **购物平台** → 看懂商品描述
- **社交媒体** → 跨越语言障碍

## 📁 项目结构

```
browser-translator/
├── manifest.json          # 扩展配置文件 (Manifest V3)
├── background.js          # 后台服务脚本 (Service Worker)
├── content.js            # 内容脚本 - 核心翻译功能
├── content.css           # 内容样式 - 双语界面
├── popup.html            # 弹出窗口界面
├── popup.css             # 弹出窗口样式
├── popup.js              # 弹出窗口逻辑
├── options.html          # 设置页面
├── options.js            # 设置页面逻辑
├── translator.js         # 翻译引擎模块
├── icons/                # 扩展图标
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # 本文档
```

## 🔧 技术架构

### 核心模块
```javascript
// 1. 内容提取模块
extractPageContent()      // 智能提取正文，排除干扰

// 2. 翻译引擎模块
GoogleTranslator          // Google Translate API
DeepLTranslator          // DeepL API（支持验证）

// 3. 渲染模块
renderBilingualTranslation() // 双语对照渲染

// 4. 状态管理
state.originalElements   // 保存原始元素，支持恢复
```

### 通信流程
```
用户点击 → popup.js → 发送消息 → content.js
                                   ↓
                           提取页面内容 → 分段翻译
                                   ↓
                           双语渲染 → 更新进度
```

## ❓ 常见问题 FAQ

### Q: 翻译按钮点击后没反应？
**A**: 刷新页面后重试。某些页面可能限制了扩展脚本执行。

### Q: 为什么有些内容没有被翻译？
**A**: 扩展智能过滤导航、广告、侧边栏等内容，只翻译正文。如需翻译特定内容，请使用"选中翻译"。

### Q: DeepL 翻译提示 API 密钥无效？
**A**: 
1. 确认密钥是否正确复制
2. 访问 DeepL 控制台确认密钥状态
3. 免费版每月限制 500,000 字符，可能已用完

### Q: 翻译速度慢怎么办？
**A**: 
1. 尝试切换到 Google Translate
2. 减少"翻译延迟"设置（但可能触发限流）
3. 检查网络连接

### Q: 如何完全卸载扩展？
**A**: 
1. `chrome://extensions/` → 找到"双语翻译助手"
2. 点击"移除"
3. 如需清除数据：点击"详细信息" → "清除数据"

## 🛠️ 开发指南

### 环境要求
- Chrome 88+（支持 Manifest V3）
- Node.js（仅用于测试）
- 代码编辑器（VSCode 推荐）

### 构建与测试
```bash
# 运行单元测试
node test-translator.js

# 验证扩展结构
python3 verify_setup.py

# 打包发布
./build.sh
```

### 扩展权限说明
| 权限 | 用途 | 必要性 |
|------|------|--------|
| `storage` | 保存用户设置 | ✅ 必需 |
| `activeTab` | 获取当前标签页 | ✅ 必需 |
| `scripting` | 注入内容脚本 | ✅ 必需 |
| `https://translate.googleapis.com/*` | Google 翻译 API | Google 引擎需要 |
| `<all_urls>` | 匹配所有网页 | ✅ 必需 |

## 📄 许可证

MIT License © 2026 双语翻译助手

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！
1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📞 支持与反馈

- **功能建议**：通过 Issue 提交
- **Bug 报告**：提供复现步骤和截图
- **使用问题**：先查看 FAQ 部分

---

**开始您的双语浏览体验吧！** 🌍➡️🇨🇳

> 提示：首次使用建议先在设置页面配置翻译引擎和语言偏好。
#!/bin/bash
# 双语翻译助手 - 扩展打包脚本

set -e  # 遇到错误立即退出

echo "🔧 双语翻译助手 - 开始打包..."

# 项目信息
PROJECT_NAME="browser-translator"
VERSION="1.0.0"
BUILD_DIR="./build"
DIST_DIR="./dist"
ZIP_FILE="${DIST_DIR}/${PROJECT_NAME}-v${VERSION}.zip"

# 清理构建目录
echo "🧹 清理构建目录..."
rm -rf "${BUILD_DIR}" "${DIST_DIR}" 2>/dev/null || true
mkdir -p "${BUILD_DIR}" "${DIST_DIR}"

# 必需文件列表
ESSENTIAL_FILES=(
    "manifest.json"
    "background.js"
    "content.js"
    "content.css"
    "popup.html"
    "popup.css"
    "popup.js"
    "options.html"
    "options.js"
    "translator.js"
    "README.md"
)

# 图标文件
ICON_FILES=(
    "icons/icon16.png"
    "icons/icon32.png"
    "icons/icon48.png"
    "icons/icon128.png"
)

# 复制必需文件
echo "📄 复制核心文件..."
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "${BUILD_DIR}/"
        echo "  ✓ $file"
    else
        echo "  ✗ $file (缺失)"
        exit 1
    fi
done

# 复制图标文件
echo "🖼️  复制图标文件..."
mkdir -p "${BUILD_DIR}/icons"
for icon in "${ICON_FILES[@]}"; do
    if [ -f "$icon" ]; then
        cp "$icon" "${BUILD_DIR}/icons/"
        echo "  ✓ $icon"
    else
        echo "  ✗ $icon (缺失)"
        exit 1
    fi
done

# 创建版本文件
echo "📝 创建版本信息..."
cat > "${BUILD_DIR}/VERSION.md" << EOF
# 双语翻译助手

## 版本信息
- 版本: ${VERSION}
- 打包时间: $(date '+%Y-%m-%d %H:%M:%S')
- 构建环境: $(uname -s -m)
- Chrome 扩展: Manifest V3

## 文件清单
$(cd "${BUILD_DIR}" && find . -type f | sort)

## 安装说明
1. 解压此压缩包
2. 打开 Chrome: chrome://extensions/
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择解压后的目录

## 注意事项
- 需要 Chrome 88+ 版本
- 部分 Chrome 特殊页面不支持扩展
- 首次使用需在设置页面配置
EOF

# 验证扩展完整性
echo "🔍 验证扩展完整性..."
cd "${BUILD_DIR}"
if python3 ../verify_setup.py 2>/dev/null; then
    echo "  ✅ 扩展验证通过"
else
    echo "  ❌ 扩展验证失败"
    exit 1
fi
cd ..

# 创建 ZIP 文件
echo "📦 创建压缩包..."
cd "${BUILD_DIR}"
zip -r "../${ZIP_FILE}" . > /dev/null
cd ..

# 计算文件大小
FILE_SIZE=$(du -h "${ZIP_FILE}" | cut -f1)

echo ""
echo "🎉 打包完成！"
echo "=========================================="
echo "📁 项目名称: 双语翻译助手"
echo "🏷️  版本号: v${VERSION}"
echo "📦 输出文件: ${ZIP_FILE}"
echo "📏 文件大小: ${FILE_SIZE}"
echo "📄 包含文件: $(find "${BUILD_DIR}" -type f | wc -l) 个"
echo "=========================================="
echo ""
echo "📋 安装说明:"
echo "1. 解压 ${ZIP_FILE##*/}"
echo "2. 打开 Chrome → chrome://extensions/"
echo "3. 开启'开发者模式'"
echo "4. 点击'加载已解压的扩展程序'"
echo "5. 选择解压后的目录"
echo ""
echo "🚀 开始您的双语浏览体验吧！"

# 创建符号链接方便访问
ln -sf "${ZIP_FILE}" "./${PROJECT_NAME}.zip" 2>/dev/null || true
echo ""
echo "🔗 快捷链接: ./${PROJECT_NAME}.zip"
#!/usr/bin/env node
/**
 * 任务4验收测试
 * 验证页面内容提取与双语渲染功能的实现
 */

const fs = require('fs');
const path = require('path');

console.log('=== 任务4验收测试 ===\n');

// 检查文件存在性
console.log('1. 检查必需文件:');
const requiredFiles = [
    'content.js',
    'content.css',
    'manifest.json',
    'popup.js'
];

let allFilesExist = true;
for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file}`);
        
        // 检查文件大小
        const stats = fs.statSync(filePath);
        if (stats.size < 100) {
            console.log(`      ⚠ 文件较小: ${stats.size} 字节`);
        }
    } else {
        console.log(`   ❌ ${file} (缺失)`);
        allFilesExist = false;
    }
}

// 检查 manifest.json 包含 content.css
console.log('\n2. 检查 manifest.json 配置:');
try {
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
    
    if (manifest.content_scripts && manifest.content_scripts.length > 0) {
        const contentScript = manifest.content_scripts[0];
        if (contentScript.css && contentScript.css.includes('content.css')) {
            console.log('   ✅ content.css 已添加到 content_scripts');
        } else {
            console.log('   ❌ content.css 未添加到 content_scripts');
            allFilesExist = false;
        }
    } else {
        console.log('   ❌ 未找到 content_scripts 配置');
        allFilesExist = false;
    }
} catch (error) {
    console.log(`   ❌ 解析 manifest.json 失败: ${error.message}`);
    allFilesExist = false;
}

// 检查 content.js 的关键函数
console.log('\n3. 检查 content.js 核心函数:');
try {
    const contentJs = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
    
    const requiredFunctions = [
        'extractPageContent',
        'isValidContentElement',
        'initSelectionTranslation',
        'handleTranslatePage',
        'renderBilingualTranslation',
        'restoreAllOriginalElements',
        'sendTranslationRequest'
    ];
    
    let allFunctionsFound = true;
    for (const func of requiredFunctions) {
        if (contentJs.includes(`function ${func}`) || contentJs.includes(`async function ${func}`)) {
            console.log(`   ✅ ${func}() 函数存在`);
        } else {
            console.log(`   ❌ ${func}() 函数缺失`);
            allFunctionsFound = false;
        }
    }
    
    if (!allFunctionsFound) {
        console.log('   ⚠ 部分核心函数缺失');
    }
    
    // 检查是否处理了 translatePage 和 translateSelection 消息
    if (contentJs.includes("case 'translatePage'") && contentJs.includes("case 'translateSelection'")) {
        console.log('   ✅ 消息处理逻辑完整');
    } else {
        console.log('   ❌ 消息处理逻辑不完整');
        allFunctionsFound = false;
    }
    
} catch (error) {
    console.log(`   ❌ 读取 content.js 失败: ${error.message}`);
    allFilesExist = false;
}

// 检查 content.css 的关键样式
console.log('\n4. 检查 content.css 样式:');
try {
    const contentCss = fs.readFileSync(path.join(__dirname, 'content.css'), 'utf8');
    
    const requiredStyles = [
        '.bilingual-translator-floating-btn',
        '.bilingual-translation-container',
        '.bilingual-original-text',
        '.bilingual-translated-text',
        '.bilingual-translation-close',
        '.bilingual-restore-btn'
    ];
    
    let allStylesFound = true;
    for (const style of requiredStyles) {
        if (contentCss.includes(style)) {
            console.log(`   ✅ ${style} 样式存在`);
        } else {
            console.log(`   ❌ ${style} 样式缺失`);
            allStylesFound = false;
        }
    }
    
    // 检查动画
    if (contentCss.includes('@keyframes')) {
        console.log('   ✅ CSS 动画已定义');
    }
    
} catch (error) {
    console.log(`   ❌ 读取 content.css 失败: ${error.message}`);
    allFilesExist = false;
}

// 检查 popup.js 的消息发送
console.log('\n5. 检查 popup.js 交互:');
try {
    const popupJs = fs.readFileSync(path.join(__dirname, 'popup.js'), 'utf8');
    
    if (popupJs.includes('translatePage') && popupJs.includes('translateSelection')) {
        console.log('   ✅ 翻译按钮功能完整');
    } else {
        console.log('   ❌ 翻译按钮功能不完整');
    }
    
    if (popupJs.includes('sendMessageToTab')) {
        console.log('   ✅ 支持向标签页发送消息');
    }
    
} catch (error) {
    console.log(`   ❌ 读取 popup.js 失败: ${error.message}`);
    allFilesExist = false;
}

// 总结
console.log('\n' + '='.repeat(50));
console.log('验收测试完成');

if (allFilesExist) {
    console.log('✅ 所有必需文件存在且配置正确');
    console.log('\n下一步:');
    console.log('1. 重新加载扩展 (chrome://extensions/ → 更新)');
    console.log('2. 打开英文网页测试:');
    console.log('   - 点击扩展图标 → "翻译整页"');
    console.log('   - 检查是否双语显示');
    console.log('   - 选中文字 → 点击悬浮按钮翻译');
    console.log('   - 点击关闭按钮恢复原样');
    console.log('   - 点击右下角"恢复页面原样"按钮');
} else {
    console.log('❌ 部分检查未通过，请修复上述问题');
    process.exit(1);
}
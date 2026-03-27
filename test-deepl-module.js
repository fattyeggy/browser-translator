/**
 * 测试 DeepL 翻译模块结构
 * 不需要实际 API 调用，仅验证模块导出和函数签名
 */

const translator = require('./translator.js');

console.log('=== DeepL 翻译模块结构测试 ===\n');

// 检查 DeepLTranslator 对象
console.log('1. 检查 DeepLTranslator 对象:');
if (translator.DeepLTranslator) {
    console.log('   ✅ DeepLTranslator 存在');
    
    const deepl = translator.DeepLTranslator;
    
    // 检查必需函数
    const requiredFunctions = ['translateText', 'validateAPIKey', 'getSupportedLanguages', 'convertLangCode'];
    let allFunctionsExist = true;
    
    for (const funcName of requiredFunctions) {
        if (typeof deepl[funcName] === 'function') {
            console.log(`   ✅ ${funcName}() 函数存在`);
        } else {
            console.log(`   ❌ ${funcName}() 函数缺失`);
            allFunctionsExist = false;
        }
    }
    
    if (allFunctionsExist) {
        console.log('   ✅ 所有必需函数都存在');
    } else {
        console.log('   ❌ 部分函数缺失');
    }
    
    // 测试语言代码转换
    console.log('\n2. 测试语言代码转换:');
    try {
        const zhCode = deepl.convertLangCode('zh-CN');
        const enCode = deepl.convertLangCode('en');
        const jaCode = deepl.convertLangCode('ja');
        
        console.log(`   zh-CN → ${zhCode} (应为 ZH)`);
        console.log(`   en → ${enCode} (应为 EN)`);
        console.log(`   ja → ${jaCode} (应为 JA)`);
        
        if (zhCode === 'ZH' && enCode === 'EN' && jaCode === 'JA') {
            console.log('   ✅ 语言代码转换正确');
        } else {
            console.log('   ❌ 语言代码转换不正确');
        }
    } catch (error) {
        console.log(`   ❌ 语言代码转换出错: ${error.message}`);
    }
    
    // 测试获取支持的语言
    console.log('\n3. 测试获取支持的语言:');
    try {
        const languages = deepl.getSupportedLanguages();
        const languageCount = Object.keys(languages).length;
        
        console.log(`   支持 ${languageCount} 种语言`);
        
        // 检查关键语言是否存在
        const keyLanguages = ['zh-CN', 'en', 'ja', 'auto'];
        const missingLanguages = keyLanguages.filter(lang => !languages[lang]);
        
        if (missingLanguages.length === 0) {
            console.log('   ✅ 所有关键语言都存在');
        } else {
            console.log(`   ❌ 缺少语言: ${missingLanguages.join(', ')}`);
        }
    } catch (error) {
        console.log(`   ❌ 获取支持语言出错: ${error.message}`);
    }
    
    // 测试 validateAPIKey 函数签名（不实际调用）
    console.log('\n4. 测试 validateAPIKey 函数签名:');
    try {
        const func = deepl.validateAPIKey;
        const functionString = func.toString();
        
        if (functionString.includes('async') || functionString.includes('Promise')) {
            console.log('   ✅ 函数是异步函数，返回 Promise');
        } else {
            console.log('   ⚠ 函数可能不是异步函数');
        }
        
        // 检查参数
        if (functionString.includes('apiKey')) {
            console.log('   ✅ 函数接受 apiKey 参数');
        }
    } catch (error) {
        console.log(`   ❌ 检查函数签名出错: ${error.message}`);
    }
    
    // 测试 translateText 函数签名
    console.log('\n5. 测试 translateText 函数签名:');
    try {
        const func = deepl.translateText;
        const functionString = func.toString();
        
        if (functionString.includes('async') || functionString.includes('Promise')) {
            console.log('   ✅ 函数是异步函数，返回 Promise');
        }
        
        // 检查参数
        const params = ['text', 'targetLang', 'apiKey', 'sourceLang'];
        let paramCheckPassed = true;
        
        for (const param of params) {
            if (!functionString.includes(param)) {
                console.log(`   ⚠ 参数 ${param} 可能未在函数签名中`);
                paramCheckPassed = false;
            }
        }
        
        if (paramCheckPassed) {
            console.log('   ✅ 函数参数签名正确');
        }
    } catch (error) {
        console.log(`   ❌ 检查函数签名出错: ${error.message}`);
    }
    
} else {
    console.log('   ❌ DeepLTranslator 不存在');
    process.exit(1);
}

// 检查独立导出函数
console.log('\n6. 检查独立导出函数:');
if (typeof translator.translateTextDeepL === 'function') {
    console.log('   ✅ translateTextDeepL() 函数存在');
} else {
    console.log('   ❌ translateTextDeepL() 函数缺失');
}

if (typeof translator.validateDeepLAPIKey === 'function') {
    console.log('   ✅ validateDeepLAPIKey() 函数存在');
} else {
    console.log('   ❌ validateDeepLAPIKey() 函数缺失');
}

// 总结
console.log('\n' + '='.repeat(50));
console.log('DeepL 翻译模块结构测试完成');
console.log('注意：此测试仅验证模块结构，不进行实际 API 调用');
console.log('实际功能测试需要有效的 DeepL API 密钥');
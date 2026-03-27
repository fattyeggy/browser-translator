/**
 * 翻译模块测试脚本
 * 
 * 在 Node.js 环境中测试 Google Translate 翻译功能
 * 需要 Node.js 18+ (支持 fetch API)
 */

// 加载翻译模块
const translator = require('./translator.js');

// 测试用例
const testCases = [
    {
        name: '简单英文翻译',
        text: 'Hello World',
        targetLang: 'zh-CN',
        expectedContains: ['你好', '世界'] // 期望结果包含这些词
    },
    {
        name: '简单日文翻译',
        text: 'こんにちは',
        targetLang: 'zh-CN',
        expectedContains: ['你好', '您好'] // 日文你好
    },
    {
        name: '空文本',
        text: '',
        targetLang: 'zh-CN',
        shouldBeEmpty: true
    },
    {
        name: '短文本',
        text: 'Good morning',
        targetLang: 'zh-CN',
        expectedContains: ['早上好', '早安']
    }
];

// 长文本测试（测试分段功能）
const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100); // 约 5000 字符

async function runTests() {
    console.log('开始翻译模块测试...\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
        console.log(`测试: ${testCase.name}`);
        console.log(`  原文: "${testCase.text}"`);
        console.log(`  目标语言: ${testCase.targetLang}`);
        
        try {
            const result = await translator.translateText(testCase.text, testCase.targetLang);
            
            console.log(`  结果: "${result.translatedText}"`);
            console.log(`  源语言: ${result.sourceLanguage}`);
            console.log(`  置信度: ${result.confidence}`);
            console.log(`  字符数: ${result.characterCount}`);
            
            // 验证结果
            let testPassed = true;
            
            if (testCase.shouldBeEmpty) {
                if (result.translatedText !== '') {
                    console.log(`  ❌ 失败: 应为空字符串，实际为 "${result.translatedText}"`);
                    testPassed = false;
                }
            } else if (testCase.expectedContains) {
                const containsAny = testCase.expectedContains.some(word => 
                    result.translatedText.includes(word)
                );
                
                if (!containsAny) {
                    console.log(`  ❌ 失败: 期望包含 ${testCase.expectedContains.join(' 或 ')}，实际为 "${result.translatedText}"`);
                    testPassed = false;
                }
            }
            
            if (testPassed) {
                console.log(`  ✅ 通过\n`);
                passed++;
            } else {
                failed++;
            }
            
        } catch (error) {
            console.log(`  ❌ 异常: ${error.message}`);
            failed++;
        }
    }
    
    // 测试长文本
    console.log('测试: 长文本分段翻译');
    console.log(`  长度: ${longText.length} 字符`);
    
    try {
        const result = await translator.translateText(longText, 'zh-CN');
        console.log(`  结果长度: ${result.translatedText.length} 字符`);
        console.log(`  分段数: ${result.segmentCount || 1}`);
        console.log(`  成功段数: ${result.successfulSegments || 1}`);
        
        if (result.translatedText.length > 0) {
            console.log(`  ✅ 长文本翻译通过\n`);
            passed++;
        } else {
            console.log(`  ❌ 失败: 翻译结果为空\n`);
            failed++;
        }
    } catch (error) {
        console.log(`  ❌ 长文本翻译失败: ${error.message}\n`);
        failed++;
    }
    
    // 测试语言支持函数
    console.log('测试: 语言支持函数');
    try {
        const languages = translator.getSupportedLanguages();
        console.log(`  支持的语言数量: ${Object.keys(languages).length}`);
        
        // 检查常见语言是否存在
        const requiredLanguages = ['zh-CN', 'en', 'ja', 'auto'];
        const missingLanguages = requiredLanguages.filter(lang => !languages[lang]);
        
        if (missingLanguages.length === 0) {
            console.log(`  ✅ 语言列表完整\n`);
            passed++;
        } else {
            console.log(`  ❌ 缺少语言: ${missingLanguages.join(', ')}\n`);
            failed++;
        }
    } catch (error) {
        console.log(`  ❌ 语言支持函数失败: ${error.message}\n`);
        failed++;
    }
    
    // 总结
    console.log('='.repeat(50));
    console.log(`测试完成: ${passed} 通过, ${failed} 失败`);
    
    if (failed === 0) {
        console.log('✅ 所有测试通过！');
        return 0;
    } else {
        console.log('❌ 部分测试失败');
        return 1;
    }
}

// 运行测试
if (require.main === module) {
    runTests().then(exitCode => {
        process.exit(exitCode);
    }).catch(error => {
        console.error('测试运行失败:', error);
        process.exit(1);
    });
}

module.exports = { runTests };
// 双语翻译助手 - 后台服务脚本 (Service Worker)

// 导入翻译模块
try {
  importScripts('./translator.js');
  console.log('翻译模块加载成功');
} catch (error) {
  console.error('翻译模块加载失败:', error);
}

// 扩展安装时执行
chrome.runtime.onInstalled.addListener(() => {
  console.log('双语翻译助手已安装');
  
  // 初始化存储 (使用 sync 以跨设备同步)
  chrome.storage.sync.set({
    translationService: 'google',
    targetLanguage: 'zh-CN',
    deeplApiKey: '',
    showOriginal: true,
    translationMode: 'parallel'
  });
});

// 监听来自 popup 或 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('后台收到消息:', request);
  
  // 根据消息类型处理
  switch (request.type) {
    case 'translatePage':
      console.log('收到整页翻译请求');
      // 整页翻译将由 content script 处理
      break;
    case 'translateSelection':
      console.log('收到选中内容翻译请求');
      // 选中内容翻译将由 content script 处理
      break;
    case 'translateText':
      handleTranslateText(request, sender, sendResponse);
      return true; // 异步响应
    case 'getSettings':
      chrome.storage.sync.get(['translationService', 'targetLanguage', 'deeplApiKey'], (result) => {
        sendResponse(result);
      });
      return true; // 表示异步响应
    case 'validateDeeplApiKey':
      handleValidateDeeplApiKey(request, sender, sendResponse);
      return true; // 异步响应
  }
  
  // 默认响应
  sendResponse({ success: true, message: '消息已收到' });
});

/**
 * 获取翻译设置（包括服务类型和 API 密钥）
 * @returns {Promise<object>} 设置对象
 */
async function getTranslationSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      translationService: 'google',
      targetLanguage: 'zh-CN',
      deeplApiKey: ''
    }, (result) => {
      resolve(result);
    });
  });
}

/**
 * 处理文本翻译请求
 * @param {object} request - 请求对象
 * @param {object} sender - 发送者信息
 * @param {function} sendResponse - 响应回调
 */
async function handleTranslateText(request, sender, sendResponse) {
  console.log('处理翻译请求:', request);
  
  const { text, targetLang, sourceLang = 'auto' } = request;
  
  if (!text || !targetLang) {
    sendResponse({
      success: false,
      error: '缺少必要参数: text 和 targetLang 是必需的'
    });
    return;
  }
  
  try {
    // 获取用户设置
    const settings = await getTranslationSettings();
    const { translationService, deeplApiKey } = settings;
    
    console.log(`开始翻译 (服务: ${translationService}): ${text.length} 字符到 ${targetLang}`);
    
    let result;
    
    // 根据设置选择翻译服务
    if (translationService === 'deepl') {
      // 检查 DeepL 翻译模块是否可用
      if (typeof DeepLTranslator === 'undefined' || !DeepLTranslator.translateText) {
        throw new Error('DeepL 翻译模块未正确加载');
      }
      
      // 检查 API 密钥
      if (!deeplApiKey) {
        throw new Error('未配置 DeepL API 密钥，请在设置页面填写');
      }
      
      // 调用 DeepL 翻译
      result = await DeepLTranslator.translateText(text, targetLang, deeplApiKey, sourceLang);
      result.service = 'deepl';
      
    } else {
      // 默认使用 Google 翻译
      // 检查 Google 翻译模块是否可用
      if (typeof GoogleTranslator === 'undefined' || !GoogleTranslator.translateText) {
        throw new Error('Google 翻译模块未正确加载');
      }
      
      // 调用 Google 翻译
      result = await GoogleTranslator.translateText(text, targetLang, sourceLang);
      result.service = 'google';
    }
    
    console.log('翻译成功:', {
      service: result.service,
      translatedLength: result.translatedText.length,
      sourceLanguage: result.sourceLanguage,
      confidence: result.confidence
    });
    
    sendResponse({
      success: true,
      result: result
    });
    
  } catch (error) {
    console.error('翻译处理失败:', error);
    
    sendResponse({
      success: false,
      error: error.message || '翻译失败',
      code: error.name
    });
  }
}

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log(`标签页 ${tabId} 加载完成: ${tab.url}`);
  }
});

// 提供翻译功能给其他模块使用
function getTranslator() {
  return GoogleTranslator;
}

/**
 * 验证 DeepL API 密钥
 * @param {object} request - 请求对象
 * @param {object} sender - 发送者信息
 * @param {function} sendResponse - 响应回调
 */
async function handleValidateDeeplApiKey(request, sender, sendResponse) {
  const { apiKey } = request;
  
  if (!apiKey) {
    sendResponse({
      success: false,
      message: 'API 密钥不能为空'
    });
    return;
  }
  
  try {
    // 检查 DeepL 翻译模块是否可用
    if (typeof DeepLTranslator === 'undefined' || !DeepLTranslator.validateAPIKey) {
      throw new Error('DeepL 翻译模块未正确加载');
    }
    
    console.log('验证 DeepL API 密钥...');
    
    // 调用验证函数
    const validationResult = await DeepLTranslator.validateAPIKey(apiKey);
    
    console.log('API 密钥验证结果:', validationResult.valid ? '有效' : '无效');
    
    sendResponse({
      success: validationResult.valid,
      message: validationResult.message,
      usage: validationResult.usage
    });
    
  } catch (error) {
    console.error('API 密钥验证失败:', error);
    
    sendResponse({
      success: false,
      message: `验证失败: ${error.message}`
    });
  }
}

// 自检函数（开发测试用）
function selfTest() {
  console.log('=== 翻译模块自检 ===');
  
  if (typeof GoogleTranslator === 'undefined') {
    console.error('❌ GoogleTranslator 未定义');
    return false;
  }
  
  if (typeof GoogleTranslator.translateText !== 'function') {
    console.error('❌ translateText 函数不存在');
    return false;
  }
  
  console.log('✅ 翻译模块加载正常');
  console.log('✅ 支持的语言:', Object.keys(GoogleTranslator.getSupportedLanguages()).length, '种');
  
  // 可选：实际测试翻译
  // GoogleTranslator.translateText('Hello', 'zh-CN')
  //   .then(result => console.log('✅ 翻译测试: "Hello" →', result.translatedText))
  //   .catch(error => console.error('❌ 翻译测试失败:', error));
  
  return true;
}

// 扩展启动时进行自检
if (chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    console.log('扩展启动，执行自检...');
    selfTest();
  });
}
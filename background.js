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
  
  // 初始化存储
  chrome.storage.local.set({
    translationService: 'google',
    targetLanguage: 'zh-CN',
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
      chrome.storage.local.get(['translationService', 'targetLanguage'], (result) => {
        sendResponse(result);
      });
      return true; // 表示异步响应
  }
  
  // 默认响应
  sendResponse({ success: true, message: '消息已收到' });
});

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
    // 检查翻译模块是否可用
    if (typeof GoogleTranslator === 'undefined' || !GoogleTranslator.translateText) {
      throw new Error('翻译模块未正确加载');
    }
    
    console.log(`开始翻译: ${text.length} 字符到 ${targetLang}`);
    
    // 调用翻译函数
    const result = await GoogleTranslator.translateText(text, targetLang, sourceLang);
    
    console.log('翻译成功:', {
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
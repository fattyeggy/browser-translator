// 双语翻译助手 - 内容脚本

console.log('双语翻译助手内容脚本已加载');

// 监听来自 popup 或 background 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('内容脚本收到消息:', request);
  
  // 根据消息类型处理
  switch (request.type) {
    case 'translatePage':
      handleTranslatePage(request);
      break;
    case 'translateSelection':
      handleTranslateSelection(request);
      break;
    default:
      console.log('未知消息类型:', request.type);
  }
  
  // 发送响应
  sendResponse({ 
    success: true, 
    message: '消息已处理', 
    type: request.type,
    timestamp: new Date().toISOString()
  });
  
  return true; // 保持消息通道开放以支持异步响应
});

// 处理整页翻译请求
function handleTranslatePage(request) {
  console.log('开始整页翻译:', request);
  
  // 获取页面基本信息
  const pageInfo = {
    url: window.location.href,
    title: document.title,
    language: document.documentElement.lang || 'unknown',
    wordCount: document.body.innerText.split(/\s+/).length,
    settings: request.settings
  };
  
  console.log('页面信息:', pageInfo);
  
  // 模拟翻译处理
  const translationResult = {
    status: 'processing',
    message: `正在将页面翻译为 ${request.settings.targetLanguage}`,
    showOriginal: request.settings.showOriginal,
    estimatedTime: Math.ceil(pageInfo.wordCount / 1000) * 2 + '秒'
  };
  
  console.log('翻译结果:', translationResult);
  
  // 在实际实现中，这里会调用翻译API并处理DOM
  showNotification('整页翻译请求已收到', 'info');
}

// 处理选中内容翻译请求
function handleTranslateSelection(request) {
  console.log('开始选中内容翻译:', request);
  
  // 获取当前选中的文本
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (!selectedText) {
    console.log('没有选中任何文本');
    showNotification('请先选中要翻译的文本', 'warning');
    return;
  }
  
  const selectionInfo = {
    text: selectedText,
    length: selectedText.length,
    wordCount: selectedText.split(/\s+/).length,
    settings: request.settings
  };
  
  console.log('选中内容信息:', selectionInfo);
  
  // 模拟翻译处理
  const translationResult = {
    status: 'processing',
    message: `正在将选中内容翻译为 ${request.settings.targetLanguage}`,
    text: selectedText,
    showOriginal: request.settings.showOriginal,
    estimatedTime: '1秒'
  };
  
  console.log('翻译结果:', translationResult);
  
  // 在实际实现中，这里会调用翻译API并显示结果
  showNotification(`选中内容翻译请求已收到 (${selectionInfo.wordCount}个单词)`, 'info');
}

// 在页面上显示通知
function showNotification(message, type = 'info') {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `bilingual-translator-notification bilingual-translator-${type}`;
  notification.innerHTML = `
    <div class="bilingual-translator-notification-content">
      <strong>双语翻译助手:</strong> ${message}
    </div>
    <button class="bilingual-translator-notification-close">&times;</button>
  `;
  
  // 添加样式
  if (!document.querySelector('#bilingual-translator-styles')) {
    const style = document.createElement('style');
    style.id = 'bilingual-translator-styles';
    style.textContent = `
      .bilingual-translator-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        padding: 15px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 400px;
        border-left: 4px solid #667eea;
        animation: bilingual-translator-slide-in 0.3s ease-out;
      }
      
      .bilingual-translator-info {
        border-left-color: #667eea;
      }
      
      .bilingual-translator-warning {
        border-left-color: #FF9800;
      }
      
      .bilingual-translator-notification-content {
        font-size: 14px;
        color: #333;
        margin-right: 15px;
      }
      
      .bilingual-translator-notification-content strong {
        color: #667eea;
      }
      
      .bilingual-translator-notification-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
      }
      
      .bilingual-translator-notification-close:hover {
        background-color: #f0f0f0;
        color: #333;
      }
      
      @keyframes bilingual-translator-slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // 添加到页面
  document.body.appendChild(notification);
  
  // 添加关闭按钮事件
  const closeBtn = notification.querySelector('.bilingual-translator-notification-close');
  closeBtn.addEventListener('click', () => {
    notification.style.animation = 'bilingual-translator-slide-in 0.3s ease-out reverse';
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // 5秒后自动消失
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      notification.style.transition = 'all 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }, 5000);
}

// 初始化
(function init() {
  console.log('双语翻译助手内容脚本初始化完成');
  
  // 检查页面是否已经加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('页面加载完成，双语翻译助手已就绪');
    });
  } else {
    console.log('页面已加载，双语翻译助手已就绪');
  }
})();
// 双语翻译助手 - Popup 脚本

// DOM 元素
const translatePageBtn = document.getElementById('translatePageBtn');
const translateSelectionBtn = document.getElementById('translateSelectionBtn');
const statusElement = document.getElementById('status');
const targetLanguageSelect = document.getElementById('targetLanguage');
const showOriginalCheckbox = document.getElementById('showOriginal');
const optionsLink = document.getElementById('optionsLink');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// 状态管理
let currentStatus = 'ready';
let isTranslating = false;

// 监听来自 content.js 的进度消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'translationProgress') {
    if (isTranslating && progressContainer.style.display !== 'none') {
      updateProgress(request.progress, request.message);
    }
    return true;
  }
  
  if (request.type === 'translationComplete') {
    if (isTranslating) {
      updateProgress(100, request.message || '翻译完成！');
      setTimeout(() => {
        hideProgress();
        updateStatus('翻译完成！', 'success');
      }, 1500);
    }
    return true;
  }
  
  if (request.type === 'translationError') {
    if (isTranslating) {
      hideProgress();
      updateStatus('翻译失败: ' + (request.message || '未知错误'), 'error');
    }
    return true;
  }
});

// 更新状态显示
function updateStatus(message, type = 'info') {
  const iconMap = {
    info: 'fa-info-circle',
    success: 'fa-check-circle',
    warning: 'fa-exclamation-circle',
    error: 'fa-times-circle'
  };
  
  const colorMap = {
    info: '#667eea',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336'
  };
  
  const icon = statusElement.querySelector('i');
  const text = statusElement.querySelector('span');
  
  icon.className = `fas ${iconMap[type]}`;
  icon.style.color = colorMap[type];
  text.textContent = message;
  
  currentStatus = type;
}

// 显示进度指示器
function showProgress() {
  progressContainer.style.display = 'block';
  statusElement.style.display = 'none';
  isTranslating = true;
  disableButtons();
}

// 隐藏进度指示器
function hideProgress() {
  progressContainer.style.display = 'none';
  statusElement.style.display = 'flex';
  isTranslating = false;
  enableButtons();
}

// 更新进度
function updateProgress(progress, message) {
  if (progressFill) {
    progressFill.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
  }
  if (progressText) {
    progressText.textContent = message || '';
  }
}

// 禁用按钮
function disableButtons() {
  translatePageBtn.disabled = true;
  translateSelectionBtn.disabled = true;
  targetLanguageSelect.disabled = true;
  showOriginalCheckbox.disabled = true;
}

// 启用按钮
function enableButtons() {
  translatePageBtn.disabled = false;
  translateSelectionBtn.disabled = false;
  targetLanguageSelect.disabled = false;
  showOriginalCheckbox.disabled = false;
}

// 保存设置到存储
function saveSettings() {
  const settings = {
    targetLanguage: targetLanguageSelect.value,
    showOriginal: showOriginalCheckbox.checked
  };
  
  chrome.storage.sync.set(settings, () => {
    console.log('设置已保存:', settings);
  });
}

// 从存储加载设置
function loadSettings() {
  chrome.storage.sync.get(['targetLanguage', 'showOriginal'], (result) => {
    if (result.targetLanguage) {
      targetLanguageSelect.value = result.targetLanguage;
    }
    if (result.showOriginal !== undefined) {
      showOriginalCheckbox.checked = result.showOriginal;
    }
  });
}

// 发送消息到当前标签页
function sendMessageToTab(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      updateStatus('未找到活动标签页', 'error');
      return;
    }
    
    const tab = tabs[0];
    
    // 对于整页翻译，显示进度指示器
    if (message.type === 'translatePage') {
      showProgress();
      updateProgress(0, '正在发送翻译请求...');
    } else {
      updateStatus('正在发送请求...', 'info');
    }
    
    chrome.tabs.sendMessage(tab.id, message, (response) => {
      if (chrome.runtime.lastError) {
        console.error('发送消息失败:', chrome.runtime.lastError);
        
        if (message.type === 'translatePage') {
          hideProgress();
          updateStatus('发送失败，请刷新页面后重试', 'error');
        } else {
          updateStatus('发送失败，请刷新页面后重试', 'error');
        }
      } else {
        console.log('收到响应:', response);
        
        if (message.type === 'translatePage') {
          // 整页翻译已开始，进度将由 content.js 更新
          updateProgress(10, '翻译请求已接收，正在提取页面内容...');
        } else {
          updateStatus('请求已发送，请查看页面中的翻译结果', 'success');
          
          // 3秒后恢复就绪状态
          setTimeout(() => {
            updateStatus('就绪，点击按钮开始翻译', 'info');
          }, 3000);
        }
      }
    });
  });
}

// 翻译整页
function translatePage() {
  const settings = {
    targetLanguage: targetLanguageSelect.value,
    showOriginal: showOriginalCheckbox.checked
  };
  
  sendMessageToTab({
    type: 'translatePage',
    settings: settings
  });
}

// 翻译选中内容
function translateSelection() {
  const settings = {
    targetLanguage: targetLanguageSelect.value,
    showOriginal: showOriginalCheckbox.checked
  };
  
  sendMessageToTab({
    type: 'translateSelection',
    settings: settings
  });
}

// 事件监听器
translatePageBtn.addEventListener('click', translatePage);
translateSelectionBtn.addEventListener('click', translateSelection);

// 设置变化时保存
targetLanguageSelect.addEventListener('change', saveSettings);
showOriginalCheckbox.addEventListener('change', saveSettings);

// 打开选项页面
optionsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  updateStatus('就绪，点击按钮开始翻译', 'info');
  
  // 检查当前标签页是否支持内容脚本
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const tab = tabs[0];
      if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
        console.log('当前页面支持扩展:', tab.url);
      } else {
        updateStatus('当前页面不支持扩展功能', 'warning');
      }
    }
  });
});
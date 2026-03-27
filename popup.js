// 双语翻译助手 - Popup 脚本

// DOM 元素
const translatePageBtn = document.getElementById('translatePageBtn');
const translateSelectionBtn = document.getElementById('translateSelectionBtn');
const statusElement = document.getElementById('status');
const targetLanguageSelect = document.getElementById('targetLanguage');
const showOriginalCheckbox = document.getElementById('showOriginal');
const optionsLink = document.getElementById('optionsLink');

// 状态管理
let currentStatus = 'ready';

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
    updateStatus('正在发送请求...', 'info');
    
    chrome.tabs.sendMessage(tab.id, message, (response) => {
      if (chrome.runtime.lastError) {
        console.error('发送消息失败:', chrome.runtime.lastError);
        updateStatus('发送失败，请刷新页面后重试', 'error');
      } else {
        console.log('收到响应:', response);
        updateStatus('请求已发送，请查看控制台日志', 'success');
        
        // 3秒后恢复就绪状态
        setTimeout(() => {
          updateStatus('就绪，点击按钮开始翻译', 'info');
        }, 3000);
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
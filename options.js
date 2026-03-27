// 双语翻译助手 - 设置页面脚本

// DOM 元素
const defaultTargetLanguageSelect = document.getElementById('defaultTargetLanguage');
const translationServiceSelect = document.getElementById('translationService');
const alwaysShowOriginalCheckbox = document.getElementById('alwaysShowOriginal');
const showTranslationTooltipCheckbox = document.getElementById('showTranslationTooltip');
const autoDetectLanguageCheckbox = document.getElementById('autoDetectLanguage');
const translationDelayInput = document.getElementById('translationDelay');
const maxCharactersInput = document.getElementById('maxCharacters');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const statusMessage = document.getElementById('statusMessage');
const backToPopupLink = document.getElementById('backToPopup');
const viewSourceLink = document.getElementById('viewSource');

// 默认设置
const defaultSettings = {
  defaultTargetLanguage: 'zh-CN',
  translationService: 'google',
  alwaysShowOriginal: true,
  showTranslationTooltip: false,
  autoDetectLanguage: true,
  translationDelay: 500,
  maxCharacters: 5000
};

// 显示状态消息
function showStatus(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `status ${type}`;
  
  // 3秒后自动隐藏
  setTimeout(() => {
    statusMessage.className = 'status';
  }, 3000);
}

// 加载设置
function loadSettings() {
  chrome.storage.local.get(defaultSettings, (result) => {
    console.log('加载设置:', result);
    
    defaultTargetLanguageSelect.value = result.defaultTargetLanguage;
    translationServiceSelect.value = result.translationService;
    alwaysShowOriginalCheckbox.checked = result.alwaysShowOriginal;
    showTranslationTooltipCheckbox.checked = result.showTranslationTooltip;
    autoDetectLanguageCheckbox.checked = result.autoDetectLanguage;
    translationDelayInput.value = result.translationDelay;
    maxCharactersInput.value = result.maxCharacters;
  });
}

// 保存设置
function saveSettings() {
  const settings = {
    defaultTargetLanguage: defaultTargetLanguageSelect.value,
    translationService: translationServiceSelect.value,
    alwaysShowOriginal: alwaysShowOriginalCheckbox.checked,
    showTranslationTooltip: showTranslationTooltipCheckbox.checked,
    autoDetectLanguage: autoDetectLanguageCheckbox.checked,
    translationDelay: parseInt(translationDelayInput.value, 10),
    maxCharacters: parseInt(maxCharactersInput.value, 10)
  };
  
  // 验证输入
  if (settings.translationDelay < 0 || settings.translationDelay > 5000) {
    showStatus('翻译延迟必须在0-5000毫秒之间', 'error');
    return;
  }
  
  if (settings.maxCharacters < 100 || settings.maxCharacters > 20000) {
    showStatus('最大字符数必须在100-20000之间', 'error');
    return;
  }
  
  chrome.storage.local.set(settings, () => {
    console.log('设置已保存:', settings);
    showStatus('设置已成功保存！');
    
    // 通知其他部分设置已更新
    chrome.runtime.sendMessage({ type: 'settingsUpdated', settings: settings });
  });
}

// 恢复默认设置
function resetToDefaults() {
  if (!confirm('确定要恢复默认设置吗？当前设置将会丢失。')) {
    return;
  }
  
  chrome.storage.local.set(defaultSettings, () => {
    console.log('已恢复默认设置:', defaultSettings);
    loadSettings(); // 重新加载到UI
    showStatus('已恢复默认设置');
  });
}

// 事件监听器
saveBtn.addEventListener('click', saveSettings);
resetBtn.addEventListener('click', resetToDefaults);

backToPopupLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

viewSourceLink.addEventListener('click', (e) => {
  e.preventDefault();
  window.open('https://github.com/yourusername/bilingual-translator', '_blank');
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('设置页面已加载');
  loadSettings();
  
  // 检查是否在扩展上下文中
  if (typeof chrome === 'undefined' || !chrome.storage) {
    console.error('未在扩展上下文中运行');
    showStatus('错误：未在扩展上下文中运行', 'error');
  }
});

// 监听来自其他部分的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'settingsUpdatedFromPopup') {
    console.log('收到设置更新通知，重新加载设置');
    loadSettings();
  }
  sendResponse({ success: true });
});
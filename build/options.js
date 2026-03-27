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

// DeepL 相关元素
const deeplSettings = document.getElementById('deeplSettings');
const deeplApiKeyInput = document.getElementById('deeplApiKey');
const testDeeplApiBtn = document.getElementById('testDeeplApiBtn');
const deeplApiStatus = document.getElementById('deeplApiStatus');

// 默认设置
const defaultSettings = {
  defaultTargetLanguage: 'zh-CN',
  translationService: 'google',
  deeplApiKey: '',
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

// 更新 DeepL 设置显示/隐藏
function updateDeeplSettingsVisibility() {
  const isDeeplSelected = translationServiceSelect.value === 'deepl';
  if (deeplSettings) {
    deeplSettings.style.display = isDeeplSelected ? 'block' : 'none';
  }
}

// 加载设置
function loadSettings() {
  chrome.storage.sync.get(defaultSettings, (result) => {
    console.log('加载设置:', result);
    
    defaultTargetLanguageSelect.value = result.defaultTargetLanguage;
    translationServiceSelect.value = result.translationService;
    alwaysShowOriginalCheckbox.checked = result.alwaysShowOriginal;
    showTranslationTooltipCheckbox.checked = result.showTranslationTooltip;
    autoDetectLanguageCheckbox.checked = result.autoDetectLanguage;
    translationDelayInput.value = result.translationDelay;
    maxCharactersInput.value = result.maxCharacters;
    
    // 加载 DeepL API Key
    if (deeplApiKeyInput && result.deeplApiKey) {
      deeplApiKeyInput.value = result.deeplApiKey;
    }
    
    // 更新 DeepL 设置显示
    updateDeeplSettingsVisibility();
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
  
  // 保存 DeepL API Key（如果有）
  if (deeplApiKeyInput) {
    settings.deeplApiKey = deeplApiKeyInput.value.trim();
  }
  
  // 验证输入
  if (settings.translationDelay < 0 || settings.translationDelay > 5000) {
    showStatus('翻译延迟必须在0-5000毫秒之间', 'error');
    return;
  }
  
  if (settings.maxCharacters < 100 || settings.maxCharacters > 20000) {
    showStatus('最大字符数必须在100-20000之间', 'error');
    return;
  }
  
  // 验证 DeepL API Key（如果选择了 DeepL）
  if (settings.translationService === 'deepl') {
    if (!settings.deeplApiKey) {
      showStatus('请填写 DeepL API 密钥', 'error');
      return;
    }
    
    // 简单的格式验证（DeepL API Key 通常是包含短横线的字符串）
    if (settings.deeplApiKey.length < 10) {
      showStatus('DeepL API 密钥格式似乎不正确', 'error');
      return;
    }
  }
  
  chrome.storage.sync.set(settings, () => {
    console.log('设置已保存:', { ...settings, deeplApiKey: settings.deeplApiKey ? '***' + settings.deeplApiKey.slice(-4) : '空' });
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
  
  chrome.storage.sync.set(defaultSettings, () => {
    console.log('已恢复默认设置:', defaultSettings);
    loadSettings(); // 重新加载到UI
    showStatus('已恢复默认设置');
  });
}

// 测试 DeepL API 连接
function testDeeplApiConnection() {
  const apiKey = deeplApiKeyInput.value.trim();
  
  if (!apiKey) {
    deeplApiStatus.textContent = '请输入 API 密钥';
    deeplApiStatus.className = 'api-status error';
    return;
  }
  
  // 禁用测试按钮，显示加载状态
  testDeeplApiBtn.disabled = true;
  testDeeplApiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 测试中...';
  deeplApiStatus.textContent = '正在验证 API 密钥...';
  deeplApiStatus.className = 'api-status info';
  
  // 发送消息到后台进行验证
  chrome.runtime.sendMessage({
    type: 'validateDeeplApiKey',
    apiKey: apiKey
  }, (response) => {
    // 恢复按钮状态
    testDeeplApiBtn.disabled = false;
    testDeeplApiBtn.innerHTML = '<i class="fas fa-plug"></i> 测试连接';
    
    if (chrome.runtime.lastError) {
      deeplApiStatus.textContent = `通信错误: ${chrome.runtime.lastError.message}`;
      deeplApiStatus.className = 'api-status error';
      return;
    }
    
    if (response.success) {
      deeplApiStatus.textContent = response.message;
      deeplApiStatus.className = 'api-status success';
      
      // 如果有使用情况信息，显示剩余额度
      if (response.usage) {
        const remaining = response.usage.remaining;
        const used = response.usage.characterCount;
        const limit = response.usage.characterLimit;
        const percent = Math.round((used / limit) * 100);
        
        deeplApiStatus.textContent += ` | 已用: ${used.toLocaleString()} 字符 (${percent}%)`;
        
        // 如果剩余额度低，显示警告
        if (remaining < 10000) {
          deeplApiStatus.textContent += ` | 剩余: ${remaining.toLocaleString()} 字符`;
          deeplApiStatus.className = 'api-status error';
        }
      }
    } else {
      deeplApiStatus.textContent = response.message || '验证失败';
      deeplApiStatus.className = 'api-status error';
    }
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

// 翻译服务选择变化时更新 UI
translationServiceSelect.addEventListener('change', updateDeeplSettingsVisibility);

// DeepL API 测试按钮
if (testDeeplApiBtn) {
  testDeeplApiBtn.addEventListener('click', testDeeplApiConnection);
}

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
/**
 * 双语翻译助手 - 内容脚本 (核心功能)
 * 
 * 负责：
 * 1. 智能提取页面正文内容
 * 2. 选中文本翻译悬浮按钮
 * 3. 双语对照渲染
 * 4. 与后台服务通信进行翻译
 */

console.log('双语翻译助手内容脚本已加载');

// 全局状态管理
const state = {
    isTranslating: false,
    originalElements: new Map(), // 保存原始元素，用于恢复
    translationContainers: new Map(), // 保存翻译容器
    floatingBtn: null,
    restoreBtn: null,
    selectionMode: false,
    translationStats: {
        totalElements: 0,
        translatedElements: 0,
        totalCharacters: 0,
        startTime: null,
        endTime: null
    }
};

// ==================== 页面内容提取 ====================

/**
 * 智能提取页面正文内容
 * @returns {Array} 包含文本内容的元素数组
 */
function extractPageContent() {
    console.log('开始提取页面内容...');
    
    // 常见的正文内容选择器
    const contentSelectors = [
        'p',
        'article',
        'section',
        'div[class*="content"]',
        'div[class*="article"]',
        'div[class*="post"]',
        'div[class*="blog"]',
        'div[class*="text"]',
        'main',
        '.content',
        '.article',
        '.post',
        '.blog-post',
        '.entry-content',
        '.post-content'
    ];
    
    // 需要排除的选择器
    const excludeSelectors = [
        'nav',
        'header',
        'footer',
        'aside',
        'script',
        'style',
        'iframe',
        'noscript',
        '.nav',
        '.header',
        '.footer',
        '.sidebar',
        '.advertisement',
        '.ad',
        '.banner',
        '.menu',
        '.navigation',
        '.social-share',
        '.comments',
        '.related-posts'
    ];
    
    const contentElements = [];
    
    // 先尝试使用选择器
    contentSelectors.forEach(selector => {
        try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (isValidContentElement(element, excludeSelectors)) {
                    contentElements.push(element);
                }
            });
        } catch (error) {
            console.warn(`选择器 ${selector} 查询失败:`, error);
        }
    });
    
    // 如果选择器没有找到足够的内容，使用启发式方法
    if (contentElements.length < 5) {
        console.log('选择器找到的内容较少，使用启发式方法...');
        
        // 获取所有包含文本的元素
        const allElements = document.body.querySelectorAll('*');
        allElements.forEach(element => {
            if (element.tagName && 
                ['P', 'DIV', 'SPAN', 'ARTICLE', 'SECTION'].includes(element.tagName) &&
                isValidContentElement(element, excludeSelectors)) {
                contentElements.push(element);
            }
        });
    }
    
    // 去重
    const uniqueElements = [];
    const seenElements = new Set();
    
    contentElements.forEach(element => {
        if (!seenElements.has(element)) {
            seenElements.add(element);
            uniqueElements.push(element);
        }
    });
    
    console.log(`提取到 ${uniqueElements.length} 个内容元素`);
    return uniqueElements;
}

/**
 * 检查元素是否有效的正文内容
 * @param {HTMLElement} element - 要检查的元素
 * @param {Array} excludeSelectors - 排除选择器列表
 * @returns {boolean} 是否是有效内容
 */
function isValidContentElement(element, excludeSelectors) {
    // 检查元素是否可见
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || 
        style.visibility === 'hidden' || 
        style.opacity === '0') {
        return false;
    }
    
    // 检查是否在排除的元素内
    for (const selector of excludeSelectors) {
        if (element.closest(selector)) {
            return false;
        }
    }
    
    // 获取文本内容
    const text = element.innerText?.trim() || element.textContent?.trim();
    
    // 过滤条件
    if (!text) return false;
    
    // 文本长度过滤
    if (text.length < 20 || text.length > 5000) return false;
    
    // 过滤包含太多链接的文本
    const linkCount = element.querySelectorAll('a').length;
    if (linkCount > 5 && linkCount * 50 > text.length) return false;
    
    // 过滤按钮、导航等常见非正文内容
    const tagName = element.tagName.toLowerCase();
    const className = element.className?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';
    
    const nonContentKeywords = [
        'button', 'btn', 'nav', 'menu', 'link', 'icon', 'logo',
        'header', 'footer', 'sidebar', 'ad', 'banner', 'comment',
        'share', 'social', 'meta', 'breadcrumb', 'pagination',
        'search', 'form', 'input', 'select', 'option', 'label'
    ];
    
    for (const keyword of nonContentKeywords) {
        if (className.includes(keyword) || id.includes(keyword)) {
            return false;
        }
    }
    
    // 检查文本质量（中文字符比例）
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const chineseRatio = chineseChars / text.length;
    
    // 如果已经是中文内容，且比例很高，可能不需要翻译
    if (chineseRatio > 0.7) {
        return false;
    }
    
    return true;
}

// ==================== 选中文本翻译 ====================

/**
 * 初始化选中文本翻译功能
 */
function initSelectionTranslation() {
    console.log('初始化选中文本翻译功能');
    
    // 监听文本选中事件
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('keyup', handleTextSelection);
    
    // 防止在输入框中选择时触发
    document.addEventListener('selectionchange', () => {
        const activeElement = document.activeElement;
        const isInput = activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true'
        );
        
        if (isInput) {
            removeFloatingButton();
        }
    });
}

/**
 * 处理文本选中事件
 */
function handleTextSelection() {
    // 如果正在翻译整页，不显示悬浮按钮
    if (state.isTranslating) return;
    
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (!selectedText || selectedText.length < 3) {
        removeFloatingButton();
        return;
    }
    
    // 检查是否在输入框中
    const activeElement = document.activeElement;
    const isInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
    );
    
    if (isInput) {
        removeFloatingButton();
        return;
    }
    
    // 获取选中位置
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    if (rect.width === 0 && rect.height === 0) {
        return;
    }
    
    showFloatingButton(rect, selectedText);
}

/**
 * 显示悬浮翻译按钮
 * @param {DOMRect} rect - 选中文本的位置
 * @param {string} selectedText - 选中的文本
 */
function showFloatingButton(rect, selectedText) {
    removeFloatingButton();
    
    // 创建悬浮按钮
    state.floatingBtn = document.createElement('button');
    state.floatingBtn.className = 'bilingual-translator-floating-btn';
    state.floatingBtn.innerHTML = `
        <span style="margin-right: 5px;">🌐</span>
        <span>翻译选中文本 (${selectedText.length}字)</span>
    `;
    
    // 设置位置
    state.floatingBtn.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
    state.floatingBtn.style.top = `${rect.bottom + window.scrollY}px`;
    
    // 添加点击事件
    state.floatingBtn.addEventListener('click', () => {
        translateSelectedText(selectedText, rect);
    });
    
    document.body.appendChild(state.floatingBtn);
    
    // 点击页面其他地方移除按钮
    setTimeout(() => {
        document.addEventListener('click', removeFloatingButtonOnClick, true);
    }, 100);
}

/**
 * 点击页面其他地方移除悬浮按钮
 * @param {Event} event - 点击事件
 */
function removeFloatingButtonOnClick(event) {
    if (state.floatingBtn && !state.floatingBtn.contains(event.target)) {
        const selection = window.getSelection();
        if (!selection.toString().trim()) {
            removeFloatingButton();
        }
    }
}

/**
 * 移除悬浮按钮
 */
function removeFloatingButton() {
    if (state.floatingBtn) {
        state.floatingBtn.remove();
        state.floatingBtn = null;
        document.removeEventListener('click', removeFloatingButtonOnClick, true);
    }
}

/**
 * 翻译选中的文本
 * @param {string} text - 选中的文本
 * @param {DOMRect} rect - 选中文本的位置
 */
async function translateSelectedText(text, rect) {
    removeFloatingButton();
    
    // 显示加载状态
    const loadingBtn = document.createElement('button');
    loadingBtn.className = 'bilingual-translator-floating-btn loading';
    loadingBtn.innerHTML = `
        <span style="margin-right: 5px; animation: bilingual-spin 1s linear infinite;">⏳</span>
        <span>翻译中...</span>
    `;
    loadingBtn.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
    loadingBtn.style.top = `${rect.bottom + window.scrollY}px`;
    document.body.appendChild(loadingBtn);
    
    try {
        // 获取设置
        const settings = await getSettings();
        
        // 发送翻译请求到后台
        const translation = await sendTranslationRequest(text, settings.targetLanguage);
        
        // 移除加载按钮
        loadingBtn.remove();
        
        // 渲染翻译结果
        renderSelectionTranslation(text, translation, rect);
        
    } catch (error) {
        console.error('选中文本翻译失败:', error);
        loadingBtn.remove();
        showError('翻译失败: ' + error.message, rect);
    }
}

/**
 * 渲染选中文本的翻译结果
 * @param {string} originalText - 原文
 * @param {object} translation - 翻译结果
 * @param {DOMRect} rect - 原始位置
 */
function renderSelectionTranslation(originalText, translation, rect) {
    // 创建翻译容器
    const container = document.createElement('div');
    container.className = 'bilingual-translation-container';
    container.style.position = 'absolute';
    container.style.left = `${rect.left + window.scrollX}px`;
    container.style.top = `${rect.bottom + 10 + window.scrollY}px`;
    container.style.maxWidth = '500px';
    container.style.zIndex = '10001';
    
    // 填充内容
    container.innerHTML = `
        <button class="bilingual-translation-close">&times;</button>
        <div class="bilingual-original-text">${escapeHtml(originalText)}</div>
        <div class="bilingual-translated-text">${escapeHtml(translation.translatedText)}</div>
        <div class="bilingual-translation-meta" style="margin-top: 10px; font-size: 12px; color: #888;">
            <span>${translation.sourceLanguage} → ${translation.service === 'deepl' ? 'DeepL' : 'Google'}</span>
            <span style="margin-left: 10px;">${originalText.length}字</span>
        </div>
    `;
    
    // 添加关闭按钮事件
    const closeBtn = container.querySelector('.bilingual-translation-close');
    closeBtn.addEventListener('click', () => {
        container.remove();
    });
    
    document.body.appendChild(container);
    
    // 点击页面其他地方关闭翻译框
    setTimeout(() => {
        const closeOnClick = (event) => {
            if (!container.contains(event.target) && 
                !event.target.classList.contains('bilingual-translator-floating-btn')) {
                container.remove();
                document.removeEventListener('click', closeOnClick, true);
            }
        };
        document.addEventListener('click', closeOnClick, true);
    }, 100);
}

// ==================== 整页翻译 ====================

/**
 * 处理整页翻译请求
 * @param {object} request - 翻译请求
 */
async function handleTranslatePage(request) {
    console.log('开始整页翻译:', request);
    
    if (state.isTranslating) {
        console.log('已在翻译中，忽略重复请求');
        return;
    }
    
    state.isTranslating = true;
    state.translationStats.startTime = Date.now();
    state.translationStats.totalElements = 0;
    state.translationStats.translatedElements = 0;
    state.translationStats.totalCharacters = 0;
    
    try {
        // 显示加载状态
        showTranslationProgress('正在提取页面内容...', 0);
        
        // 提取页面内容
        const contentElements = extractPageContent();
        state.translationStats.totalElements = contentElements.length;
        
        if (contentElements.length === 0) {
            showError('未找到可翻译的页面内容');
            state.isTranslating = false;
            return;
        }
        
        showTranslationProgress(`找到 ${contentElements.length} 个内容块，开始翻译...`, 10);
        
        // 创建恢复按钮
        createRestoreButton();
        
        // 批量翻译（避免同时发送太多请求）
        const batchSize = 5;
        for (let i = 0; i < contentElements.length; i += batchSize) {
            const batch = contentElements.slice(i, i + batchSize);
            
            // 更新进度
            const progress = Math.min(10 + (i / contentElements.length) * 80, 90);
            showTranslationProgress(`正在翻译 ${i + 1}-${Math.min(i + batchSize, contentElements.length)}/${contentElements.length}...`, progress);
            
            // 并发翻译批次
            const batchPromises = batch.map((element, index) => 
                translateAndRenderElement(element, i + index, request.settings)
            );
            
            await Promise.all(batchPromises);
            
            // 添加延迟避免请求过于频繁
            if (i + batchSize < contentElements.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        // 完成
        state.translationStats.endTime = Date.now();
        const duration = (state.translationStats.endTime - state.translationStats.startTime) / 1000;
        
        showTranslationProgress(
            `翻译完成！共翻译 ${state.translationStats.translatedElements}/${state.translationStats.totalElements} 个内容块，${state.translationStats.totalCharacters} 字，耗时 ${duration.toFixed(1)} 秒`,
            100
        );
        
        // 发送完成消息到 popup
        try {
            chrome.runtime.sendMessage({
                type: 'translationComplete',
                message: `翻译完成！${state.translationStats.translatedElements}个内容块，${state.translationStats.totalCharacters}字`
            });
        } catch (error) {
            console.log('发送完成消息失败:', error);
        }
        
        // 显示统计信息
        showTranslationStats();
        
        // 3秒后隐藏进度
        setTimeout(() => {
            hideTranslationProgress();
        }, 3000);
        
    } catch (error) {
        console.error('整页翻译失败:', error);
        showError('翻译失败: ' + error.message);
        
        // 发送错误消息到 popup
        try {
            chrome.runtime.sendMessage({
                type: 'translationError',
                message: error.message || '翻译失败'
            });
        } catch (sendError) {
            console.log('发送错误消息失败:', sendError);
        }
        
        hideTranslationProgress();
    } finally {
        state.isTranslating = false;
    }
}

/**
 * 翻译并渲染单个元素
 * @param {HTMLElement} element - 要翻译的元素
 * @param {number} index - 元素索引
 * @param {object} settings - 翻译设置
 */
async function translateAndRenderElement(element, index, settings) {
    try {
        // 获取元素文本
        const originalText = element.innerText?.trim() || element.textContent?.trim();
        if (!originalText || originalText.length < 10) return;
        
        // 保存原始元素
        const elementId = `bilingual-original-${index}`;
        element.dataset.bilingualId = elementId;
        state.originalElements.set(elementId, {
            element: element,
            originalHTML: element.innerHTML,
            originalText: originalText
        });
        
        // 发送翻译请求
        const translation = await sendTranslationRequest(originalText, settings.targetLanguage);
        
        // 渲染双语对照
        const translationContainer = renderBilingualTranslation(originalText, translation, element);
        
        // 保存翻译容器
        state.translationContainers.set(elementId, translationContainer);
        
        // 更新统计
        state.translationStats.translatedElements++;
        state.translationStats.totalCharacters += originalText.length;
        
    } catch (error) {
        console.error(`翻译元素 ${index} 失败:`, error);
        // 标记翻译失败
        element.style.opacity = '0.7';
        element.title = `翻译失败: ${error.message}`;
    }
}

/**
 * 渲染双语对照翻译
 * @param {string} originalText - 原文
 * @param {object} translation - 翻译结果
 * @param {HTMLElement} originalElement - 原始元素
 * @returns {HTMLElement} 翻译容器
 */
function renderBilingualTranslation(originalText, translation, originalElement) {
    // 创建翻译容器
    const container = document.createElement('div');
    container.className = 'bilingual-translation-container';
    
    // 计算翻译服务名称
    const serviceName = translation.service === 'deepl' ? 'DeepL' : 'Google';
    
    // 填充内容
    container.innerHTML = `
        <button class="bilingual-translation-close" title="恢复原文">&times;</button>
        <div class="bilingual-original-text">${escapeHtml(originalText)}</div>
        <div class="bilingual-translated-text">${escapeHtml(translation.translatedText)}</div>
        <div class="bilingual-translation-meta" style="margin-top: 10px; font-size: 12px; color: #888;">
            <span>${translation.sourceLanguage} → ${serviceName}</span>
            <span style="margin-left: 10px;">${originalText.length}字</span>
            <span style="margin-left: 10px;">置信度: ${(translation.confidence * 100).toFixed(1)}%</span>
        </div>
    `;
    
    // 添加关闭按钮事件
    const closeBtn = container.querySelector('.bilingual-translation-close');
    closeBtn.addEventListener('click', () => {
        restoreOriginalElement(originalElement);
    });
    
    // 替换原始元素
    originalElement.parentNode.insertBefore(container, originalElement);
    originalElement.style.display = 'none';
    
    return container;
}

// ==================== 恢复功能 ====================

/**
 * 创建恢复按钮
 */
function createRestoreButton() {
    // 移除已有的恢复按钮
    if (state.restoreBtn) {
        state.restoreBtn.remove();
    }
    
    // 创建恢复按钮
    state.restoreBtn = document.createElement('button');
    state.restoreBtn.className = 'bilingual-restore-btn';
    state.restoreBtn.innerHTML = `
        <span style="margin-right: 5px;">↺</span>
        <span>恢复页面原样</span>
    `;
    
    // 添加点击事件
    state.restoreBtn.addEventListener('click', restoreAllOriginalElements);
    
    document.body.appendChild(state.restoreBtn);
}

/**
 * 恢复所有原始元素
 */
function restoreAllOriginalElements() {
    console.log('恢复所有原始元素');
    
    // 移除恢复按钮
    if (state.restoreBtn) {
        state.restoreBtn.remove();
        state.restoreBtn = null;
    }
    
    // 移除统计信息
    const statsElement = document.querySelector('.bilingual-translation-stats');
    if (statsElement) {
        statsElement.remove();
    }
    
    // 恢复所有元素
    state.originalElements.forEach((data, elementId) => {
        if (data.element && data.element.parentNode) {
            data.element.style.display = '';
            data.element.innerHTML = data.originalHTML;
            
            // 移除翻译容器
            const translationContainer = state.translationContainers.get(elementId);
            if (translationContainer && translationContainer.parentNode) {
                translationContainer.remove();
            }
        }
    });
    
    // 清理状态
    state.originalElements.clear();
    state.translationContainers.clear();
    
    showNotification('已恢复页面原样', 'success');
}

/**
 * 恢复单个原始元素
 * @param {HTMLElement} originalElement - 原始元素
 */
function restoreOriginalElement(originalElement) {
    const elementId = originalElement.dataset.bilingualId;
    if (!elementId) return;
    
    const data = state.originalElements.get(elementId);
    if (!data) return;
    
    // 显示原始元素
    originalElement.style.display = '';
    originalElement.innerHTML = data.originalHTML;
    
    // 移除翻译容器
    const translationContainer = state.translationContainers.get(elementId);
    if (translationContainer && translationContainer.parentNode) {
        translationContainer.remove();
    }
    
    // 从状态中移除
    state.originalElements.delete(elementId);
    state.translationContainers.delete(elementId);
}

// ==================== 辅助函数 ====================

/**
 * 发送翻译请求到后台
 * @param {string} text - 要翻译的文本
 * @param {string} targetLang - 目标语言
 * @returns {Promise<object>} 翻译结果
 */
function sendTranslationRequest(text, targetLang) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            type: 'translateText',
            text: text,
            targetLang: targetLang
        }, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            
            if (response.success) {
                resolve(response.result);
            } else {
                reject(new Error(response.error || '翻译失败'));
            }
        });
    });
}

/**
 * 获取设置
 * @returns {Promise<object>} 设置对象
 */
function getSettings() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            type: 'getSettings'
        }, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            
            resolve(response);
        });
    });
}

/**
 * 显示翻译进度
 * @param {string} message - 进度消息
 * @param {number} progress - 进度百分比 (0-100)
 */
function showTranslationProgress(message, progress) {
    // 移除已有的进度显示
    const existingProgress = document.querySelector('.bilingual-translation-progress');
    if (existingProgress) {
        existingProgress.remove();
    }
    
    // 创建进度显示
    const progressElement = document.createElement('div');
    progressElement.className = 'bilingual-translation-stats bilingual-translation-progress';
    progressElement.innerHTML = `
        <strong>双语翻译助手</strong>
        <div>${message}</div>
        <div style="margin-top: 8px;">
            <div style="background: #eef1f8; height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${progress}%; transition: width 0.3s;"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(progressElement);
    
    // 发送进度消息到 popup
    try {
        chrome.runtime.sendMessage({
            type: 'translationProgress',
            progress: progress,
            message: message
        });
    } catch (error) {
        console.log('发送进度消息失败（可能popup已关闭）:', error);
    }
}

/**
 * 隐藏翻译进度
 */
function hideTranslationProgress() {
    const progressElement = document.querySelector('.bilingual-translation-progress');
    if (progressElement) {
        progressElement.style.opacity = '0';
        progressElement.style.transform = 'translateY(-10px)';
        progressElement.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            if (progressElement.parentNode) {
                progressElement.remove();
            }
        }, 300);
    }
}

/**
 * 显示统计信息
 */
function showTranslationStats() {
    const stats = state.translationStats;
    const duration = stats.endTime ? (stats.endTime - stats.startTime) / 1000 : 0;
    
    const statsElement = document.createElement('div');
    statsElement.className = 'bilingual-translation-stats';
    statsElement.innerHTML = `
        <strong>翻译统计</strong>
        <div>翻译完成: ${stats.translatedElements}/${stats.totalElements} 个内容块</div>
        <div>总字数: ${stats.totalCharacters.toLocaleString()}</div>
        <div>耗时: ${duration.toFixed(1)} 秒</div>
        <div style="margin-top: 8px; font-size: 11px; color: #888;">
            点击右下角按钮恢复原样
        </div>
    `;
    
    document.body.appendChild(statsElement);
}

/**
 * 显示错误提示
 * @param {string} message - 错误消息
 * @param {DOMRect} rect - 显示位置（可选）
 */
function showError(message, rect = null) {
    const errorElement = document.createElement('div');
    errorElement.className = 'bilingual-error';
    errorElement.innerHTML = `
        <span style="margin-right: 5px;">⚠️</span>
        <span>${escapeHtml(message)}</span>
    `;
    
    if (rect) {
        errorElement.style.position = 'absolute';
        errorElement.style.left = `${rect.left + window.scrollX}px`;
        errorElement.style.top = `${rect.bottom + 10 + window.scrollY}px`;
        errorElement.style.maxWidth = '400px';
        errorElement.style.zIndex = '10001';
    }
    
    document.body.appendChild(errorElement);
    
    // 5秒后自动移除
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.remove();
        }
    }, 5000);
}

/**
 * 显示通知
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型 (success, error, info)
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `bilingual-translator-notification bilingual-translator-${type}`;
    notification.innerHTML = `
        <div class="bilingual-translator-notification-content">
            <strong>双语翻译助手:</strong> ${escapeHtml(message)}
        </div>
        <button class="bilingual-translator-notification-close">&times;</button>
    `;
    
    // 添加样式（如果还没有）
    if (!document.querySelector('#bilingual-translator-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'bilingual-translator-notification-styles';
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
            
            .bilingual-translator-success {
                border-left-color: #4CAF50;
            }
            
            .bilingual-translator-error {
                border-left-color: #F44336;
            }
            
            .bilingual-translator-info {
                border-left-color: #667eea;
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
    
    document.body.appendChild(notification);
    
    // 添加关闭按钮事件
    const closeBtn = notification.querySelector('.bilingual-translator-notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    // 5秒后自动消失
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

/**
 * HTML 转义
 * @param {string} text - 要转义的文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== 消息监听 ====================

/**
 * 处理选中内容翻译请求
 * @param {object} request - 翻译请求
 */
function handleTranslateSelection(request) {
    console.log('收到选中内容翻译请求');
    
    if (state.selectionMode) {
        state.selectionMode = false;
        showNotification('已退出划选翻译模式', 'info');
    } else {
        state.selectionMode = true;
        showNotification('已进入划选翻译模式，选中文本后点击悬浮按钮翻译', 'info');
    }
}

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

// ==================== 初始化 ====================

/**
 * 初始化内容脚本
 */
function init() {
    console.log('双语翻译助手内容脚本初始化完成');
    
    // 初始化选中文本翻译
    initSelectionTranslation();
    
    // 检查页面是否已经加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('页面加载完成，双语翻译助手已就绪');
        });
    } else {
        console.log('页面已加载，双语翻译助手已就绪');
    }
}

// 启动
init();
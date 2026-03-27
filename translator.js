/**
 * 双语翻译助手 - Google Translate 翻译模块
 * 
 * 使用 Google Translate 免费 API 进行文本翻译
 * API 端点: https://translate.googleapis.com/translate_a/single
 */

/**
 * 翻译文本
 * @param {string} text - 要翻译的文本
 * @param {string} targetLang - 目标语言代码 (如 'zh-CN', 'en')
 * @param {string} sourceLang - 源语言代码，默认为 'auto' (自动检测)
 * @returns {Promise<object>} 翻译结果对象
 *   - translatedText: 翻译后的文本
 *   - sourceLanguage: 检测到的源语言
 *   - confidence: 翻译置信度 (0-1)
 *   - characterCount: 字符数
 */
async function translateText(text, targetLang, sourceLang = 'auto') {
    // 输入验证
    if (text === undefined || text === null || typeof text !== 'string') {
        throw new Error('翻译文本不能为空或非字符串');
    }
    
    if (!targetLang || typeof targetLang !== 'string') {
        throw new Error('目标语言不能为空');
    }
    
    // 清理文本：移除多余空白字符
    const cleanedText = text.trim();
    if (!cleanedText) {
        return {
            translatedText: '',
            sourceLanguage: sourceLang === 'auto' ? 'unknown' : sourceLang,
            confidence: 0,
            characterCount: 0,
            originalText: ''
        };
    }
    
    try {
        // 处理长文本：Google Translate API 有长度限制
        // 免费 API 单次请求建议不超过 4000 字符
        const MAX_CHARS_PER_REQUEST = 4000;
        
        if (cleanedText.length <= MAX_CHARS_PER_REQUEST) {
            // 短文本直接翻译
            return await translateSegment(cleanedText, targetLang, sourceLang);
        } else {
            // 长文本分段翻译
            console.log(`文本长度 ${cleanedText.length} 字符，超过 ${MAX_CHARS_PER_REQUEST} 字符限制，进行分段翻译`);
            return await translateLongText(cleanedText, targetLang, sourceLang, MAX_CHARS_PER_REQUEST);
        }
    } catch (error) {
        console.error('翻译失败:', error);
        throw new Error(`翻译失败: ${error.message}`);
    }
}

/**
 * 翻译单个文本段
 * @param {string} text - 要翻译的文本段
 * @param {string} targetLang - 目标语言
 * @param {string} sourceLang - 源语言
 * @returns {Promise<object>} 翻译结果
 */
async function translateSegment(text, targetLang, sourceLang) {
    const API_URL = 'https://translate.googleapis.com/translate_a/single';
    
    // 构建请求参数
    const params = new URLSearchParams({
        client: 'gtx',           // Google Translate 客户端标识
        sl: sourceLang,          // 源语言 (auto 为自动检测)
        tl: targetLang,          // 目标语言
        dt: 't',                 // 返回翻译结果
        q: text                  // 要翻译的文本
    });
    
    const url = `${API_URL}?${params.toString()}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            // 处理 HTTP 错误
            const errorText = await response.text();
            console.error('Google Translate API 错误:', response.status, errorText);
            
            let errorMessage = `翻译请求失败: ${response.status}`;
            if (response.status === 429) {
                errorMessage = '请求过于频繁，请稍后再试';
            } else if (response.status === 403) {
                errorMessage = '访问被拒绝，请检查网络权限';
            } else if (response.status >= 500) {
                errorMessage = '翻译服务暂时不可用，请稍后再试';
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // 解析 Google Translate 返回的数据结构
        // 返回格式: [[["翻译结果", "原文", null, null, 1]], null, "检测到的语言", null, null, null, 1, [], null, [], []]
        let translatedText = '';
        let detectedSourceLang = sourceLang;
        
        if (Array.isArray(data) && data[0]) {
            // 提取所有翻译片段并拼接
            for (const segment of data[0]) {
                if (segment && segment[0]) {
                    translatedText += segment[0];
                }
            }
        }
        
        // 获取检测到的源语言
        if (sourceLang === 'auto' && data[2]) {
            detectedSourceLang = data[2];
        }
        
        // 计算置信度（如果有）
        let confidence = 1.0;
        if (data[6] !== undefined && data[6] !== null) {
            confidence = parseFloat(data[6]);
        }
        
        return {
            translatedText: translatedText || text, // 如果翻译失败，返回原文
            sourceLanguage: detectedSourceLang,
            confidence: Math.min(Math.max(confidence, 0), 1), // 确保在 0-1 范围内
            characterCount: text.length,
            originalText: text
        };
        
    } catch (error) {
        // 网络错误或其他异常
        console.error('翻译请求异常:', error);
        
        // 检查是否为网络错误
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('网络连接失败，请检查网络设置');
        }
        
        throw error;
    }
}

/**
 * 翻译长文本（分段处理）
 * @param {string} longText - 长文本
 * @param {string} targetLang - 目标语言
 * @param {string} sourceLang - 源语言
 * @param {number} maxCharsPerSegment - 每段最大字符数
 * @returns {Promise<object>} 合并后的翻译结果
 */
async function translateLongText(longText, targetLang, sourceLang, maxCharsPerSegment = 4000) {
    // 按段落、句子或固定长度分段，尽量保持语义完整
    const segments = splitTextIntoSegments(longText, maxCharsPerSegment);
    
    console.log(`将文本分为 ${segments.length} 段进行翻译`);
    
    // 逐段翻译
    const translationPromises = segments.map((segment, index) => {
        // 添加延迟以避免请求过于频繁
        const delay = index * 100; // 每段之间延迟 100ms
        return new Promise(resolve => {
            setTimeout(async () => {
                try {
                    const result = await translateSegment(segment, targetLang, sourceLang);
                    resolve({ ...result, segmentIndex: index });
                } catch (error) {
                    console.error(`第 ${index + 1} 段翻译失败:`, error);
                    // 如果某段失败，返回原文
                    resolve({
                        translatedText: segment,
                        sourceLanguage: sourceLang === 'auto' ? 'unknown' : sourceLang,
                        confidence: 0,
                        characterCount: segment.length,
                        originalText: segment,
                        segmentIndex: index,
                        error: error.message
                    });
                }
            }, delay);
        });
    });
    
    // 等待所有段翻译完成
    const results = await Promise.all(translationPromises);
    
    // 按原始顺序合并结果
    results.sort((a, b) => a.segmentIndex - b.segmentIndex);
    
    let combinedTranslatedText = '';
    let combinedOriginalText = '';
    let totalConfidence = 0;
    let successfulSegments = 0;
    let detectedSourceLang = sourceLang === 'auto' ? 'unknown' : sourceLang;
    
    for (const result of results) {
        combinedTranslatedText += result.translatedText;
        combinedOriginalText += result.originalText;
        
        if (result.confidence > 0) {
            totalConfidence += result.confidence;
            successfulSegments++;
        }
        
        // 使用第一个成功检测到的语言作为源语言
        if (detectedSourceLang === 'unknown' && result.sourceLanguage !== 'unknown') {
            detectedSourceLang = result.sourceLanguage;
        }
    }
    
    const averageConfidence = successfulSegments > 0 ? totalConfidence / successfulSegments : 0;
    
    return {
        translatedText: combinedTranslatedText,
        sourceLanguage: detectedSourceLang,
        confidence: averageConfidence,
        characterCount: longText.length,
        originalText: combinedOriginalText,
        segmentCount: segments.length,
        successfulSegments: successfulSegments
    };
}

/**
 * 将文本分割为适合翻译的段落
 * @param {string} text - 要分割的文本
 * @param {number} maxChars - 每段最大字符数
 * @returns {string[]} 文本段数组
 */
function splitTextIntoSegments(text, maxChars) {
    const segments = [];
    let remainingText = text;
    
    // 首先尝试按段落分割
    const paragraphs = remainingText.split(/\n\s*\n/);
    
    for (const paragraph of paragraphs) {
        if (paragraph.length <= maxChars) {
            // 段落长度合适，直接作为一个段
            if (paragraph.trim()) {
                segments.push(paragraph.trim());
            }
        } else {
            // 段落太长，按句子分割
            const sentences = paragraph.split(/[.!?。！？]+/);
            let currentSegment = '';
            
            for (const sentence of sentences) {
                const trimmedSentence = sentence.trim();
                if (!trimmedSentence) continue;
                
                const sentenceWithPunctuation = trimmedSentence + (paragraph.includes(sentence + '.') ? '.' : '');
                
                if (currentSegment.length + sentenceWithPunctuation.length <= maxChars) {
                    currentSegment += (currentSegment ? ' ' : '') + sentenceWithPunctuation;
                } else {
                    if (currentSegment) {
                        segments.push(currentSegment);
                    }
                    // 如果单个句子就超过最大长度，强制分割
                    if (sentenceWithPunctuation.length > maxChars) {
                        const chunks = splitByLength(sentenceWithPunctuation, maxChars);
                        segments.push(...chunks);
                        currentSegment = '';
                    } else {
                        currentSegment = sentenceWithPunctuation;
                    }
                }
            }
            
            if (currentSegment) {
                segments.push(currentSegment);
            }
        }
    }
    
    // 如果没有找到合适的分割（例如没有段落或句子标记），按长度强制分割
    if (segments.length === 0) {
        return splitByLength(text, maxChars);
    }
    
    return segments;
}

/**
 * 按固定长度分割文本（最后手段）
 * @param {string} text - 要分割的文本
 * @param {number} maxChars - 每段最大字符数
 * @returns {string[]} 文本段数组
 */
function splitByLength(text, maxChars) {
    const chunks = [];
    for (let i = 0; i < text.length; i += maxChars) {
        chunks.push(text.substring(i, i + maxChars));
    }
    return chunks;
}

/**
 * 获取支持的语言列表（Google Translate 支持的语言）
 * @returns {object} 语言代码到名称的映射
 */
function getSupportedLanguages() {
    return {
        'auto': '自动检测',
        'zh-CN': '简体中文',
        'zh-TW': '繁体中文',
        'en': '英语',
        'ja': '日语',
        'ko': '韩语',
        'fr': '法语',
        'de': '德语',
        'es': '西班牙语',
        'ru': '俄语',
        'pt': '葡萄牙语',
        'it': '意大利语',
        'nl': '荷兰语',
        'pl': '波兰语',
        'ar': '阿拉伯语',
        'th': '泰语',
        'tr': '土耳其语',
        'vi': '越南语',
        'hi': '印地语',
        'id': '印尼语'
    };
}

/**
 * 验证语言代码是否受支持
 * @param {string} langCode - 语言代码
 * @returns {boolean} 是否支持
 */
function isValidLanguageCode(langCode) {
    const languages = getSupportedLanguages();
    return langCode in languages;
}

// 导出函数（如果作为模块使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        translateText,
        getSupportedLanguages,
        isValidLanguageCode
    };
}

// 全局可用（在浏览器环境中）
if (typeof window !== 'undefined') {
    window.GoogleTranslator = {
        translateText,
        getSupportedLanguages,
        isValidLanguageCode
    };
}

// 在 Service Worker 环境中也可用
if (typeof self !== 'undefined' && typeof window === 'undefined') {
    self.GoogleTranslator = {
        translateText,
        getSupportedLanguages,
        isValidLanguageCode
    };
}
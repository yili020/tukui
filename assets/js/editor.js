/**
 * CodeLearn - 代码编辑器封装
 * 基于 CodeMirror 的代码编辑器管理
 */

const Editor = {
    // CodeMirror 实例
    instance: null,
    
    // 当前编辑的文件
    currentFile: null,
    
    // 文件内容缓存
    fileContents: new Map(),
    
    // 配置选项
    options: {
        theme: 'dracula',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        lineWrapping: true,
        foldGutter: false,
        gutters: ['CodeMirror-linenumbers'],
        scrollbarStyle: 'native',
        viewportMargin: Infinity
    },
    
    /**
     * 初始化编辑器
     * @param {HTMLElement} container - 容器元素
     * @param {Object} customOptions - 自定义选项
     * @returns {CodeMirror} CodeMirror 实例
     */
    init(container, customOptions = {}) {
        // 合并选项
        const options = { ...this.options, ...customOptions };
        
        // 创建 CodeMirror 实例
        this.instance = CodeMirror(container, options);
        
        // 设置初始大小
        this.refresh();
        
        return this.instance;
    },
    
    /**
     * 设置编辑器内容
     * @param {string} content - 代码内容
     * @param {string} language - 语言模式
     */
    setContent(content, language = 'text') {
        if (!this.instance) return;
        
        // 设置语言模式
        this.instance.setOption('mode', language);
        
        // 设置内容
        this.instance.setValue(content || '');
        
        // 清除历史记录
        this.instance.clearHistory();
        
        // 刷新编辑器
        this.refresh();
    },
    
    /**
     * 获取编辑器内容
     * @returns {string} 代码内容
     */
    getContent() {
        if (!this.instance) return '';
        return this.instance.getValue();
    },
    
    /**
     * 设置语言模式
     * @param {string} language - 语言模式
     */
    setLanguage(language) {
        if (!this.instance) return;
        this.instance.setOption('mode', language);
    },
    
    /**
     * 设置只读模式
     * @param {boolean} readonly - 是否只读
     */
    setReadOnly(readonly) {
        if (!this.instance) return;
        this.instance.setOption('readOnly', readonly);
    },
    
    /**
     * 刷新编辑器
     */
    refresh() {
        if (!this.instance) return;
        this.instance.refresh();
    },
    
    /**
     * 调整编辑器大小
     */
    resize() {
        if (!this.instance) return;
        this.instance.setSize('100%', '100%');
        this.refresh();
    },
    
    /**
     * 绑定内容变化事件
     * @param {Function} callback - 回调函数
     */
    onChange(callback) {
        if (!this.instance) return;
        this.instance.on('change', callback);
    },
    
    /**
     * 绑定光标活动事件
     * @param {Function} callback - 回调函数
     */
    onCursorActivity(callback) {
        if (!this.instance) return;
        this.instance.on('cursorActivity', callback);
    },
    
    /**
     * 获取当前文件名
     * @returns {string|null} 文件名
     */
    getCurrentFile() {
        return this.currentFile;
    },
    
    /**
     * 设置当前文件
     * @param {string} filename - 文件名
     * @param {string} content - 文件内容
     * @param {string} language - 语言模式
     * @param {boolean} editable - 是否可编辑
     */
    setCurrentFile(filename, content, language, editable = true) {
        // 保存之前文件的内容
        if (this.currentFile && this.instance) {
            this.fileContents.set(this.currentFile, this.getContent());
        }
        
        this.currentFile = filename;
        
        // 检查是否有缓存的内容
        const cachedContent = this.fileContents.get(filename);
        const finalContent = cachedContent !== undefined ? cachedContent : content;
        
        // 设置编辑器
        this.setContent(finalContent, language);
        this.setReadOnly(!editable);
        
        // 刷新
        this.refresh();
    },
    
    /**
     * 保存当前文件内容到缓存
     */
    saveCurrentFile() {
        if (this.currentFile && this.instance) {
            this.fileContents.set(this.currentFile, this.getContent());
        }
    },
    
    /**
     * 获取所有文件内容
     * @returns {Object} 文件名到内容的映射
     */
    getAllContents() {
        // 先保存当前文件
        this.saveCurrentFile();
        
        const contents = {};
        this.fileContents.forEach((content, filename) => {
            contents[filename] = content;
        });
        
        return contents;
    },
    
    /**
     * 设置多个文件内容
     * @param {Object} contents - 文件名到内容的映射
     */
    setAllContents(contents) {
        this.fileContents.clear();
        for (const [filename, content] of Object.entries(contents)) {
            this.fileContents.set(filename, content);
        }
    },
    
    /**
     * 清除所有缓存
     */
    clear() {
        this.fileContents.clear();
        this.currentFile = null;
        if (this.instance) {
            this.setContent('', 'text');
        }
    },
    
    /**
     * 销毁编辑器
     */
    destroy() {
        if (this.instance) {
            this.instance.toTextArea();
            this.instance = null;
        }
        this.fileContents.clear();
        this.currentFile = null;
    },
    
    /**
     * 设置主题
     * @param {string} theme - 主题名称
     */
    setTheme(theme) {
        if (!this.instance) return;
        this.instance.setOption('theme', theme);
    },
    
    /**
     * 设置字体大小
     * @param {number} size - 字体大小
     */
    setFontSize(size) {
        if (!this.instance) return;
        const wrapper = this.instance.getWrapperElement();
        wrapper.style.fontSize = size + 'px';
        this.refresh();
    },
    
    /**
     * 插入文本
     * @param {string} text - 要插入的文本
     */
    insertText(text) {
        if (!this.instance) return;
        const doc = this.instance.getDoc();
        const cursor = doc.getCursor();
        doc.replaceRange(text, cursor);
    },
    
    /**
     * 获取选中的文本
     * @returns {string} 选中的文本
     */
    getSelection() {
        if (!this.instance) return '';
        return this.instance.getSelection();
    },
    
    /**
     * 替换选中的文本
     * @param {string} text - 替换的文本
     */
    replaceSelection(text) {
        if (!this.instance) return;
        this.instance.replaceSelection(text);
    },
    
    /**
     * 格式化代码（简单的缩进调整）
     */
    formatCode() {
        if (!this.instance) return;
        
        const content = this.getContent();
        const mode = this.instance.getMode().name;
        
        // 简单的格式化：统一缩进
        const lines = content.split('\n');
        let indentLevel = 0;
        const indentSize = this.options.indentUnit;
        const formattedLines = lines.map(line => {
            const trimmed = line.trim();
            
            // 减少缩进的情况
            if (trimmed.startsWith('</') || trimmed.startsWith('}') || trimmed.startsWith(']')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            const formatted = ' '.repeat(indentLevel * indentSize) + trimmed;
            
            // 增加缩进的情况
            if (trimmed.endsWith('{') || trimmed.endsWith('[') || 
                trimmed.endsWith('>') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
                indentLevel++;
            }
            
            return formatted;
        });
        
        this.setContent(formattedLines.join('\n'), mode);
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Editor;
}

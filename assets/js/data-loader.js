/**
 * CodeLearn - 数据加载器
 * 负责加载和管理课程数据
 */

const DataLoader = {
    // 缓存的课程数据
    cache: new Map(),
    
    /**
     * 加载课程数据
     * @param {string} courseId - 课程ID
     * @returns {Promise<Object>} 课程数据
     */
    async loadCourse(courseId) {
        // 检查缓存
        if (this.cache.has(courseId)) {
            return this.cache.get(courseId);
        }
        
        try {
            const response = await fetch(`data/courses/${courseId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load course: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 验证数据格式
            if (!this.validateCourse(data)) {
                throw new Error('Invalid course data format');
            }
            
            // 缓存数据
            this.cache.set(courseId, data);
            
            return data;
        } catch (error) {
            console.error('Error loading course:', error);
            throw error;
        }
    },
    
    /**
     * 验证课程数据格式
     * @param {Object} data - 课程数据
     * @returns {boolean} 是否有效
     */
    validateCourse(data) {
        if (!data || typeof data !== 'object') return false;
        if (!data.id || typeof data.id !== 'string') return false;
        if (!data.title || typeof data.title !== 'string') return false;
        if (!Array.isArray(data.steps)) return false;
        
        // 验证每个步骤
        for (const step of data.steps) {
            if (!step.id || typeof step.id !== 'string') return false;
            if (!step.title || typeof step.title !== 'string') return false;
            if (!step.mode || !['learn', 'practice'].includes(step.mode)) return false;
            if (!step.files || typeof step.files !== 'object') return false;
        }
        
        return true;
    },
    
    /**
     * 获取课程列表
     * @returns {Promise<Array>} 课程列表
     */
    async getCourseList() {
        // MVP 阶段，直接返回固定的课程列表
        // 后续可以从服务器或索引文件加载
        return [
            {
                id: 'html-basics',
                title: 'HTML 基础入门',
                category: '前端开发',
                description: '学习 HTML 的基础知识，创建你的第一个网页',
                stepCount: 4
            }
        ];
    },
    
    /**
     * 获取步骤数据
     * @param {Object} course - 课程数据
     * @param {number} stepIndex - 步骤索引
     * @returns {Object|null} 步骤数据
     */
    getStep(course, stepIndex) {
        if (!course || !course.steps) return null;
        if (stepIndex < 0 || stepIndex >= course.steps.length) return null;
        return course.steps[stepIndex];
    },
    
    /**
     * 获取文件语言类型
     * @param {string} filename - 文件名
     * @returns {string} 语言类型
     */
    getFileLanguage(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const langMap = {
            'html': 'htmlmixed',
            'htm': 'htmlmixed',
            'css': 'css',
            'js': 'javascript',
            'javascript': 'javascript',
            'json': 'javascript',
            'xml': 'xml',
            'svg': 'xml'
        };
        return langMap[ext] || 'text';
    },
    
    /**
     * 获取文件图标
     * @param {string} filename - 文件名
     * @returns {string} 图标
     */
    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'html': '📄',
            'htm': '📄',
            'css': '🎨',
            'js': '⚡',
            'javascript': '⚡',
            'json': '📋',
            'md': '📝',
            'txt': '📃'
        };
        return iconMap[ext] || '📄';
    },
    
    /**
     * 生成预览 HTML
     * @param {Object} files - 文件对象
     * @returns {string} 完整的 HTML 文档
     */
    generatePreviewHTML(files) {
        let html = '';
        let css = '';
        let js = '';
        
        // 提取各类型文件内容
        for (const [filename, fileData] of Object.entries(files)) {
            const ext = filename.split('.').pop().toLowerCase();
            const content = fileData.content || '';
            
            if (ext === 'html' || ext === 'htm') {
                html = content;
            } else if (ext === 'css') {
                css = content;
            } else if (ext === 'js' || ext === 'javascript') {
                js = content;
            }
        }
        
        // 如果已经有完整的 HTML 文档，直接返回
        if (html.includes('<!DOCTYPE') || html.includes('<html')) {
            // 注入 CSS 和 JS
            let result = html;
            
            // 在 </head> 前插入 CSS
            if (css) {
                const styleTag = `<style>${css}</style>`;
                if (result.includes('</head>')) {
                    result = result.replace('</head>', `${styleTag}</head>`);
                } else if (result.includes('<html')) {
                    result = result.replace('<html', `<head>${styleTag}</head><html`);
                }
            }
            
            // 在 </body> 前插入 JS
            if (js) {
                const scriptTag = `<script>${js}<\/script>`;
                if (result.includes('</body>')) {
                    result = result.replace('</body>', `${scriptTag}</body>`);
                } else if (result.includes('</html>')) {
                    result = result.replace('</html>', `${scriptTag}</html>`);
                } else {
                    result += scriptTag;
                }
            }
            
            return result;
        }
        
        // 构建完整的 HTML 文档
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>预览</title>
    ${css ? `<style>${css}</style>` : ''}
</head>
<body>
    ${html}
    ${js ? `<script>${js}<\/script>` : ''}
</body>
</html>`;
    },
    
    /**
     * 合并用户代码到文件
     * @param {Object} files - 原始文件
     * @param {Object} userCodes - 用户代码
     * @returns {Object} 合并后的文件
     */
    mergeUserCodes(files, userCodes) {
        const merged = {};
        
        for (const [filename, fileData] of Object.entries(files)) {
            merged[filename] = {
                ...fileData,
                content: userCodes[filename] !== undefined 
                    ? userCodes[filename] 
                    : fileData.content
            };
        }
        
        return merged;
    },
    
    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
}

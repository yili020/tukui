/**
 * CodeLearn - 本地存储管理
 * 管理学习进度和用户代码的本地存储
 */

const Storage = {
    // 存储键名前缀
    PREFIX: 'codelearn_',
    
    /**
     * 获取存储键
     * @param {string} key - 键名
     * @returns {string} 完整键名
     */
    getKey(key) {
        return this.PREFIX + key;
    },
    
    /**
     * 保存数据
     * @param {string} key - 键名
     * @param {*} value - 值
     */
    set(key, value) {
        try {
            const data = JSON.stringify(value);
            localStorage.setItem(this.getKey(key), data);
        } catch (e) {
            console.error('Storage set error:', e);
        }
    },
    
    /**
     * 读取数据
     * @param {string} key - 键名
     * @param {*} defaultValue - 默认值
     * @returns {*} 存储的值或默认值
     */
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(this.getKey(key));
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },
    
    /**
     * 删除数据
     * @param {string} key - 键名
     */
    remove(key) {
        localStorage.removeItem(this.getKey(key));
    },
    
    /**
     * 清空所有 CodeLearn 数据
     */
    clear() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.PREFIX)) {
                keys.push(key);
            }
        }
        keys.forEach(key => localStorage.removeItem(key));
    },
    
    // ==================== 课程进度 ====================
    
    /**
     * 保存课程进度
     * @param {string} courseId - 课程ID
     * @param {number} stepIndex - 步骤索引
     */
    saveProgress(courseId, stepIndex) {
        const progress = this.getProgress(courseId);
        progress.currentStep = stepIndex;
        progress.lastAccessed = Date.now();
        this.set(`progress_${courseId}`, progress);
    },
    
    /**
     * 获取课程进度
     * @param {string} courseId - 课程ID
     * @returns {Object} 进度对象
     */
    getProgress(courseId) {
        return this.get(`progress_${courseId}`, {
            currentStep: 0,
            completedSteps: [],
            lastAccessed: null
        });
    },
    
    /**
     * 标记步骤完成
     * @param {string} courseId - 课程ID
     * @param {number} stepIndex - 步骤索引
     */
    markStepCompleted(courseId, stepIndex) {
        const progress = this.getProgress(courseId);
        if (!progress.completedSteps.includes(stepIndex)) {
            progress.completedSteps.push(stepIndex);
            progress.completedSteps.sort((a, b) => a - b);
        }
        this.set(`progress_${courseId}`, progress);
    },
    
    /**
     * 检查步骤是否完成
     * @param {string} courseId - 课程ID
     * @param {number} stepIndex - 步骤索引
     * @returns {boolean} 是否完成
     */
    isStepCompleted(courseId, stepIndex) {
        const progress = this.getProgress(courseId);
        return progress.completedSteps.includes(stepIndex);
    },
    
    // ==================== 用户代码 ====================
    
    /**
     * 保存用户代码
     * @param {string} courseId - 课程ID
     * @param {number} stepIndex - 步骤索引
     * @param {string} filename - 文件名
     * @param {string} code - 代码内容
     */
    saveUserCode(courseId, stepIndex, filename, code) {
        const key = `code_${courseId}_${stepIndex}_${filename}`;
        this.set(key, {
            code: code,
            savedAt: Date.now()
        });
    },
    
    /**
     * 获取用户代码
     * @param {string} courseId - 课程ID
     * @param {number} stepIndex - 步骤索引
     * @param {string} filename - 文件名
     * @returns {string|null} 代码内容或null
     */
    getUserCode(courseId, stepIndex, filename) {
        const key = `code_${courseId}_${stepIndex}_${filename}`;
        const data = this.get(key);
        return data ? data.code : null;
    },
    
    /**
     * 获取步骤的所有用户代码
     * @param {string} courseId - 课程ID
     * @param {number} stepIndex - 步骤索引
     * @returns {Object} 文件名到代码的映射
     */
    getStepUserCodes(courseId, stepIndex) {
        const codes = {};
        const prefix = this.getKey(`code_${courseId}_${stepIndex}_`);
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                const filename = key.replace(prefix, '');
                const data = this.get(key.replace(this.PREFIX, ''));
                if (data) {
                    codes[filename] = data.code;
                }
            }
        }
        
        return codes;
    },
    
    /**
     * 清除步骤的用户代码
     * @param {string} courseId - 课程ID
     * @param {number} stepIndex - 步骤索引
     */
    clearStepUserCodes(courseId, stepIndex) {
        const prefix = this.getKey(`code_${courseId}_${stepIndex}_`);
        const keys = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keys.push(key);
            }
        }
        
        keys.forEach(key => localStorage.removeItem(key));
    },
    
    // ==================== 设置 ====================
    
    /**
     * 保存设置
     * @param {Object} settings - 设置对象
     */
    saveSettings(settings) {
        this.set('settings', settings);
    },
    
    /**
     * 获取设置
     * @returns {Object} 设置对象
     */
    getSettings() {
        return this.get('settings', {
            autoRun: true,
            theme: 'dracula',
            fontSize: 14
        });
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}

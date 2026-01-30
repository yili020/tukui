// scripts/app.js
class LearningApp {
    constructor() {
        this.lessonManager = new LessonManager();
        this.previewFrame = document.getElementById('preview-frame');
        this.previewError = document.getElementById('preview-error');
        
        // 确保DOM加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        console.log('应用初始化开始');
        
        // 设置事件监听
        this.setupEventListeners();
        
        // 渲染当前步骤
        this.renderCurrentStep();
        
        // 更新导航状态
        this.updateNavigation();
        
        // 初始化代码高亮
        if (window.hljs) {
            hljs.highlightAll();
        }
        
        console.log('应用初始化完成');
    }

    setupEventListeners() {
        console.log('设置事件监听器');
        
        // 导航按钮
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                console.log('点击上一步');
                if (this.lessonManager.prevStep()) {
                    this.renderCurrentStep();
                    this.updateNavigation();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                console.log('点击下一步');
                if (this.lessonManager.nextStep()) {
                    this.renderCurrentStep();
                    this.updateNavigation();
                }
            });
        }

        // 运行代码
        const runBtn = document.getElementById('run-code');
        if (runBtn) {
            runBtn.addEventListener('click', () => {
                console.log('运行代码');
                this.runCode();
            });
        }

        // 重置代码
        const resetBtn = document.getElementById('reset-code');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                console.log('重置代码');
                this.resetCurrentCode();
            });
        }

        // 代码编辑器输入监听
        const codeEditor = document.getElementById('code-editor');
        if (codeEditor) {
            codeEditor.addEventListener('input', (e) => {
                const step = this.lessonManager.getCurrentStep();
                if (step?.type === 'practice') {
                    this.lessonManager.setCurrentUserCode(e.target.value);
                    console.log('用户代码已保存');
                }
            });
        }

        // 课程导入 - 修复这里！
        const importBtn = document.getElementById('import-lesson');
        const fileInput = document.getElementById('lesson-file');
        
        if (importBtn && fileInput) {
            console.log('找到导入按钮和文件输入');
            
            // 点击导入按钮触发文件选择
            importBtn.addEventListener('click', () => {
                console.log('点击导入课程按钮');
                fileInput.click();
            });
            
            // 文件选择变化事件
            fileInput.addEventListener('change', async (e) => {
                console.log('文件选择改变');
                const file = e.target.files[0];
                if (file) {
                    console.log('选择的文件:', file.name, file.type, file.size);
                    await this.importCourse(file);
                    // 清除选择，允许重新选择同一文件
                    e.target.value = '';
                }
            });
        } else {
            console.error('找不到导入按钮或文件输入:', { importBtn, fileInput });
        }

        // 保存用户代码的回调函数
        this.lessonManager.getCurrentUserCode = () => {
            const step = this.lessonManager.getCurrentStep();
            if (step?.type === 'practice') {
                return document.getElementById('code-editor')?.value || '';
            }
            return '';
        };
    }

    renderCurrentStep() {
        const step = this.lessonManager.getCurrentStep();
        if (!step) {
            console.error('没有找到当前步骤');
            return;
        }

        console.log('渲染步骤:', step.id, step.title, step.type);

        // 更新标题和步骤信息
        document.getElementById('course-title').textContent = this.lessonManager.currentCourse.title;
        document.getElementById('step-title-display').textContent = step.title;
        document.getElementById('current-step').textContent = step.id;
        document.getElementById('total-steps').textContent = this.lessonManager.getTotalSteps();

        // 根据步骤类型显示不同界面
        if (step.type === 'learn') {
            this.showLearnMode(step);
        } else {
            this.showPracticeMode(step);
        }

        // 更新代码高亮
        setTimeout(() => {
            if (window.hljs) {
                hljs.highlightAll();
            }
        }, 100);
    }

    showLearnMode(step) {
        console.log('显示学习模式');
        
        // 更新UI状态
        document.getElementById('step-type').textContent = '学习模式';
        document.getElementById('preview-title').textContent = '示例效果';
        document.getElementById('code-title').textContent = '代码解释';
        
        // 显示学习面板，隐藏练习面板
        document.getElementById('learn-panel').classList.add('active');
        document.getElementById('practice-panel').classList.remove('active');

        // 设置学习内容
        document.getElementById('learn-title').textContent = step.title;
        document.getElementById('learn-description').textContent = step.explanation || '暂无说明';
        
        const exampleCodeElement = document.getElementById('example-code');
        exampleCodeElement.textContent = step.exampleCode || '// 暂无示例代码';
        exampleCodeElement.className = 'language-html';

        // 显示示例效果
        this.renderPreview(step.exampleCode || '');
    }

    showPracticeMode(step) {
        console.log('显示练习模式');
        
        // 更新UI状态
        document.getElementById('step-type').textContent = '练习模式';
        document.getElementById('preview-title').textContent = '你的代码效果';
        document.getElementById('code-title').textContent = '代码编辑器';
        
        // 显示练习面板，隐藏学习面板
        document.getElementById('practice-panel').classList.add('active');
        document.getElementById('learn-panel').classList.remove('active');

        // 设置练习内容
        const practiceTitle = step.practiceTitle || step.title;
        document.getElementById('practice-title').textContent = practiceTitle;
        
        // 设置任务列表
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';
        if (step.tasks && Array.isArray(step.tasks)) {
            step.tasks.forEach(task => {
                const li = document.createElement('li');
                li.textContent = task;
                taskList.appendChild(li);
            });
        } else {
            taskList.innerHTML = '<li>暂无具体任务要求</li>';
        }

        // 设置提示
        document.getElementById('hint-text').textContent = step.hint || '暂无提示';

        // 获取用户代码（保存的或初始的）
        const userCode = this.lessonManager.getUserCode(step.id) || step.initialCode || '// 开始编写你的代码...';
        const codeEditor = document.getElementById('code-editor');
        if (codeEditor) {
            codeEditor.value = userCode;
            codeEditor.focus();
        }

        // 显示用户代码效果
        this.renderPreview(userCode);
    }

    renderPreview(code) {
        if (!this.previewFrame || !this.previewError) return;

        try {
            const frameDoc = this.previewFrame.contentDocument || 
                           this.previewFrame.contentWindow.document;
            
            // 隐藏错误信息
            this.previewError.style.display = 'none';
            this.previewFrame.style.display = 'block';
            
            frameDoc.open();
            frameDoc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            padding: 20px;
                            margin: 0;
                            background: white;
                            min-height: 100vh;
                        }
                        .preview-content {
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        h1, h2, h3, h4, h5, h6 {
                            margin: 1em 0 0.5em 0;
                            color: #333;
                        }
                        p {
                            margin: 0.5em 0;
                            line-height: 1.6;
                        }
                        a {
                            color: #0066cc;
                            text-decoration: none;
                        }
                        a:hover {
                            text-decoration: underline;
                        }
                        code {
                            background: #f5f5f5;
                            padding: 2px 4px;
                            border-radius: 3px;
                            font-family: monospace;
                        }
                        .error {
                            color: #dc3545;
                            background: #f8d7da;
                            padding: 10px;
                            border-radius: 4px;
                            margin: 10px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="preview-content">
                        ${code}
                    </div>
                    <script>
                        // 捕获可能的JavaScript错误
                        window.onerror = function(msg, url, line, col, error) {
                            console.error('预览错误:', msg);
                        };
                    <\/script>
                </body>
                </html>
            `);
            frameDoc.close();
        } catch (error) {
            console.error('预览渲染失败:', error);
            this.showPreviewError('预览渲染失败: ' + error.message);
        }
    }

    showPreviewError(message) {
        this.previewFrame.style.display = 'none';
        this.previewError.style.display = 'block';
        this.previewError.textContent = message;
    }

    runCode() {
        const step = this.lessonManager.getCurrentStep();
        if (!step) return;

        console.log('运行代码，步骤类型:', step.type);

        if (step.type === 'learn') {
            // 学习模式：显示示例代码
            this.renderPreview(step.exampleCode || '');
        } else {
            // 练习模式：显示用户代码
            const codeEditor = document.getElementById('code-editor');
            const userCode = codeEditor?.value || '';
            
            // 保存用户代码
            this.lessonManager.setCurrentUserCode(userCode);
            console.log('用户代码已保存');
            
            // 显示预览
            this.renderPreview(userCode);
        }
    }

    resetCurrentCode() {
        const step = this.lessonManager.getCurrentStep();
        if (step?.type === 'practice') {
            const resetCode = this.lessonManager.resetCurrentStep();
            if (resetCode !== null) {
                const codeEditor = document.getElementById('code-editor');
                if (codeEditor) {
                    codeEditor.value = resetCode;
                    this.renderPreview(resetCode);
                    this.showToast('代码已重置为初始状态');
                }
            }
        } else {
            this.showToast('当前不是练习模式，无法重置');
        }
    }

    updateNavigation() {
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        
        if (prevBtn) prevBtn.disabled = this.lessonManager.isFirstStep();
        if (nextBtn) nextBtn.disabled = this.lessonManager.isLastStep();
    }

    async importCourse(file) {
        console.log('开始导入课程文件:', file.name);
        
        // 显示加载状态
        this.showLoading(true);
        
        try {
            // 检查文件类型
            if (!file.name.toLowerCase().endsWith('.json')) {
                throw new Error('请选择JSON格式的课程文件');
            }
            
            await this.lessonManager.importCourseFromFile(file);
            console.log('课程导入成功');
            
            this.renderCurrentStep();
            this.updateNavigation();
            this.showToast('课程导入成功！');
            
        } catch (error) {
            console.error('导入失败:', error);
            this.showToast(`导入失败: ${error.message}`);
        } finally {
            // 隐藏加载状态
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    showToast(message, duration = 3000) {
        console.log('显示提示:', message);
        
        // 移除已有的toast
        const existingToasts = document.querySelectorAll('.toast-message');
        existingToasts.forEach(toast => toast.remove());
        
        // 创建新的toast
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 1000;
            animation: fadeInOut ${duration}ms ease-in-out;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
            word-break: break-word;
        `;
        
        document.body.appendChild(toast);
        
        // 添加动画样式
        if (!document.querySelector('#toast-animation')) {
            const style = document.createElement('style');
            style.id = 'toast-animation';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateY(-20px); }
                    10% { opacity: 1; transform: translateY(0); }
                    90% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 自动移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
    }
}

// 确保应用在页面加载完成后启动
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，启动应用');
    try {
        window.app = new LearningApp();
        console.log('应用启动成功');
    } catch (error) {
        console.error('应用启动失败:', error);
        alert('应用启动失败，请检查控制台错误信息');
    }
});

// 添加全局错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
});
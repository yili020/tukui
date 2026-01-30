class MobileLearningApp {
    constructor() {
        this.lessonManager = new LessonManager();
        this.currentMode = 'preview'; // 'preview' 或 'code'
        this.isFullscreen = false;
        this.isMenuOpen = false;
        this.isHintVisible = true;
        this.theme = localStorage.getItem('app-theme') || 'light';
        
        this.initialize();
    }

    initialize() {
        // 初始化主题
        this.applyTheme();
        
        // 设置事件监听器
        this.setupEventListeners();
        
        // 渲染初始步骤
        this.renderCurrentStep();
        this.updateUI();
        
        // 初始化代码高亮
        hljs.highlightAll();
    }

    setupEventListeners() {
        // 导航按钮
        document.getElementById('prev-step-mobile').addEventListener('click', () => {
            if (this.lessonManager.prevStep()) {
                this.renderCurrentStep();
                this.updateUI();
            }
        });

        document.getElementById('next-step-mobile').addEventListener('click', () => {
            if (this.lessonManager.nextStep()) {
                this.renderCurrentStep();
                this.updateUI();
            }
        });

        // 模式切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
            });
        });

        // 运行代码
        document.getElementById('run-code-mobile').addEventListener('click', () => {
            this.runCode();
        });

        // 重置代码
        document.getElementById('reset-code-mobile').addEventListener('click', () => {
            this.resetCurrentCode();
        });

        // 全屏预览
        document.getElementById('fullscreen-preview').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        document.getElementById('close-fullscreen').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // 复制代码
        document.getElementById('copy-example').addEventListener('click', () => {
            this.copyExampleCode();
        });

        document.getElementById('copy-code').addEventListener('click', () => {
            this.copyUserCode();
        });

        // 清空编辑器
        document.getElementById('clear-editor').addEventListener('click', () => {
            this.clearEditor();
        });

        // 显示/隐藏提示
        document.getElementById('toggle-hint').addEventListener('click', () => {
            this.toggleHint();
        });

        // 菜单控制
        document.getElementById('menu-toggle').addEventListener('click', () => {
            this.toggleMenu();
        });

        document.getElementById('close-menu').addEventListener('click', () => {
            this.toggleMenu();
        });

        // 主题切换
        document.getElementById('toggle-theme').addEventListener('click', () => {
            this.toggleTheme();
        });

        // 导入课程
        document.getElementById('import-lesson-mobile').addEventListener('click', () => {
            document.getElementById('lesson-file-mobile').click();
        });

        document.getElementById('lesson-file-mobile').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.importCourse(file);
                e.target.value = '';
            }
        });

        // 导出代码
        document.getElementById('export-code').addEventListener('click', () => {
            this.exportUserCode();
        });

        // 重置进度
        document.getElementById('reset-progress').addEventListener('click', () => {
            this.resetProgress();
        });

        // 代码编辑器输入监听
        const codeEditor = document.getElementById('code-editor-mobile');
        codeEditor.addEventListener('input', () => {
            this.lessonManager.setCurrentUserCode(codeEditor.value);
            // 自动保存进度
            this.lessonManager.saveProgress();
        });

        // 点击步骤列表项跳转
        document.addEventListener('click', (e) => {
            if (e.target.closest('#step-list li')) {
                const stepIndex = parseInt(e.target.closest('li').dataset.index);
                if (this.lessonManager.goToStep(stepIndex)) {
                    this.renderCurrentStep();
                    this.updateUI();
                    this.toggleMenu();
                }
            }
        });

        // 键盘快捷键支持
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && !e.target.matches('textarea, input')) {
                // 左箭头：上一步
                if (this.lessonManager.prevStep()) {
                    this.renderCurrentStep();
                    this.updateUI();
                }
                e.preventDefault();
            } else if (e.key === 'ArrowRight' && !e.target.matches('textarea, input')) {
                // 右箭头：下一步
                if (this.lessonManager.nextStep()) {
                    this.renderCurrentStep();
                    this.updateUI();
                }
                e.preventDefault();
            }
        });

        // 处理外部点击关闭菜单
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && !e.target.closest('#mobile-menu') && !e.target.closest('#menu-toggle')) {
                this.toggleMenu();
            }
        });
    }

    renderCurrentStep() {
        const step = this.lessonManager.getCurrentStep();
        if (!step) return;

        // 更新头部信息
        document.getElementById('course-title-mobile').textContent = 
            this.lessonManager.currentCourse.title;
        document.getElementById('step-title-mobile').textContent = step.title;
        document.getElementById('step-title-mobile').textContent = step.title;
        document.getElementById('step-number-mobile').textContent = `步骤 ${step.id}`;
        
        document.getElementById('current-step-mobile').textContent = step.id;
        document.getElementById('total-steps-mobile').textContent = 
            this.lessonManager.getTotalSteps();
        
        // 更新进度条
        const progress = (step.id / this.lessonManager.getTotalSteps()) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;

        // 根据步骤类型显示不同界面
        if (step.type === 'learn') {
            this.showLearnMode(step);
        } else {
            this.showPracticeMode(step);
        }

        // 更新步骤列表
        this.updateStepList();

        // 重新高亮代码
        setTimeout(() => hljs.highlightAll(), 10);
    }

    showLearnMode(step) {
        // 更新UI状态
        document.getElementById('step-type-badge').textContent = '学习';
        document.getElementById('step-type-badge').style.background = 'rgba(76, 201, 240, 0.2)';
        document.getElementById('step-type-badge').style.color = '#4cc9f0';
        
        // 显示学习面板
        document.getElementById('learn-panel-mobile').style.display = 'flex';
        document.getElementById('practice-panel-mobile').style.display = 'none';

        // 设置学习内容
        document.getElementById('learn-title-mobile').textContent = step.title;
        document.getElementById('learn-description-mobile').textContent = step.explanation;
        
        // 设置示例代码
        const exampleCodeElement = document.getElementById('example-code-mobile');
        exampleCodeElement.textContent = step.exampleCode || '';
        exampleCodeElement.className = 'language-html';

        // 显示示例预览
        this.renderPreview(step.exampleCode || '');
    }

    showPracticeMode(step) {
        // 更新UI状态
        document.getElementById('step-type-badge').textContent = '练习';
        document.getElementById('step-type-badge').style.background = 'rgba(247, 37, 133, 0.2)';
        document.getElementById('step-type-badge').style.color = '#f72585';
        
        // 显示练习面板
        document.getElementById('practice-panel-mobile').style.display = 'flex';
        document.getElementById('learn-panel-mobile').style.display = 'none';

        // 设置练习内容
        const practiceTitle = step.practiceTitle || step.title;
        document.getElementById('practice-title-mobile').textContent = practiceTitle;
        
        // 设置任务列表
        const taskList = document.getElementById('task-list-mobile');
        taskList.innerHTML = '';
        if (step.tasks && Array.isArray(step.tasks)) {
            step.tasks.forEach(task => {
                const li = document.createElement('li');
                li.textContent = task;
                taskList.appendChild(li);
            });
        }

        // 设置提示
        document.getElementById('hint-text-mobile').textContent = step.hint || '';
        if (!this.isHintVisible) {
            document.getElementById('hint-text-mobile').style.display = 'none';
        }

        // 获取用户代码（保存的或初始的）
        const userCode = this.lessonManager.getUserCode(step.id) || step.initialCode || '';
        const codeEditor = document.getElementById('code-editor-mobile');
        codeEditor.value = userCode;

        // 显示用户代码效果
        this.renderPreview(userCode);
    }

    renderPreview(code) {
        const previewContent = document.getElementById('preview-content-mobile');
        const fullscreenContent = document.getElementById('fullscreen-content');
        
        try {
            // 创建安全的预览
            const previewHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            padding: 20px;
                            margin: 0;
                            background: white;
                            min-height: 100%;
                            line-height: 1.6;
                        }
                        * {
                            box-sizing: border-box;
                        }
                        .preview-wrapper {
                            max-width: 100%;
                            word-wrap: break-word;
                        }
                        img {
                            max-width: 100%;
                            height: auto;
                        }
                        .code-output {
                            background: #f6f8fa;
                            border: 1px solid #e1e4e8;
                            border-radius: 6px;
                            padding: 16px;
                            margin: 10px 0;
                            font-family: 'Menlo', 'Monaco', monospace;
                            font-size: 14px;
                            white-space: pre-wrap;
                        }
                    </style>
                </head>
                <body>
                    <div class="preview-wrapper">
                        ${code}
                    </div>
                </body>
                </html>
            `;
            
            // 更新预览区域
            previewContent.innerHTML = previewHTML;
            
            // 更新全屏预览
            if (fullscreenContent) {
                fullscreenContent.innerHTML = previewHTML;
            }
            
        } catch (error) {
            console.error('渲染预览失败:', error);
            previewContent.innerHTML = `
                <div style="color: #dc3545; padding: 20px;">
                    <h4>渲染错误</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // 更新标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // 显示/隐藏面板
        document.getElementById('preview-panel').classList.toggle('active', mode === 'preview');
        document.getElementById('code-panel').classList.toggle('active', mode === 'code');
    }

    runCode() {
        const step = this.lessonManager.getCurrentStep();
        if (!step) return;

        if (step.type === 'learn') {
            // 学习模式：显示示例代码
            this.renderPreview(step.exampleCode || '');
        } else {
            // 练习模式：显示用户代码
            const codeEditor = document.getElementById('code-editor-mobile');
            const userCode = codeEditor.value;
            
            // 保存用户代码
            this.lessonManager.setCurrentUserCode(userCode);
            this.lessonManager.saveProgress();
            
            // 显示预览
            this.renderPreview(userCode);
        }
        
        // 切换到预览模式
        this.switchMode('preview');
        
        // 显示成功提示
        this.showToast('代码运行成功！');
    }

    resetCurrentCode() {
        const step = this.lessonManager.getCurrentStep();
        if (step?.type === 'practice') {
            const resetCode = this.lessonManager.resetCurrentStep();
            if (resetCode !== null) {
                const codeEditor = document.getElementById('code-editor-mobile');
                codeEditor.value = resetCode;
                this.renderPreview(resetCode);
                
                this.showToast('代码已重置');
            }
        }
    }

    clearEditor() {
        const codeEditor = document.getElementById('code-editor-mobile');
        codeEditor.value = '';
        
        // 更新预览
        this.renderPreview('');
        this.showToast('编辑器已清空');
    }

    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        const modal = document.getElementById('fullscreen-modal');
        modal.classList.toggle('active', this.isFullscreen);
        
        if (this.isFullscreen) {
            // 禁用滚动
            document.body.style.overflow = 'hidden';
        } else {
            // 恢复滚动
            document.body.style.overflow = '';
        }
    }

    toggleHint() {
        this.isHintVisible = !this.isHintVisible;
        const hintText = document.getElementById('hint-text-mobile');
        hintText.style.display = this.isHintVisible ? 'block' : 'none';
        
        const toggleBtn = document.getElementById('toggle-hint');
        toggleBtn.textContent = this.isHintVisible ? '隐藏' : '显示';
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        document.getElementById('mobile-menu').classList.toggle('active', this.isMenuOpen);
        
        if (this.isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('app-theme', this.theme);
        this.applyTheme();
        
        this.showToast(`已切换到${this.theme === 'light' ? '浅色' : '深色'}主题`);
    }

    applyTheme() {
        if (this.theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    copyExampleCode() {
        const step = this.lessonManager.getCurrentStep();
        if (step?.exampleCode) {
            navigator.clipboard.writeText(step.exampleCode)
                .then(() => this.showToast('示例代码已复制'))
                .catch(() => this.showToast('复制失败，请手动复制'));
        }
    }

    copyUserCode() {
        const codeEditor = document.getElementById('code-editor-mobile');
        if (codeEditor.value) {
            navigator.clipboard.writeText(codeEditor.value)
                .then(() => this.showToast('代码已复制'))
                .catch(() => this.showToast('复制失败，请手动复制'));
        }
    }

    exportUserCode() {
        const step = this.lessonManager.getCurrentStep();
        const code = document.getElementById('code-editor-mobile').value;
        
        if (code) {
            const blob = new Blob([code], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `code_step_${step?.id || '1'}.html`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showToast('代码已导出');
        } else {
            this.showToast('没有代码可导出');
        }
    }

    updateStepList() {
        const stepList = document.getElementById('step-list');
        const steps = this.lessonManager.currentCourse.steps;
        const currentStep = this.lessonManager.getCurrentStep();
        
        stepList.innerHTML = '';
        
        steps.forEach((step, index) => {
            const li = document.createElement('li');
            li.dataset.index = index;
            
            if (step.id === currentStep.id) {
                li.classList.add('active');
            }
            
            li.innerHTML = `
                <span style="font-weight: ${step.id === currentStep.id ? '600' : '400'}">
                    ${step.title}
                </span>
                <span style="font-size: 12px; color: #666; margin-left: auto;">
                    ${step.type === 'learn' ? '📚' : '💻'}
                </span>
            `;
            
            stepList.appendChild(li);
        });
    }

    updateUI() {
        const prevBtn = document.getElementById('prev-step-mobile');
        const nextBtn = document.getElementById('next-step-mobile');
        
        prevBtn.disabled = this.lessonManager.isFirstStep();
        nextBtn.disabled = this.lessonManager.isLastStep();
        
        // 更新步骤列表高亮
        this.updateStepList();
    }

    async importCourse(file) {
        try {
            await this.lessonManager.importCourseFromFile(file);
            this.renderCurrentStep();
            this.updateUI();
            this.showToast('课程导入成功！');
        } catch (error) {
            this.showToast(`导入失败: ${error.message}`);
        }
    }

    resetProgress() {
        if (confirm('确定要重置所有学习进度吗？这将清除所有保存的代码。')) {
            localStorage.removeItem(this.lessonManager.progressKey);
            this.lessonManager.userCodeMap = {};
            this.lessonManager.currentStepIndex = 0;
            
            this.renderCurrentStep();
            this.updateUI();
            this.showToast('进度已重置');
            this.toggleMenu();
        }
    }

    showToast(message) {
        // 移除现有的toast
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 创建新的toast
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 20px;
            z-index: 9999;
            font-size: 14px;
            animation: slideIn 0.3s ease;
            max-width: 80%;
            text-align: center;
            white-space: nowrap;
        `;
        
        document.body.appendChild(toast);
        
        // 3秒后移除
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translate(-50%, 20px); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // 初始化应用
    window.app = new MobileLearningApp();
});

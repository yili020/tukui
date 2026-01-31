class PageLearningApp {
    constructor() {
        this.lessonManager = new LessonManager();
        this.currentPage = 'preview'; // 'preview' 或 'code'
        this.isFullscreen = false;
        this.isMenuOpen = false;
        this.isHintVisible = true;
        
        // 触摸事件变量
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        this.swipeThreshold = 30; // 降低滑动阈值
        
        // 页面元素
        this.previewPage = document.getElementById('page-preview');
        this.codePage = document.getElementById('page-code');
        this.container = document.querySelector('.pages-container');
        
        this.initialize();
    }

    initialize() {
        // 设置事件监听器
        this.setupEventListeners();
        
        // 初始化页面状态
        this.setupPages();
        
        // 渲染初始步骤
        this.renderCurrentStep();
        this.updateUI();
        
        // 初始化代码高亮
        hljs.highlightAll();
    }

    setupPages() {
        // 设置初始页面状态
        this.updatePageVisibility();
    }

    setupEventListeners() {
        // 导航按钮
        document.getElementById('prev-step').addEventListener('click', () => {
            this.handlePrevStep();
        });

        document.getElementById('next-step').addEventListener('click', () => {
            this.handleNextStep();
        });

        // 运行代码
        document.getElementById('run-code').addEventListener('click', () => {
            this.runCode();
        });

        // 重置代码
        document.getElementById('reset-code').addEventListener('click', () => {
            this.resetCurrentCode();
        });

        // 复制代码
        document.getElementById('copy-example').addEventListener('click', () => {
            this.copyExampleCode();
        });

        // 点击指示器切换页面
        document.querySelectorAll('.page-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                this.switchPage(page);
            });
        });

        // 代码编辑器输入监听
        const codeEditor = document.getElementById('code-editor');
        codeEditor.addEventListener('input', () => {
            this.lessonManager.setCurrentUserCode(codeEditor.value);
            this.lessonManager.saveProgress();
        });

        // 添加触摸事件监听器到整个页面
        this.setupTouchEvents();
        
        // 添加键盘事件
        this.setupKeyboardEvents();
    }

    setupTouchEvents() {
        let isSwiping = false;
        let startX = 0;
        let currentX = 0;
        
        // 触摸开始
        this.container.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            
            isSwiping = true;
            startX = e.touches[0].clientX;
            currentX = startX;
            
            // 显示滑动提示
            this.showSwipeHint();
        }, { passive: true });

        // 触摸移动
        this.container.addEventListener('touchmove', (e) => {
            if (!isSwiping || e.touches.length !== 1) return;
            
            e.preventDefault();
            
            const touchX = e.touches[0].clientX;
            const deltaX = touchX - startX;
            
            // 限制滑动方向
            if ((this.currentPage === 'preview' && deltaX > 0) || 
                (this.currentPage === 'code' && deltaX < 0)) {
                return;
            }
            
            currentX = touchX;
            
            // 实时更新页面位置
            this.updatePagePositionDuringSwipe(deltaX);
        }, { passive: false });

        // 触摸结束
        this.container.addEventListener('touchend', (e) => {
            if (!isSwiping) return;
            
            isSwiping = false;
            const deltaX = currentX - startX;
            
            // 判断是否切换页面
            if (Math.abs(deltaX) > this.swipeThreshold) {
                if (deltaX < 0 && this.currentPage === 'preview') {
                    // 向左滑动，切换到代码页面
                    this.switchPage('code');
                } else if (deltaX > 0 && this.currentPage === 'code') {
                    // 向右滑动，切换到预览页面
                    this.switchPage('preview');
                } else {
                    // 回到原位
                    this.resetPagePosition();
                }
            } else {
                // 回到原位
                this.resetPagePosition();
            }
        });

        // 鼠标事件（桌面端测试用）
        this.container.addEventListener('mousedown', (e) => {
            isSwiping = true;
            startX = e.clientX;
            currentX = startX;
            
            const moveHandler = (moveEvent) => {
                if (!isSwiping) return;
                
                const deltaX = moveEvent.clientX - startX;
                
                if ((this.currentPage === 'preview' && deltaX > 0) || 
                    (this.currentPage === 'code' && deltaX < 0)) {
                    return;
                }
                
                currentX = moveEvent.clientX;
                this.updatePagePositionDuringSwipe(deltaX);
            };
            
            const upHandler = () => {
                if (!isSwiping) return;
                
                isSwiping = false;
                const deltaX = currentX - startX;
                
                if (Math.abs(deltaX) > this.swipeThreshold) {
                    if (deltaX < 0 && this.currentPage === 'preview') {
                        this.switchPage('code');
                    } else if (deltaX > 0 && this.currentPage === 'code') {
                        this.switchPage('preview');
                    } else {
                        this.resetPagePosition();
                    }
                } else {
                    this.resetPagePosition();
                }
                
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
            };
            
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        });
    }

    updatePagePositionDuringSwipe(deltaX) {
        const containerWidth = this.container.offsetWidth;
        let previewTransform = 0;
        let codeTransform = 100;
        
        if (this.currentPage === 'preview') {
            // 从预览页面开始向左滑动
            previewTransform = (deltaX / containerWidth) * 100;
            codeTransform = 100 + previewTransform;
        } else {
            // 从代码页面开始向右滑动
            codeTransform = (deltaX / containerWidth) * 100;
            previewTransform = -100 + codeTransform;
        }
        
        // 限制滑动范围
        previewTransform = Math.max(-100, Math.min(0, previewTransform));
        codeTransform = Math.max(0, Math.min(100, codeTransform));
        
        this.previewPage.style.transform = `translateX(${previewTransform}%)`;
        this.codePage.style.transform = `translateX(${codeTransform}%)`;
    }

    resetPagePosition() {
        this.updatePageVisibility();
    }

    switchPage(page) {
        if (page === this.currentPage) return;
        
        this.currentPage = page;
        this.updatePageVisibility();
        this.updatePageIndicator();
    }

    updatePageVisibility() {
        if (this.currentPage === 'preview') {
            // 显示预览页面，隐藏代码页面
            this.previewPage.style.transform = 'translateX(0)';
            this.codePage.style.transform = 'translateX(100%)';
            this.previewPage.classList.add('active');
            this.codePage.classList.remove('active');
        } else {
            // 显示代码页面，隐藏预览页面
            this.previewPage.style.transform = 'translateX(-100%)';
            this.codePage.style.transform = 'translateX(0)';
            this.codePage.classList.add('active');
            this.previewPage.classList.remove('active');
        }
    }

    updatePageIndicator() {
        // 更新指示器点
        document.querySelectorAll('.page-dot').forEach((dot, index) => {
            if ((this.currentPage === 'preview' && index === 0) || 
                (this.currentPage === 'code' && index === 1)) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && !e.target.matches('textarea, input')) {
                if (this.currentPage === 'code') {
                    this.switchPage('preview');
                    e.preventDefault();
                } else {
                    this.handlePrevStep();
                    e.preventDefault();
                }
            } else if (e.key === 'ArrowRight' && !e.target.matches('textarea, input')) {
                if (this.currentPage === 'preview') {
                    this.switchPage('code');
                    e.preventDefault();
                } else {
                    this.handleNextStep();
                    e.preventDefault();
                }
            }
        });
    }

    handlePrevStep() {
        if (this.lessonManager.prevStep()) {
            this.renderCurrentStep();
            this.updateUI();
        }
    }

    handleNextStep() {
        if (this.lessonManager.nextStep()) {
            this.renderCurrentStep();
            this.updateUI();
        }
    }

    renderCurrentStep() {
        const step = this.lessonManager.getCurrentStep();
        if (!step) return;

        // 更新头部信息
        document.getElementById('course-title').textContent = 
            this.lessonManager.currentCourse.title;
        document.getElementById('step-title').textContent = step.title;
        document.getElementById('step-number').textContent = `步骤 ${step.id}`;
        
        document.getElementById('current-step').textContent = step.id;
        document.getElementById('total-steps').textContent = 
            this.lessonManager.getTotalSteps();
        
        // 更新进度条
        const progress = (step.id / this.lessonManager.getTotalSteps()) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;

        // 更新步骤类型
        const stepType = document.getElementById('step-type');
        if (step.type === 'learn') {
            stepType.textContent = '学习';
            stepType.style.background = 'rgba(76, 201, 240, 0.2)';
            stepType.style.color = '#4cc9f0';
        } else {
            stepType.textContent = '练习';
            stepType.style.background = 'rgba(247, 37, 133, 0.2)';
            stepType.style.color = '#f72585';
        }

        // 根据步骤类型显示不同界面
        if (step.type === 'learn') {
            this.showLearnMode(step);
        } else {
            this.showPracticeMode(step);
        }

        // 更新代码页面标题
        this.updateCodePageTitle();

        // 重新高亮代码
        setTimeout(() => hljs.highlightAll(), 10);
    }

    showLearnMode(step) {
        // 显示学习内容，隐藏练习内容
        document.getElementById('learn-content').style.display = 'flex';
        document.getElementById('practice-content').style.display = 'none';

        // 设置学习内容
        document.getElementById('learn-title').textContent = step.title;
        document.getElementById('learn-description').textContent = step.explanation;
        
        // 设置示例代码
        const exampleCodeElement = document.getElementById('example-code');
        exampleCodeElement.textContent = step.exampleCode || '';
        exampleCodeElement.className = 'language-html';

        // 显示示例预览
        this.renderPreview(step.exampleCode || '');
    }

    showPracticeMode(step) {
        // 显示练习内容，隐藏学习内容
        document.getElementById('practice-content').style.display = 'flex';
        document.getElementById('learn-content').style.display = 'none';

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
        }

        // 设置提示
        document.getElementById('hint-text').textContent = step.hint || '';
        const toggleHintBtn = document.getElementById('toggle-hint');
        toggleHintBtn.textContent = this.isHintVisible ? '隐藏' : '显示';

        // 获取用户代码（保存的或初始的）
        const userCode = this.lessonManager.getUserCode(step.id) || step.initialCode || '';
        const codeEditor = document.getElementById('code-editor');
        codeEditor.value = userCode;

        // 显示用户代码效果
        this.renderPreview(userCode);
    }

    renderPreview(code) {
        const previewContent = document.getElementById('preview-content');
        
        try {
            // 创建安全的预览
            const previewHTML = `
                <div class="preview-wrapper">
                    ${code}
                </div>
            `;
            
            // 更新预览区域
            previewContent.innerHTML = previewHTML;
            
        } catch (error) {
            console.error('渲染预览失败:', error);
            previewContent.innerHTML = `
                <div class="preview-error">
                    <h4>渲染错误</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    updateCodePageTitle() {
        const step = this.lessonManager.getCurrentStep();
        if (!step) return;
        
        const codeTitle = document.getElementById('code-page-title');
        codeTitle.textContent = step.type === 'learn' ? '代码解释' : '代码编辑器';
    }

    runCode() {
        const step = this.lessonManager.getCurrentStep();
        if (!step) return;

        if (step.type === 'learn') {
            // 学习模式：显示示例代码
            this.renderPreview(step.exampleCode || '');
        } else {
            // 练习模式：显示用户代码
            const codeEditor = document.getElementById('code-editor');
            const userCode = codeEditor.value;
            
            // 保存用户代码
            this.lessonManager.setCurrentUserCode(userCode);
            this.lessonManager.saveProgress();
            
            // 显示预览
            this.renderPreview(userCode);
        }
        
        // 显示成功提示
        this.showToast('代码运行成功！');
    }

    resetCurrentCode() {
        const step = this.lessonManager.getCurrentStep();
        if (step?.type === 'practice') {
            const resetCode = this.lessonManager.resetCurrentStep();
            if (resetCode !== null) {
                const codeEditor = document.getElementById('code-editor');
                codeEditor.value = resetCode;
                this.renderPreview(resetCode);
                
                this.showToast('代码已重置');
            }
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

    updateUI() {
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        
        prevBtn.disabled = this.lessonManager.isFirstStep();
        nextBtn.disabled = this.lessonManager.isLastStep();
        
        // 更新页面指示器
        this.updatePageIndicator();
    }

    showSwipeHint() {
        // 短暂的滑动提示
        const hint = document.querySelector('.swipe-hint');
        if (hint) {
            hint.style.opacity = '1';
            setTimeout(() => {
                hint.style.opacity = '0.7';
            }, 1000);
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
            bottom: 180px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 14px 28px;
            border-radius: 24px;
            z-index: 9999;
            font-size: 15px;
            animation: slideIn 0.3s ease;
            max-width: 85%;
            text-align: center;
            white-space: nowrap;
            backdrop-filter: blur(10px);
            font-weight: 500;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
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
            from { transform: translateX(-50%) translateY(20px); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        
        .preview-wrapper {
            min-height: 100%;
            background: white;
            padding: 20px;
            border-radius: var(--radius);
            box-shadow: var(--shadow);
        }
        
        .preview-error {
            padding: 20px;
            background: #fee;
            border-radius: var(--radius);
            color: #c7254e;
            border: 1px solid #f5c6cb;
        }
        
        .swipe-hint {
            transition: opacity 0.3s ease;
        }
    `;
    document.head.appendChild(style);
    
    // 初始化应用
    window.app = new PageLearningApp();
});

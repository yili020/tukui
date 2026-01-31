class PageLearningApp {
    constructor() {
        this.lessonManager = new LessonManager();
        this.currentPage = 'preview'; // 'preview' 或 'code'
        this.isFullscreen = false;
        this.isMenuOpen = false;
        this.isHintVisible = true;
        
        // 触摸事件变量
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.swipeThreshold = 50; // 滑动阈值
        this.isSwiping = false;
        
        // 页面元素
        this.previewPage = document.getElementById('page-preview');
        this.codePage = document.getElementById('page-code');
        
        this.showedSwipeHint = localStorage.getItem('showedSwipeHint') === 'true';
        
        this.initialize();
    }

    initialize() {
        // 初始化滑动提示
        if (!this.showedSwipeHint) {
            this.showSwipeHint();
        }
        
        // 设置事件监听器
        this.setupEventListeners();
        
        // 初始化页面
        this.setupPages();
        
        // 渲染初始步骤
        this.renderCurrentStep();
        this.updateUI();
        
        // 初始化代码高亮
        hljs.highlightAll();
    }

    setupPages() {
        // 设置页面初始状态
        this.previewPage.classList.add('active');
        this.codePage.classList.remove('active');
        
        // 添加触摸事件监听器
        this.addTouchListeners();
        
        // 添加鼠标事件监听器（桌面端）
        this.addMouseListeners();
    }

    addTouchListeners() {
        // 为两个页面都添加触摸事件
        const pages = [this.previewPage, this.codePage];
        
        pages.forEach(page => {
            // 触摸开始
            page.addEventListener('touchstart', (e) => {
                this.handleTouchStart(e, page);
            }, { passive: true });

            // 触摸移动
            page.addEventListener('touchmove', (e) => {
                this.handleTouchMove(e, page);
            }, { passive: false });

            // 触摸结束
            page.addEventListener('touchend', (e) => {
                this.handleTouchEnd(e, page);
            });

            // 触摸取消
            page.addEventListener('touchcancel', () => {
                this.cancelTouch(page);
            });
        });
    }

    addMouseListeners() {
        let isDragging = false;
        let startX = 0;
        let currentPage = null;
        
        // 鼠标按下
        const pages = [this.previewPage, this.codePage];
        
        pages.forEach(page => {
            page.addEventListener('mousedown', (e) => {
                // 只在移动端或小屏幕上启用鼠标拖动
                if (window.innerWidth >= 768) return;
                
                isDragging = true;
                startX = e.clientX;
                currentPage = page;
                page.style.cursor = 'grabbing';
                page.classList.add('touch-active');
                e.preventDefault();
            });
        });

        // 鼠标移动
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            
            // 如果是水平移动，阻止默认行为
            if (Math.abs(deltaX) > 10) {
                e.preventDefault();
            }
        });

        // 鼠标松开
        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            
            const endX = e.clientX;
            const deltaX = endX - startX;
            
            if (Math.abs(deltaX) > 50) {
                if (currentPage === this.previewPage && deltaX < 0) {
                    // 在预览页面向左滑动，切换到代码页
                    this.switchPage('code');
                } else if (currentPage === this.codePage && deltaX > 0) {
                    // 在代码页面向右滑动，切换到预览页
                    this.switchPage('preview');
                }
            }
            
            // 重置状态
            isDragging = false;
            if (currentPage) {
                currentPage.style.cursor = '';
                currentPage.classList.remove('touch-active');
                currentPage = null;
            }
        });

        // 鼠标离开
        pages.forEach(page => {
            page.addEventListener('mouseleave', () => {
                if (isDragging) {
                    isDragging = false;
                    page.style.cursor = '';
                    page.classList.remove('touch-active');
                }
            });
        });
    }

    handleTouchStart(e, page) {
        if (e.touches.length !== 1) return;
        
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.isSwiping = true;
        
        // 添加触摸反馈
        page.classList.add('touch-active');
    }

    handleTouchMove(e, page) {
        if (!this.isSwiping || e.touches.length !== 1) return;
        
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        
        // 计算滑动距离
        const deltaX = touchX - this.touchStartX;
        const deltaY = touchY - this.touchStartY;
        
        // 如果是垂直滚动，不阻止
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            return;
        }
        
        // 如果是水平滑动，阻止垂直滚动
        e.preventDefault();
    }

    handleTouchEnd(e, page) {
        if (!this.isSwiping) return;
        
        this.isSwiping = false;
        this.touchEndX = e.changedTouches[0].clientX;
        this.touchEndY = e.changedTouches[0].clientY;
        
        // 移除触摸反馈
        page.classList.remove('touch-active');
        
        // 计算滑动距离和方向
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // 确定滑动方向
        if (distance > this.swipeThreshold) {
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            
            // 如果是水平滑动（角度在-45到45度之间）
            if (Math.abs(angle) < 45) {
                if (deltaX < 0 && this.currentPage === 'preview') {
                    // 在预览页面向左滑动，切换到代码页
                    this.switchPage('code');
                } else if (deltaX > 0 && this.currentPage === 'code') {
                    // 在代码页面向右滑动，切换到预览页
                    this.switchPage('preview');
                }
            }
        }
    }

    cancelTouch(page) {
        this.isSwiping = false;
        page.classList.remove('touch-active');
    }

    switchPage(page) {
        if (page === this.currentPage) return;
        
        this.currentPage = page;
        
        // 更新页面显示
        if (page === 'preview') {
            this.previewPage.classList.add('active');
            this.codePage.classList.remove('active');
            
            // 添加滑动动画类
            this.previewPage.classList.remove('slide-right');
            this.codePage.classList.remove('slide-left');
            
            this.previewPage.classList.add('slide-left');
            this.codePage.classList.add('slide-right');
            
            // 动画结束后移除类
            setTimeout(() => {
                this.previewPage.classList.remove('slide-left');
                this.codePage.classList.remove('slide-right');
            }, 300);
        } else {
            this.codePage.classList.add('active');
            this.previewPage.classList.remove('active');
            
            // 添加滑动动画类
            this.previewPage.classList.remove('slide-right');
            this.codePage.classList.remove('slide-left');
            
            this.previewPage.classList.add('slide-right');
            this.codePage.classList.add('slide-left');
            
            // 动画结束后移除类
            setTimeout(() => {
                this.previewPage.classList.remove('slide-right');
                this.codePage.classList.remove('slide-left');
            }, 300);
        }
        
        // 更新指示器
        this.updatePageIndicator();
        
        // 如果是第一次滑动，隐藏提示
        if (!this.showedSwipeHint) {
            this.hideSwipeHint();
            localStorage.setItem('showedSwipeHint', 'true');
            this.showedSwipeHint = true;
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

        // 重置进度
        document.getElementById('reset-progress').addEventListener('click', () => {
            this.resetProgress();
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
                if (this.currentPage === 'code') {
                    // 在代码页面，向左箭头应该切换到预览页面
                    this.switchPage('preview');
                    e.preventDefault();
                } else {
                    // 在预览页面，向左箭头应该是上一步
                    this.handlePrevStep();
                    e.preventDefault();
                }
            } else if (e.key === 'ArrowRight' && !e.target.matches('textarea, input')) {
                if (this.currentPage === 'preview') {
                    // 在预览页面，向右箭头应该切换到代码页面
                    this.switchPage('code');
                    e.preventDefault();
                } else {
                    // 在代码页面，向右箭头应该是下一步
                    this.handleNextStep();
                    e.preventDefault();
                }
            } else if (e.key === '1') {
                // 快捷键1：切换到预览
                this.switchPage('preview');
                e.preventDefault();
            } else if (e.key === '2') {
                // 快捷键2：切换到代码
                this.switchPage('code');
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

        // 更新步骤列表
        this.updateStepList();

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
        const fullscreenContent = document.getElementById('fullscreen-content');
        
        try {
            // 创建安全的预览
            const previewHTML = `
                <div class="preview-wrapper">
                    ${code}
                </div>
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

    clearEditor() {
        const codeEditor = document.getElementById('code-editor');
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
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    toggleHint() {
        this.isHintVisible = !this.isHintVisible;
        const hintText = document.getElementById('hint-text');
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
            
            // 检查步骤是否完成（用户有保存代码）
            const userCode = this.lessonManager.getUserCode(step.id);
            if (step.type === 'practice' && userCode && userCode !== step.initialCode) {
                li.classList.add('completed');
            }
            
            li.innerHTML = `
                <span>${step.title}</span>
                <span style="font-size: 12px; color: #666; margin-left: auto;">
                    ${step.type === 'learn' ? '📚' : '💻'}
                </span>
            `;
            
            stepList.appendChild(li);
        });
    }

    updateUI() {
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        
        prevBtn.disabled = this.lessonManager.isFirstStep();
        nextBtn.disabled = this.lessonManager.isLastStep();
        
        // 更新步骤列表高亮
        this.updateStepList();
        
        // 更新页面指示器
        this.updatePageIndicator();
    }

    showSwipeHint() {
        // 创建滑动提示覆盖层
        const overlay = document.createElement('div');
        overlay.className = 'swipe-overlay';
        overlay.innerHTML = `
            <div class="swipe-gesture">
                <svg viewBox="0 0 24 24" width="60" height="60">
                    <path fill="white" d="M6.5,17.5L8,16L3,11L8,6L6.5,4.5L0,11L6.5,17.5M17,6.5L22,11.5L17,16.5V14.5L19.5,11.5L17,8.5V6.5Z"/>
                </svg>
            </div>
            <p style="font-size: 18px; font-weight: 500; text-align: center; max-width: 80%; line-height: 1.5;">
                在预览页面向左滑动 → 切换到代码视图<br>
                在代码页面向右滑动 → 切换到预览视图
            </p>
            <button id="close-swipe-hint" style="padding: 12px 24px; background: white; color: #333; border: none; border-radius: 24px; margin-top: 20px; font-size: 16px; font-weight: 500; cursor: pointer;">
                我知道了
            </button>
        `;
        
        document.body.appendChild(overlay);
        
        // 点击关闭提示
        overlay.querySelector('#close-swipe-hint').addEventListener('click', () => {
            this.hideSwipeHint();
            localStorage.setItem('showedSwipeHint', 'true');
            this.showedSwipeHint = true;
        });
        
        // 5秒后自动关闭
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                this.hideSwipeHint();
                localStorage.setItem('showedSwipeHint', 'true');
                this.showedSwipeHint = true;
            }
        }, 5000);
    }

    hideSwipeHint() {
        const overlay = document.querySelector('.swipe-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    overlay.remove();
                }
            }, 300);
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
        
        .preview-error h4 {
            margin-bottom: 10px;
            font-size: 16px;
        }
        
        .preview-error p {
            font-size: 14px;
            font-family: monospace;
            background: white;
            padding: 10px;
            border-radius: var(--radius-sm);
            overflow: auto;
        }
    `;
    document.head.appendChild(style);
    
    // 初始化应用
    window.app = new PageLearningApp();
});

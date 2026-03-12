/**
 * CodeLearn - 学习页面逻辑
 * 管理学习流程、代码编辑、预览等功能
 */

const LearningApp = {
    // 当前状态
    state: {
        course: null,
        currentStepIndex: 0,
        currentFile: null,
        isFullscreen: false,
        sidebarOpen: false
    },
    
    // DOM 元素缓存
    elements: {},
    
    /**
     * 初始化应用
     */
    async init() {
        this.cacheElements();
        this.bindEvents();
        
        // 从 URL 获取课程 ID
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('course') || 'html-basics';
        
        try {
            // 加载课程数据
            await this.loadCourse(courseId);
        } catch (error) {
            console.error('Failed to load course:', error);
            alert('加载课程失败，请刷新页面重试');
        }
    },
    
    /**
     * 缓存 DOM 元素
     */
    cacheElements() {
        this.elements = {
            // 头部
            courseTitle: document.getElementById('courseTitle'),
            stepName: document.getElementById('stepName'),
            stepProgress: document.getElementById('stepProgress'),
            progressFill: document.getElementById('progressFill'),
            modeBadge: document.getElementById('modeBadge'),
            
            // 预览区
            previewFrame: document.getElementById('previewFrame'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            
            // 编辑区
            editorTitle: document.getElementById('editorTitle'),
            editorActions: document.getElementById('editorActions'),
            runCodeBtn: document.getElementById('runCodeBtn'),
            resetBtn: document.getElementById('resetBtn'),
            fileTabs: document.getElementById('fileTabs'),
            editorContainer: document.getElementById('editorContainer'),
            explanationPanel: document.getElementById('explanationPanel'),
            explanationContent: document.getElementById('explanationContent'),
            
            // 底部导航
            categoryBtn: document.getElementById('categoryBtn'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            stepIndicator: document.getElementById('stepIndicator'),
            
            // 侧边栏
            categorySidebar: document.getElementById('categorySidebar'),
            closeSidebar: document.getElementById('closeSidebar'),
            categoryContent: document.getElementById('categoryContent'),
            sidebarOverlay: document.getElementById('sidebarOverlay'),
            
            // 全屏模态框
            fullscreenModal: document.getElementById('fullscreenModal'),
            closeFullscreen: document.getElementById('closeFullscreen'),
            fullscreenFrame: document.getElementById('fullscreenFrame')
        };
    },
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 运行代码
        this.elements.runCodeBtn.addEventListener('click', () => this.runCode());
        
        // 重置代码
        this.elements.resetBtn.addEventListener('click', () => this.resetCode());
        
        // 上一步/下一步
        this.elements.prevBtn.addEventListener('click', () => this.prevStep());
        this.elements.nextBtn.addEventListener('click', () => this.nextStep());
        
        // 全屏预览
        this.elements.fullscreenBtn.addEventListener('click', () => this.openFullscreen());
        this.elements.closeFullscreen.addEventListener('click', () => this.closeFullscreen());
        
        // 侧边栏
        this.elements.categoryBtn.addEventListener('click', () => this.openSidebar());
        this.elements.closeSidebar.addEventListener('click', () => this.closeSidebar());
        this.elements.sidebarOverlay.addEventListener('click', () => this.closeSidebar());
        
        // 窗口大小变化
        window.addEventListener('resize', () => {
            Editor.resize();
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter 运行代码
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.runCode();
            }
        });
    },
    
    /**
     * 加载课程
     * @param {string} courseId - 课程ID
     */
    async loadCourse(courseId) {
        // 加载课程数据
        this.state.course = await DataLoader.loadCourse(courseId);
        
        // 恢复进度
        const progress = Storage.getProgress(courseId);
        this.state.currentStepIndex = progress.currentStep;
        
        // 初始化编辑器
        Editor.init(this.elements.editorContainer, {
            theme: 'dracula',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true
        });
        
        // 绑定编辑器变化事件（自动保存）
        let saveTimeout;
        Editor.onChange(() => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                this.autoSave();
            }, 1000);
        });
        
        // 渲染步骤
        this.renderStep();
        this.renderSidebar();
    },
    
    /**
     * 渲染当前步骤
     */
    renderStep() {
        const course = this.state.course;
        const stepIndex = this.state.currentStepIndex;
        const step = course.steps[stepIndex];
        
        if (!step) return;
        
        // 更新头部信息
        this.elements.courseTitle.textContent = course.title;
        this.elements.stepName.textContent = step.title;
        this.elements.stepProgress.textContent = `步骤 ${stepIndex + 1}/${course.steps.length}`;
        
        // 更新进度条
        const progress = ((stepIndex + 1) / course.steps.length) * 100;
        this.elements.progressFill.style.width = `${progress}%`;
        
        // 更新模式徽章
        const isPractice = step.mode === 'practice';
        this.elements.modeBadge.textContent = isPractice ? '练习模式' : '学习模式';
        this.elements.modeBadge.className = isPractice ? 'mode-badge practice' : 'mode-badge';
        
        // 更新编辑器标题和按钮
        this.elements.editorTitle.textContent = isPractice ? '代码编辑' : '代码解释';
        this.elements.editorActions.style.display = isPractice ? 'flex' : 'none';
        
        // 获取用户保存的代码
        const userCodes = Storage.getStepUserCodes(course.id, stepIndex);
        const files = DataLoader.mergeUserCodes(step.files, userCodes);
        
        // 渲染文件标签
        this.renderFileTabs(files, isPractice);
        
        // 渲染解释区域
        this.renderExplanation(step.explanation);
        
        // 更新底部导航
        this.elements.stepIndicator.textContent = `${stepIndex + 1}/${course.steps.length}`;
        this.elements.prevBtn.disabled = stepIndex === 0;
        this.elements.nextBtn.disabled = stepIndex === course.steps.length - 1;
        
        // 运行代码显示预览
        this.runCode();
        
        // 保存进度
        Storage.saveProgress(course.id, stepIndex);
    },
    
    /**
     * 渲染文件标签
     * @param {Object} files - 文件对象
     * @param {boolean} editable - 是否可编辑
     */
    renderFileTabs(files, editable) {
        this.elements.fileTabs.innerHTML = '';
        
        const fileNames = Object.keys(files);
        if (fileNames.length === 0) return;
        
        fileNames.forEach((filename, index) => {
            const file = files[filename];
            const tab = document.createElement('button');
            tab.className = 'file-tab' + (index === 0 ? ' active' : '');
            tab.innerHTML = `
                <span class="file-icon">${DataLoader.getFileIcon(filename)}</span>
                <span>${filename}</span>
            `;
            
            tab.addEventListener('click', () => {
                // 保存当前文件内容
                Editor.saveCurrentFile();
                
                // 切换标签
                document.querySelectorAll('.file-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // 加载文件
                this.loadFile(filename, file);
            });
            
            this.elements.fileTabs.appendChild(tab);
        });
        
        // 加载第一个文件
        const firstFile = fileNames[0];
        this.loadFile(firstFile, files[firstFile]);
    },
    
    /**
     * 加载文件到编辑器
     * @param {string} filename - 文件名
     * @param {Object} file - 文件对象
     */
    loadFile(filename, file) {
        const language = DataLoader.getFileLanguage(filename);
        const isEditable = file.editable !== false;
        
        Editor.setCurrentFile(filename, file.content, language, isEditable);
        this.state.currentFile = filename;
    },
    
    /**
     * 渲染解释内容
     * @param {string} explanation - Markdown 格式的解释
     */
    renderExplanation(explanation) {
        if (!explanation) {
            this.elements.explanationPanel.style.display = 'none';
            return;
        }
        
        this.elements.explanationPanel.style.display = 'block';
        
        // 使用 marked 解析 Markdown
        if (typeof marked !== 'undefined') {
            this.elements.explanationContent.innerHTML = marked.parse(explanation);
        } else {
            this.elements.explanationContent.textContent = explanation;
        }
    },
    
    /**
     * 运行代码
     */
    runCode() {
        const course = this.state.course;
        const step = course.steps[this.state.currentStepIndex];
        
        // 保存当前文件内容
        Editor.saveCurrentFile();
        
        // 获取所有文件内容（包括用户修改的）
        const userCodes = Editor.getAllContents();
        const files = DataLoader.mergeUserCodes(step.files, userCodes);
        
        // 生成预览 HTML
        const html = DataLoader.generatePreviewHTML(files);
        
        // 更新预览 iframe
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        this.elements.previewFrame.src = url;
        
        // 如果全屏模态框打开，也更新全屏预览
        if (this.state.isFullscreen) {
            this.elements.fullscreenFrame.src = url;
        }
    },
    
    /**
     * 重置代码
     */
    resetCode() {
        if (!confirm('确定要重置当前步骤的代码吗？所有修改将丢失。')) {
            return;
        }
        
        const course = this.state.course;
        const stepIndex = this.state.currentStepIndex;
        const step = course.steps[stepIndex];
        
        // 清除保存的用户代码
        Storage.clearStepUserCodes(course.id, stepIndex);
        
        // 清除编辑器缓存
        Editor.clear();
        
        // 重新渲染步骤
        this.renderStep();
    },
    
     /**
     * 自动保存
     */
    autoSave() {
        const course = this.state.course;
        if (!course) return;
        
        const stepIndex = this.state.currentStepIndex;
        const filename = Editor.getCurrentFile();
        const code = Editor.getContent();
        
        if (filename && code !== undefined) {
            Storage.saveUserCode(course.id, stepIndex, filename, code);
        }
    },
    
    /**
     * 上一步
     */
    prevStep() {
        if (this.state.currentStepIndex > 0) {
            // 保存当前步骤的代码
            this.autoSave();
            
            this.state.currentStepIndex--;
            Editor.clear();
            this.renderStep();
        }
    },
    
    /**
     * 下一步
     */
    nextStep() {
        const course = this.state.course;
        if (this.state.currentStepIndex < course.steps.length - 1) {
            // 标记当前步骤完成
            Storage.markStepCompleted(course.id, this.state.currentStepIndex);
            
            // 保存当前步骤的代码
            this.autoSave();
            
            this.state.currentStepIndex++;
            Editor.clear();
            this.renderStep();
        }
    },
    
    /**
     * 打开全屏预览
     */
    openFullscreen() {
        this.state.isFullscreen = true;
        this.elements.fullscreenModal.classList.add('active');
        
        // 复制当前预览到全屏
        this.elements.fullscreenFrame.src = this.elements.previewFrame.src;
    },
    
    /**
     * 关闭全屏预览
     */
    closeFullscreen() {
        this.state.isFullscreen = false;
        this.elements.fullscreenModal.classList.remove('active');
    },
    
    /**
     * 打开侧边栏
     */
    openSidebar() {
        this.state.sidebarOpen = true;
        this.elements.categorySidebar.classList.add('active');
        this.elements.sidebarOverlay.classList.add('active');
    },
    
    /**
     * 关闭侧边栏
     */
    closeSidebar() {
        this.state.sidebarOpen = false;
        this.elements.categorySidebar.classList.remove('active');
        this.elements.sidebarOverlay.classList.remove('active');
    },
    
    /**
     * 渲染侧边栏
     */
    renderSidebar() {
        const course = this.state.course;
        const progress = Storage.getProgress(course.id);
        
        this.elements.categoryContent.innerHTML = '';
        
        // 创建分类项
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header expanded';
        categoryHeader.innerHTML = `
            <span class="icon">▶</span>
            <span class="category-title">${course.category || '课程'}</span>
        `;
        
        const stepList = document.createElement('ul');
        stepList.className = 'step-list';
        
        course.steps.forEach((step, index) => {
            const stepItem = document.createElement('li');
            stepItem.className = 'step-item';
            
            if (index === this.state.currentStepIndex) {
                stepItem.classList.add('active');
            }
            
            if (progress.completedSteps.includes(index)) {
                stepItem.classList.add('completed');
            }
            
            stepItem.innerHTML = `
                <span class="step-number">${index + 1}.</span>
                <span>${step.title}</span>
            `;
            
            stepItem.addEventListener('click', () => {
                this.autoSave();
                this.state.currentStepIndex = index;
                Editor.clear();
                this.renderStep();
                this.closeSidebar();
            });
            
            stepList.appendChild(stepItem);
        });
        
        categoryItem.appendChild(categoryHeader);
        categoryItem.appendChild(stepList);
        this.elements.categoryContent.appendChild(categoryItem);
        
        // 分类标题点击折叠/展开
        categoryHeader.addEventListener('click', () => {
            categoryHeader.classList.toggle('expanded');
            stepList.style.display = categoryHeader.classList.contains('expanded') ? 'block' : 'none';
        });
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    LearningApp.init();
});

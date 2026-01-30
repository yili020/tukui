// scripts/lesson-manager.js
class LessonManager {
    constructor() {
        this.currentCourse = null;
        this.currentStepIndex = 0;
        this.userCodeMap = {}; // 保存每个练习步骤的用户代码 {stepId: code}
        this.progressKey = 'learning_progress_v2';
        
        // 默认课程数据
        this.defaultCourse = {
            id: "html-basics",
            title: "HTML基础教程",
            steps: [
                {
                    id: 1,
                    title: "HTML文档结构",
                    type: "learn",
                    explanation: "HTML文档由<html>、<head>和<body>标签组成。<!DOCTYPE html>声明指定文档类型为HTML5。",
                    exampleCode: `<!DOCTYPE html>
<html>
<head>
    <title>我的第一个网页</title>
    <meta charset="UTF-8">
</head>
<body>
    <h1>欢迎学习HTML</h1>
    <p>这是一个段落。</p>
</body>
</html>`
                },
                {
                    id: 2,
                    title: "创建你的第一个HTML页面",
                    type: "practice",
                    practiceTitle: "动手练习：创建HTML页面",
                    initialCode: `<!DOCTYPE html>
<html>
<head>
    <!-- 在这里设置页面标题 -->
</head>
<body>
    <!-- 在这里添加内容 -->
</body>
</html>`,
                    tasks: [
                        "设置页面标题为'我的练习页面'",
                        "在body中添加一个h1标题，内容为'你好，世界！'",
                        "在h1下方添加一个段落，内容自定"
                    ],
                    hint: "使用<title>标签设置标题，<h1>标签创建一级标题，<p>标签创建段落"
                },
                {
                    id: 3,
                    title: "HTML链接",
                    type: "learn",
                    explanation: "使用<a>标签创建超链接，href属性指定链接目标。",
                    exampleCode: `<!DOCTYPE html>
<html>
<body>
    <h1>链接示例</h1>
    <p>
        访问 <a href="https://www.example.com">示例网站</a>
    </p>
    <p>
        <a href="#top">回到顶部</a>（内部链接）
    </p>
</body>
</html>`
                },
                {
                    id: 4,
                    title: "添加链接到页面",
                    type: "practice",
                    practiceTitle: "练习：为页面添加链接",
                    initialCode: `<!DOCTYPE html>
<html>
<head>
    <title>我的网站</title>
</head>
<body>
    <h1>我的网站</h1>
    <p>这是一个示例网站。</p>
    <!-- 在这里添加链接 -->
</body>
</html>`,
                    tasks: [
                        "在段落下方添加一个链接，指向 https://www.baidu.com",
                        "链接文本显示为'访问百度'",
                        "为新窗口打开添加 target='_blank' 属性"
                    ],
                    hint: "使用 <a href='URL'>链接文本</a> 格式创建链接"
                }
            ]
        };
        
        this.loadDefaultCourse();
    }

    loadDefaultCourse() {
        this.currentCourse = this.defaultCourse;
        this.loadProgress();
    }

    importCourseFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // 验证课程数据格式
                    if (!data.course || !Array.isArray(data.course.steps)) {
                        throw new Error('无效的课程格式');
                    }
                    
                    // 初始化课程
                    this.currentCourse = data.course;
                    this.currentStepIndex = 0;
                    this.userCodeMap = {};
                    
                    // 为练习步骤初始化用户代码
                    this.currentCourse.steps.forEach(step => {
                        if (step.type === 'practice' && step.initialCode) {
                            this.userCodeMap[step.id] = step.initialCode;
                        }
                    });
                    
                    this.saveProgress();
                    resolve(this.currentCourse);
                    
                } catch (error) {
                    reject(new Error(`课程导入失败: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }

    getCurrentStep() {
        if (!this.currentCourse || !this.currentCourse.steps) {
            return null;
        }
        return this.currentCourse.steps[this.currentStepIndex];
    }

    getStepByIndex(index) {
        if (!this.currentCourse || !this.currentCourse.steps) {
            return null;
        }
        return this.currentCourse.steps[index];
    }

    nextStep() {
        // 保存当前步骤的用户代码（如果是练习步骤）
        this.saveCurrentStepUserCode();
        
        if (this.currentStepIndex < this.currentCourse.steps.length - 1) {
            this.currentStepIndex++;
            this.saveProgress();
            return true;
        }
        return false;
    }

    prevStep() {
        // 保存当前步骤的用户代码（如果是练习步骤）
        this.saveCurrentStepUserCode();
        
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.saveProgress();
            return true;
        }
        return false;
    }

    goToStep(index) {
        if (index >= 0 && index < this.currentCourse.steps.length) {
            // 保存当前步骤的用户代码
            this.saveCurrentStepUserCode();
            
            this.currentStepIndex = index;
            this.saveProgress();
            return true;
        }
        return false;
    }

    saveCurrentStepUserCode() {
        const step = this.getCurrentStep();
        if (step && step.type === 'practice') {
            // 通过事件或回调获取当前用户代码
            const code = this.getCurrentUserCode?.() || '';
            if (code) {
                this.userCodeMap[step.id] = code;
            }
        }
    }

    setCurrentUserCode(code) {
        const step = this.getCurrentStep();
        if (step && step.type === 'practice') {
            this.userCodeMap[step.id] = code;
        }
    }

    getUserCode(stepId) {
        return this.userCodeMap[stepId] || '';
    }

    resetCurrentStep() {
        const step = this.getCurrentStep();
        if (step && step.type === 'practice') {
            const initialCode = step.initialCode || '';
            this.userCodeMap[step.id] = initialCode;
            return initialCode;
        }
        return null;
    }

    saveProgress() {
        const progress = {
            courseId: this.currentCourse.id,
            stepIndex: this.currentStepIndex,
            userCodeMap: this.userCodeMap,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(this.progressKey, JSON.stringify(progress));
    }

    loadProgress() {
        try {
            const saved = localStorage.getItem(this.progressKey);
            if (saved) {
                const progress = JSON.parse(saved);
                
                // 如果加载的是同一课程，恢复进度
                if (progress.courseId === this.currentCourse.id) {
                    this.currentStepIndex = progress.stepIndex || 0;
                    this.userCodeMap = progress.userCodeMap || {};
                }
            }
        } catch (error) {
            console.warn('加载进度失败:', error);
        }
    }

    getTotalSteps() {
        return this.currentCourse.steps.length;
    }

    isFirstStep() {
        return this.currentStepIndex === 0;
    }

    isLastStep() {
        return this.currentStepIndex === this.currentCourse.steps.length - 1;
    }
}
/**
 * 学生管理系统 - 统计分析模块
 * API: /student/* (统计分析相关接口)
 */

const StatisticsModule = {
    /**
     * 渲染统计分析页面
     */
    render() {
        document.getElementById('pageTitle').textContent = '统计分析';
        document.getElementById('contentBody').innerHTML = `
            <div class="stats-grid">
                <div class="stat-card" onclick="StatisticsModule.loadOver30()">
                    <h4>超30岁学生数</h4>
                    <div class="value" id="over30Count">-</div>
                </div>
                <div class="stat-card" onclick="StatisticsModule.loadClassCount()">
                    <h4>班级统计</h4>
                    <div class="value" id="classCount">-</div>
                </div>
                <div class="stat-card" onclick="StatisticsModule.loadExcellent()">
                    <h4>优秀学生数</h4>
                    <div class="value" id="excellentCount">-</div>
                </div>
                <div class="stat-card" onclick="StatisticsModule.loadTopSalary()">
                    <h4>高薪学生TOP5</h4>
                    <div class="value" id="topSalaryCount">-</div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>统计结果</h3>
                    <div>
                        <button class="btn btn-primary" onclick="StatisticsModule.loadOver30()">超30岁学生</button>
                        <button class="btn btn-primary" onclick="StatisticsModule.loadClassCount()">班级人数</button>
                        <button class="btn btn-primary" onclick="StatisticsModule.loadExcellent()">优秀学生</button>
                        <button class="btn btn-primary" onclick="StatisticsModule.loadExcellent1()">不及格学生</button>
                        <button class="btn btn-primary" onclick="StatisticsModule.loadExcellent2()">班级平均分</button>
                        <button class="btn btn-primary" onclick="StatisticsModule.loadTopSalary()">薪资TOP5</button>
                        <button class="btn btn-primary" onclick="StatisticsModule.loadEmployTime()">就业时长</button>
                        <button class="btn btn-primary" onclick="StatisticsModule.loadAvgTime()">平均就业时长</button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="statisticsTable"></div>
                </div>
            </div>
        `;
        
        // 加载初始统计数据
        this.loadInitialStats();
    },

    /**
     * 加载初始统计数据
     */
    async loadInitialStats() {
        try {
            // 加载超30岁学生数
            const over30Res = await App.Http.get('/student/age/over30');
            if (over30Res.status_code === 200) {
                const count = over30Res.data ? over30Res.data.length : 0;
                document.getElementById('over30Count').textContent = count;
            }

            // 加载班级统计
            const classRes = await App.Http.get('/student/count');
            if (classRes.status_code === 200) {
                const count = classRes.data ? classRes.data.length : 0;
                document.getElementById('classCount').textContent = count;
            }

            // 加载优秀学生数
            const excellentRes = await App.Http.get('/student/score/excellent');
            if (excellentRes.status_code === 200) {
                const count = excellentRes.data ? excellentRes.data.length : 0;
                document.getElementById('excellentCount').textContent = count;
            }

            // 加载高薪学生
            const salaryRes = await App.Http.get('/student/top_salary');
            if (salaryRes.status_code === 200 && salaryRes.data) {
                const count = Array.isArray(salaryRes.data) ? salaryRes.data.length : 0;
                document.getElementById('topSalaryCount').textContent = count;
            }
        } catch (error) {
            console.error('加载统计数据失败:', error);
        }
    },

    /**
     * 加载超30岁学生
     */
    async loadOver30() {
        try {
            const response = await App.Http.get('/student/age/over30');
            
            if (response.status_code === 200) {
                const data = response.data || [];
                const columns = [
                    { key: 'student_id', title: '学号' },
                    { key: 'name', title: '姓名' },
                    { key: 'age', title: '年龄' },
                    { key: 'gender', title: '性别' },
                    { key: 'class_id', title: '班级编号' }
                ];
                
                App.DataTable.render('statisticsTable', columns, data, null);
                App.Utils.showMessage(`共找到 ${data.length} 名超30岁学生`);
            }
        } catch (error) {
            console.error('加载失败:', error);
            App.Utils.showMessage('加载失败: ' + error.message, 'error');
        }
    },

    /**
     * 加载班级人数统计
     */
    async loadClassCount() {
        try {
            const response = await App.Http.get('/student/count');
            
            if (response.status_code === 200) {
                const data = response.data || [];
                const columns = [
                    { key: 'class_id', title: '班级编号' },
                    { key: 'total_count', title: '总人数' },
                    { key: 'male_count', title: '男生人数' },
                    { key: 'female_count', title: '女生人数' },
                    { 
                        key: 'male_ratio', 
                        title: '男生比例',
                        formatter: (val) => val ? `${(val * 100).toFixed(1)}%` : '-'
                    },
                    { 
                        key: 'female_ratio', 
                        title: '女生比例',
                        formatter: (val) => val ? `${(val * 100).toFixed(1)}%` : '-'
                    }
                ];
                
                App.DataTable.render('statisticsTable', columns, data, null);
            }
        } catch (error) {
            console.error('加载失败:', error);
            App.Utils.showMessage('加载失败: ' + error.message, 'error');
        }
    },

    /**
     * 加载优秀学生（80分以上）
     */
    async loadExcellent() {
        try {
            const response = await App.Http.get('/student/score/excellent');
            
            if (response.status_code === 200) {
                const data = response.data || [];
                const columns = [
                    { key: 'student_id', title: '学号' },
                    { key: 'name', title: '姓名' },
                    { key: 'class_id', title: '班级编号' },
                    { key: 'kaohe_rank', title: '考核序次' },
                    { key: 'score', title: '成绩' }
                ];
                
                App.DataTable.render('statisticsTable', columns, data, null);
                App.Utils.showMessage(`共找到 ${data.length} 名优秀学生`);
            }
        } catch (error) {
            console.error('加载失败:', error);
            App.Utils.showMessage('加载失败: ' + error.message, 'error');
        }
    },

    /**
     * 加载不及格学生（两次以上不及格）
     */
    async loadExcellent1() {
        try {
            const response = await App.Http.get('/student/score/excellent_1');
            
            if (response.status_code === 200) {
                const data = response.data || [];
                const columns = [
                    { key: 'student_id', title: '学号' },
                    { key: 'name', title: '姓名' },
                    { key: 'class_id', title: '班级编号' },
                    { key: 'fail_count', title: '不及格次数' }
                ];
                
                App.DataTable.render('statisticsTable', columns, data, null);
                App.Utils.showMessage(`共找到 ${data.length} 名多次不及格学生`);
            }
        } catch (error) {
            console.error('加载失败:', error);
            App.Utils.showMessage('加载失败: ' + error.message, 'error');
        }
    },

    /**
     * 加载班级平均分
     */
    async loadExcellent2() {
        try {
            const response = await App.Http.get('/student/score/excellent_2');
            
            if (response.status_code === 200) {
                const data = response.data || [];
                const columns = [
                    { key: 'class_id', title: '班级编号' },
                    { key: 'kaohe_rank', title: '考核序次' },
                    { 
                        key: 'avg_score', 
                        title: '平均分',
                        formatter: (val) => val ? val.toFixed(2) : '-'
                    }
                ];
                
                App.DataTable.render('statisticsTable', columns, data, null);
            }
        } catch (error) {
            console.error('加载失败:', error);
            App.Utils.showMessage('加载失败: ' + error.message, 'error');
        }
    },

    /**
     * 加载薪资最高前5名学生
     */
    async loadTopSalary() {
        try {
            const response = await App.Http.get('/student/top_salary');
            
            if (response.status_code === 200) {
                const data = response.data || [];
                const columns = [
                    { key: 'student_id', title: '学号' },
                    { key: 'student_name', title: '姓名' },
                    { key: 'class_id', title: '班级编号' },
                    { key: 'company', title: '就业公司' },
                    { 
                        key: 'salary', 
                        title: '薪资',
                        formatter: (val) => val ? `¥${parseFloat(val).toFixed(2)}` : '-'
                    }
                ];
                
                App.DataTable.render('statisticsTable', columns, data, null);
            }
        } catch (error) {
            console.error('加载失败:', error);
            App.Utils.showMessage('加载失败: ' + error.message, 'error');
        }
    },

    /**
     * 加载学生就业时长
     */
    async loadEmployTime() {
        try {
            const response = await App.Http.get('/student/employ_time');
            
            if (response.status_code === 200) {
                const data = Array.isArray(response.data) ? response.data : [response.data];
                const columns = [
                    { key: 'student_id', title: '学号' },
                    { key: 'name', title: '姓名' },
                    { 
                        key: 'employ_days', 
                        title: '就业时长（天）',
                        formatter: (val) => val !== undefined ? val : '-'
                    }
                ];
                
                App.DataTable.render('statisticsTable', columns, data, null);
            }
        } catch (error) {
            console.error('加载失败:', error);
            App.Utils.showMessage('加载失败: ' + error.message, 'error');
        }
    },

    /**
     * 加载班级平均就业时长
     */
    async loadAvgTime() {
        try {
            const response = await App.Http.get('/student/avg_time');
            
            if (response.status_code === 200) {
                const data = Array.isArray(response.data) ? response.data : [response.data];
                const columns = [
                    { key: 'class_id', title: '班级编号' },
                    { 
                        key: 'avg_employ_days', 
                        title: '平均就业时长（天）',
                        formatter: (val) => val !== undefined ? val.toFixed(1) : '-'
                    }
                ];
                
                App.DataTable.render('statisticsTable', columns, data, null);
            }
        } catch (error) {
            console.error('加载失败:', error);
            App.Utils.showMessage('加载失败: ' + error.message, 'error');
        }
    }
};

// 注册路由
App.Router.register('statistics', () => StatisticsModule.render());

// 导出模块
window.StatisticsModule = StatisticsModule;

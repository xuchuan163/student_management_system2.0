/**
 * 学生管理系统 - 成绩管理模块
 * API: /score/*
 */

const ScoreModule = {
    currentData: [],
    currentStudentId: null,

    /**
     * 渲染成绩管理页面
     */
    render() {
        document.getElementById('pageTitle').textContent = '成绩管理';
        document.getElementById('contentBody').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>成绩查询</h3>
                    <button class="btn btn-success" onclick="ScoreModule.openAddModal()">
                        + 录入成绩
                    </button>
                </div>
                <div class="card-body">
                    <!-- 查询栏 -->
                    <div class="search-bar">
                        <input type="number" id="queryStudentId" placeholder="输入学生编号查询">
                        <button class="btn btn-primary" onclick="ScoreModule.queryByStudentId()">查询</button>
                        <button class="btn btn-default" onclick="ScoreModule.resetQuery()">重置</button>
                    </div>
                    
                    <!-- 数据表格 -->
                    <div id="scoreTable"></div>
                </div>
            </div>
        `;
        
        // 默认加载一些数据（如果有）
        this.loadAllScores();
    },

    /**
     * 加载所有成绩（通过获取学生列表然后查询每个学生的成绩）
     */
    async loadAllScores() {
        try {
            // 先获取学生列表
            const response = await App.Http.get('/student/students');
            if (response.status_code === 200 && response.data && response.data.length > 0) {
                // 只取前5个学生的成绩作为示例
                const students = response.data.slice(0, 5);
                const allScores = [];
                
                for (const student of students) {
                    try {
                        const scoreRes = await App.Http.get(`/score/score/${student.student_id}`);
                        if (scoreRes.status_code === 200 && scoreRes.data) {
                            const scores = Array.isArray(scoreRes.data) ? scoreRes.data : [scoreRes.data];
                            scores.forEach(s => {
                                allScores.push({
                                    ...s,
                                    student_name: student.name,
                                    class_id: student.class_id
                                });
                            });
                        }
                    } catch (e) {
                        // 忽略单个学生的查询错误
                    }
                }
                
                this.currentData = allScores;
                this.renderTable();
            }
        } catch (error) {
            console.error('加载成绩数据失败:', error);
        }
    },

    /**
     * 根据学生编号查询成绩
     */
    async queryByStudentId() {
        const studentId = document.getElementById('queryStudentId').value.trim();
        
        if (!studentId) {
            App.Utils.showMessage('请输入学生编号', 'warning');
            return;
        }
        
        try {
            this.currentStudentId = parseInt(studentId);
            const response = await App.Http.get(`/score/score/${this.currentStudentId}`);
            
            if (response.status_code === 200) {
                this.currentData = Array.isArray(response.data) ? response.data : [response.data];
                this.renderTable();
            } else {
                App.Utils.showMessage(response.message || '查询失败', 'error');
            }
        } catch (error) {
            console.error('查询成绩失败:', error);
            App.Utils.showMessage('查询失败: ' + error.message, 'error');
        }
    },

    /**
     * 重置查询
     */
    resetQuery() {
        document.getElementById('queryStudentId').value = '';
        this.currentStudentId = null;
        this.loadAllScores();
    },

    /**
     * 渲染表格
     */
    renderTable() {
        const columns = [
            { key: 'student_id', title: '学生编号' },
            { key: 'student_name', title: '学生姓名' },
            { key: 'class_id', title: '班级编号' },
            { key: 'kaohe_rank', title: '考核序次' },
            { key: 'score', title: '成绩' }
        ];

        const actions = (row) => `
            <button class="btn btn-primary btn-sm" onclick="ScoreModule.openEditModal(${row.student_id}, ${row.kaohe_rank})">编辑</button>
            <button class="btn btn-danger btn-sm" onclick="ScoreModule.confirmDelete(${row.student_id}, ${row.kaohe_rank})">删除</button>
        `;

        App.DataTable.render('scoreTable', columns, this.currentData, actions);
    },

    /**
     * 打开添加成绩模态框
     */
    openAddModal() {
        const formHtml = `
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">学生编号</label>
                        <input type="number" name="student_id" required>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">考核序次</label>
                        <input type="number" name="kaohe_rank" required min="1" max="100">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">成绩</label>
                        <input type="number" name="score" required min="0">
                    </div>
                </div>
            </div>
        `;

        App.Utils.createFormModal('录入成绩', formHtml, (data) => {
            this.addScore(data);
        });
    },

    /**
     * 打开编辑成绩模态框
     */
    openEditModal(studentId, kaoheRank) {
        const score = this.currentData.find(s => s.student_id === studentId && s.kaohe_rank === kaoheRank);
        if (!score) {
            App.Utils.showMessage('未找到该成绩记录', 'error');
            return;
        }

        const formHtml = `
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label>学生编号</label>
                        <input type="text" value="${score.student_id}" disabled>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>考核序次</label>
                        <input type="text" value="${score.kaohe_rank}" disabled>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">成绩</label>
                        <input type="number" name="score" required min="0" value="${score.score || ''}">
                    </div>
                </div>
            </div>
        `;

        App.Utils.createFormModal('编辑成绩', formHtml, (data) => {
            this.updateScore(studentId, kaoheRank, data);
        });
    },

    /**
     * 添加成绩
     */
    async addScore(data) {
        try {
            data.student_id = parseInt(data.student_id);
            data.kaohe_rank = parseInt(data.kaohe_rank);
            data.score = parseInt(data.score);
            
            const response = await App.Http.post('/score/score', data);
            
            if (response && response.status_code === 200) {
                App.Utils.showMessage('录入成功');
                if (this.currentStudentId) {
                    this.queryByStudentId();
                } else {
                    this.loadAllScores();
                }
            } else {
                App.Utils.showMessage(response.message || '录入失败', 'error');
            }
        } catch (error) {
            console.error('录入成绩失败:', error);
            App.Utils.showMessage('录入失败: ' + error.message, 'error');
        }
    },

    /**
     * 更新成绩
     */
    async updateScore(studentId, kaoheRank, data) {
        try {
            data.score = parseInt(data.score);
            
            // 后端: PUT body=Score_update(score), query=student_id, kaohe_rank
            const response = await App.Http.put('/score/score/update', data, {
                student_id: studentId,
                kaohe_rank: kaoheRank
            });
            
            if (response && response.status_code === 200) {
                App.Utils.showMessage('更新成功');
                if (this.currentStudentId) {
                    this.queryByStudentId();
                } else {
                    this.loadAllScores();
                }
            } else {
                App.Utils.showMessage(response.message || '更新失败', 'error');
            }
        } catch (error) {
            console.error('更新成绩失败:', error);
            App.Utils.showMessage('更新失败: ' + error.message, 'error');
        }
    },

    /**
     * 确认删除
     */
    confirmDelete(studentId, kaoheRank) {
        App.Utils.createModal(
            '确认删除',
            `<p>确定要删除学生 <strong>${studentId}</strong> 的第 <strong>${kaoheRank}</strong> 次考核成绩吗？此操作不可恢复。</p>`,
            () => {
                this.deleteScore(studentId, kaoheRank);
            }
        );
    },

    /**
     * 删除成绩
     */
    async deleteScore(studentId, kaoheRank) {
        try {
            const response = await App.Http.delete(`/score/score/delete?student_id=${studentId}&kaohe_rank=${kaoheRank}`);
            
            if (response && response.status_code === 200) {
                App.Utils.showMessage('删除成功');
                if (this.currentStudentId) {
                    this.queryByStudentId();
                } else {
                    this.loadAllScores();
                }
            } else {
                App.Utils.showMessage(response.message || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除成绩失败:', error);
            App.Utils.showMessage('删除失败: ' + error.message, 'error');
        }
    }
};

// 注册路由
App.Router.register('score', () => ScoreModule.render());

// 导出模块
window.ScoreModule = ScoreModule;

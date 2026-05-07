/**
 * 学生管理系统 - 学生管理模块
 * API: /student/students (GET/POST/PUT/DELETE)
 */

const StudentModule = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    currentData: [],

    /**
     * 渲染学生管理页面
     */
    render() {
        document.getElementById('pageTitle').textContent = '学生管理';
        document.getElementById('contentBody').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>学生列表</h3>
                    <button class="btn btn-success" onclick="StudentModule.openAddModal()">
                        + 添加学生
                    </button>
                </div>
                <div class="card-body">
                    <!-- 搜索栏 -->
                    <div class="search-bar">
                        <select id="searchKey">
                            <option value="姓名">姓名</option>
                            <option value="编号">学号</option>
                            <option value="班级">班级编号</option>
                        </select>
                        <input type="text" id="searchValue" placeholder="请输入搜索内容">
                        <button class="btn btn-primary" onclick="StudentModule.search()">搜索</button>
                        <button class="btn btn-default" onclick="StudentModule.resetSearch()">重置</button>
                    </div>
                    
                    <!-- 数据表格 -->
                    <div id="studentTable"></div>
                    
                    <!-- 分页 -->
                    <div id="studentPagination"></div>
                </div>
            </div>
        `;
        
        this.loadData();
    },

    /**
     * 加载学生数据
     */
    async loadData(searchParams = {}) {
        try {
            let url = '/student/students';
            let params = {};
            
            // 如果有搜索参数
            if (searchParams.key && searchParams.value) {
                params = searchParams;
            }
            
            const response = await App.Http.get(url, params);
            
            if (response.status_code === 200) {
                this.currentData = response.data || [];
                this.totalItems = this.currentData.length;
                this.renderTable();
            } else {
                App.Utils.showMessage(response.message || '获取数据失败', 'error');
            }
        } catch (error) {
            console.error('加载学生数据失败:', error);
            App.Utils.showMessage('加载数据失败: ' + error.message, 'error');
        }
    },

    /**
     * 渲染表格
     */
    renderTable() {
        const columns = [
            { key: 'student_id', title: '学号' },
            { key: 'name', title: '姓名' },
            { key: 'gender', title: '性别' },
            { key: 'age', title: '年龄' },
            { key: 'class_id', title: '班级编号' },
            { key: 'origin', title: '籍贯' },
            { key: 'school', title: '毕业学校' },
            { key: 'major', title: '专业' },
            { 
                key: 'entry_time', 
                title: '入学日期',
                formatter: (val) => App.Utils.formatDate(val)
            },
            { 
                key: 'graduate_time', 
                title: '毕业日期',
                formatter: (val) => App.Utils.formatDate(val)
            },
            { key: 'degree', title: '学历' },
            { key: 'consultant_id', title: '顾问编号' }
        ];

        const actions = (row) => `
            <button class="btn btn-primary btn-sm" onclick="StudentModule.openEditModal(${row.student_id})">编辑</button>
            <button class="btn btn-danger btn-sm" onclick="StudentModule.confirmDelete(${row.student_id})">删除</button>
        `;

        App.DataTable.render('studentTable', columns, this.currentData, actions);
    },

    /**
     * 搜索
     */
    search() {
        const key = document.getElementById('searchKey').value;
        let value = document.getElementById('searchValue').value.trim();
        
        if (!value) {
            App.Utils.showMessage('请输入搜索内容', 'warning');
            return;
        }
        
        // 编号和班级需要转为数字类型
        if (key === '编号' || key === '班级') {
            value = parseInt(value);
            if (isNaN(value)) {
                App.Utils.showMessage('请输入有效的数字', 'warning');
                return;
            }
        }
        
        this.loadData({ key, value });
    },

    /**
     * 重置搜索
     */
    resetSearch() {
        document.getElementById('searchKey').value = '姓名';
        document.getElementById('searchValue').value = '';
        this.loadData();
    },

    /**
     * 打开添加学生模态框
     */
    openAddModal() {
        const formHtml = `
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">姓名</label>
                        <input type="text" name="name" required maxlength="50">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">性别</label>
                        <select name="gender" required>
                            <option value="男">男</option>
                            <option value="女">女</option>
                        </select>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">年龄</label>
                        <input type="number" name="age" required min="0" max="100">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">班级编号</label>
                        <input type="number" name="class_id" required>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>籍贯</label>
                        <input type="text" name="origin">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>毕业学校</label>
                        <input type="text" name="school">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>专业</label>
                        <input type="text" name="major">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>学历</label>
                        <input type="text" name="degree">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>入学日期</label>
                        <input type="date" name="entry_time">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>毕业日期</label>
                        <input type="date" name="graduate_time">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>顾问编号</label>
                        <input type="text" name="consultant_id">
                    </div>
                </div>
            </div>
        `;

        App.Utils.createFormModal('添加学生', formHtml, (data) => {
            this.addStudent(data);
        });
    },

    /**
     * 打开编辑学生模态框
     */
    openEditModal(studentId) {
        const student = this.currentData.find(s => s.student_id === studentId);
        if (!student) {
            App.Utils.showMessage('未找到该学生', 'error');
            return;
        }

        const formHtml = `
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label>学号</label>
                        <input type="text" value="${student.student_id}" disabled>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">姓名</label>
                        <input type="text" name="name" required maxlength="50" value="${student.name || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">性别</label>
                        <select name="gender" required>
                            <option value="男" ${student.gender === '男' ? 'selected' : ''}>男</option>
                            <option value="女" ${student.gender === '女' ? 'selected' : ''}>女</option>
                        </select>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">年龄</label>
                        <input type="number" name="age" required min="0" max="100" value="${student.age || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">班级编号</label>
                        <input type="number" name="class_id" required value="${student.class_id || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>籍贯</label>
                        <input type="text" name="origin" value="${student.origin || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>毕业学校</label>
                        <input type="text" name="school" value="${student.school || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>专业</label>
                        <input type="text" name="major" value="${student.major || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>学历</label>
                        <input type="text" name="degree" value="${student.degree || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>入学日期</label>
                        <input type="date" name="entry_time" value="${student.entry_time || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>毕业日期</label>
                        <input type="date" name="graduate_time" value="${student.graduate_time || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>顾问编号</label>
                        <input type="text" name="consultant_id" value="${student.consultant_id || ''}">
                    </div>
                </div>
            </div>
        `;

        App.Utils.createFormModal('编辑学生', formHtml, (data) => {
            this.updateStudent(studentId, data);
        });
    },

    /**
     * 添加学生
     */
    async addStudent(data) {
        try {
            // 转换数据类型
            data.class_id = parseInt(data.class_id);
            data.age = parseInt(data.age);
            
            const response = await App.Http.post('/student/students', data);
            
            if (response.status_code === 200) {
                App.Utils.showMessage('添加成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '添加失败', 'error');
            }
        } catch (error) {
            console.error('添加学生失败:', error);
            App.Utils.showMessage('添加失败: ' + error.message, 'error');
        }
    },

    /**
     * 更新学生
     */
    async updateStudent(studentId, data) {
        try {
            // 转换数据类型
            data.class_id = parseInt(data.class_id);
            data.age = parseInt(data.age);
            
            const response = await App.Http.put(`/student/students/${studentId}`, data);
            
            if (response.status_code === 200) {
                App.Utils.showMessage('更新成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '更新失败', 'error');
            }
        } catch (error) {
            console.error('更新学生失败:', error);
            App.Utils.showMessage('更新失败: ' + error.message, 'error');
        }
    },

    /**
     * 确认删除
     */
    confirmDelete(studentId) {
        App.Utils.createModal(
            '确认删除',
            `<p>确定要删除学号为 <strong>${studentId}</strong> 的学生吗？此操作不可恢复。</p>`,
            () => {
                this.deleteStudent(studentId);
            }
        );
    },

    /**
     * 删除学生
     */
    async deleteStudent(studentId) {
        try {
            const response = await App.Http.delete(`/student/${studentId}`);
            
            if (response.status_code === 200) {
                App.Utils.showMessage('删除成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除学生失败:', error);
            App.Utils.showMessage('删除失败: ' + error.message, 'error');
        }
    }
};

// 注册路由
App.Router.register('student', () => StudentModule.render());

// 导出模块
window.StudentModule = StudentModule;

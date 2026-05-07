/**
 * 学生管理系统 - 教师管理模块
 * API: /teacher/*
 */

const TeacherModule = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    currentData: [],

    /**
     * 渲染教师管理页面
     */
    render() {
        document.getElementById('pageTitle').textContent = '教师管理';
        document.getElementById('contentBody').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>教师列表</h3>
                    <button class="btn btn-success" onclick="TeacherModule.openAddModal()">
                        + 添加教师
                    </button>
                </div>
                <div class="card-body">
                    <!-- 搜索栏 -->
                    <div class="search-bar">
                        <select id="searchKey">
                            <option value="教师编号">教师编号</option>
                            <option value="教师姓名">教师姓名</option>
                            <option value="任教科目">任教科目</option>
                        </select>
                        <input type="text" id="searchValue" placeholder="请输入搜索内容">
                        <button class="btn btn-primary" onclick="TeacherModule.search()">搜索</button>
                        <button class="btn btn-default" onclick="TeacherModule.resetSearch()">重置</button>
                    </div>
                    
                    <!-- 数据表格 -->
                    <div id="teacherTable"></div>
                    
                    <!-- 分页 -->
                    <div id="teacherPagination"></div>
                </div>
            </div>
        `;
        
        this.loadData();
    },

    /**
     * 加载教师数据
     */
    async loadData(page = 1) {
        try {
            this.currentPage = page;
            const response = await App.Http.get('/teacher/check_teacher', {
                page_num: page,
                page_size: this.pageSize
            });
            
            // 后端返回 {"message": "...", "status_code": 200, "data": [...]}
            if (response && response.status_code === 200) {
                this.currentData = response.data || [];
                this.totalItems = this.currentData.length;
                this.renderTable();
                this.renderPagination();
            } else {
                this.currentData = [];
                this.renderTable();
            }
        } catch (error) {
            console.error('加载教师数据失败:', error);
            App.Utils.showMessage('加载数据失败: ' + error.message, 'error');
        }
    },

    /**
     * 渲染表格
     */
    renderTable() {
        const columns = [
            { key: 'teacher_id', title: '教师编号' },
            { key: 'name', title: '姓名' },
            { key: 'sex', title: '性别' },
            { 
                key: 'birth', 
                title: '出生日期',
                formatter: (val) => App.Utils.formatDate(val)
            },
            { key: 'subject', title: '任教科目' }
        ];

        const actions = (row) => `
            <button class="btn btn-primary btn-sm" onclick="TeacherModule.openEditModal(${row.teacher_id})">编辑</button>
            <button class="btn btn-danger btn-sm" onclick="TeacherModule.confirmDelete(${row.teacher_id})">删除</button>
        `;

        App.DataTable.render('teacherTable', columns, this.currentData, actions);
    },

    /**
     * 渲染分页
     */
    renderPagination() {
        const totalPages = Math.ceil(this.totalItems / this.pageSize);
        App.Pagination.render('teacherPagination', this.currentPage, totalPages, this.totalItems, (page) => {
            this.loadData(page);
        });
    },

    /**
     * 搜索
     */
    async search() {
        const key = document.getElementById('searchKey').value;
        const value = document.getElementById('searchValue').value.trim();
        
        if (!value) {
            App.Utils.showMessage('请输入搜索内容', 'warning');
            return;
        }
        
        try {
            const response = await App.Http.get('/teacher/search', {
                key: key,
                value: value
            });
            
            if (response && response.status_code === 200) {
                this.currentData = response.data || [];
                this.totalItems = this.currentData.length;
                this.renderTable();
                document.getElementById('teacherPagination').innerHTML = '';
                if (this.currentData.length === 0) {
                    App.Utils.showMessage('未找到匹配的教师信息', 'warning');
                }
            } else {
                App.Utils.showMessage(response.message || '搜索失败', 'error');
            }
        } catch (error) {
            console.error('搜索失败:', error);
            App.Utils.showMessage('搜索失败: ' + error.message, 'error');
        }
    },

    /**
     * 重置搜索
     */
    resetSearch() {
        document.getElementById('searchKey').value = '教师编号';
        document.getElementById('searchValue').value = '';
        this.loadData();
    },

    /**
     * 打开添加教师模态框
     */
    openAddModal() {
        const formHtml = `
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">姓名</label>
                        <input type="text" name="name" required minlength="2" maxlength="20">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">性别</label>
                        <select name="sex" required>
                            <option value="男">男</option>
                            <option value="女">女</option>
                        </select>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">出生日期</label>
                        <input type="date" name="birth" required>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">任教科目</label>
                        <select name="subject" required>
                            <option value="java">Java</option>
                            <option value="Python">Python</option>
                            <option value="前端">前端</option>
                            <option value="大数据">大数据</option>
                            <option value="人工智能">人工智能</option>
                            <option value="云计算">云计算</option>
                            <option value="测试">测试</option>
                            <option value="运维">运维</option>
                            <option value="产品">产品</option>
                            <option value="UI">UI</option>
                        </select>
                    </div>
                </div>
            </div>
        `;

        App.Utils.createFormModal('添加教师', formHtml, (data) => {
            this.addTeacher(data);
        });
    },

    /**
     * 打开编辑教师模态框
     */
    openEditModal(teacherId) {
        const teacher = this.currentData.find(t => t.teacher_id === teacherId);
        if (!teacher) {
            App.Utils.showMessage('未找到该教师', 'error');
            return;
        }

        const formHtml = `
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label>教师编号</label>
                        <input type="text" value="${teacher.teacher_id}" disabled>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">姓名</label>
                        <input type="text" name="name" required minlength="2" maxlength="20" value="${teacher.name || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">性别</label>
                        <select name="sex" required>
                            <option value="男" ${teacher.sex === '男' ? 'selected' : ''}>男</option>
                            <option value="女" ${teacher.sex === '女' ? 'selected' : ''}>女</option>
                        </select>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">出生日期</label>
                        <input type="date" name="birth" required value="${teacher.birth || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">任教科目</label>
                        <select name="subject" required>
                            <option value="java" ${teacher.subject === 'java' ? 'selected' : ''}>Java</option>
                            <option value="Python" ${teacher.subject === 'Python' ? 'selected' : ''}>Python</option>
                            <option value="前端" ${teacher.subject === '前端' ? 'selected' : ''}>前端</option>
                            <option value="大数据" ${teacher.subject === '大数据' ? 'selected' : ''}>大数据</option>
                            <option value="人工智能" ${teacher.subject === '人工智能' ? 'selected' : ''}>人工智能</option>
                            <option value="云计算" ${teacher.subject === '云计算' ? 'selected' : ''}>云计算</option>
                            <option value="测试" ${teacher.subject === '测试' ? 'selected' : ''}>测试</option>
                            <option value="运维" ${teacher.subject === '运维' ? 'selected' : ''}>运维</option>
                            <option value="产品" ${teacher.subject === '产品' ? 'selected' : ''}>产品</option>
                            <option value="UI" ${teacher.subject === 'UI' ? 'selected' : ''}>UI</option>
                        </select>
                    </div>
                </div>
            </div>
        `;

        App.Utils.createFormModal('编辑教师', formHtml, (data) => {
            this.updateTeacher(teacherId, data);
        });
    },

    /**
     * 添加教师
     */
    async addTeacher(data) {
        try {
            const response = await App.Http.post('/teacher/add_teacher', data);
            
            if (response && (response.status_code === 200 || response.message?.includes('成功'))) {
                App.Utils.showMessage('添加成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '添加失败', 'error');
            }
        } catch (error) {
            console.error('添加教师失败:', error);
            App.Utils.showMessage('添加失败: ' + error.message, 'error');
        }
    },

    /**
     * 更新教师
     */
    async updateTeacher(teacherId, data) {
        try {
            const response = await App.Http.put(`/teacher/update_teacher/${teacherId}`, data);
            
            if (response && (response.status_code === 200 || response.message?.includes('成功'))) {
                App.Utils.showMessage('更新成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '更新失败', 'error');
            }
        } catch (error) {
            console.error('更新教师失败:', error);
            App.Utils.showMessage('更新失败: ' + error.message, 'error');
        }
    },

    /**
     * 确认删除
     */
    confirmDelete(teacherId) {
        App.Utils.createModal(
            '确认删除',
            `<p>确定要删除编号为 <strong>${teacherId}</strong> 的教师吗？此操作不可恢复。</p>`,
            () => {
                this.deleteTeacher(teacherId);
            }
        );
    },

    /**
     * 删除教师
     */
    async deleteTeacher(teacherId) {
        try {
            const response = await App.Http.delete(`/teacher/delete_teacher/${teacherId}`);
            
            if (response && (response.status_code === 200 || response.message?.includes('成功'))) {
                App.Utils.showMessage('删除成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除教师失败:', error);
            App.Utils.showMessage('删除失败: ' + error.message, 'error');
        }
    }
};

// 注册路由
App.Router.register('teacher', () => TeacherModule.render());

// 导出模块
window.TeacherModule = TeacherModule;

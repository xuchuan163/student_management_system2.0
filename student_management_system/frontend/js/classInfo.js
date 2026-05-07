/**
 * 学生管理系统 - 班级管理模块
 * API: /class_info/*
 */

const ClassModule = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    currentData: [],

    /**
     * 渲染班级管理页面
     */
    render() {
        document.getElementById('pageTitle').textContent = '班级管理';
        document.getElementById('contentBody').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>班级列表</h3>
                    <button class="btn btn-success" onclick="ClassModule.openAddModal()">
                        + 添加班级
                    </button>
                </div>
                <div class="card-body">
                    <!-- 搜索栏 -->
                    <div class="search-bar">
                        <select id="searchKey">
                            <option value="班级编号">班级编号</option>
                            <option value="班主任">班主任</option>
                            <option value="授课老师">授课老师</option>
                        </select>
                        <input type="text" id="searchValue" placeholder="请输入搜索内容">
                        <button class="btn btn-primary" onclick="ClassModule.search()">搜索</button>
                        <button class="btn btn-default" onclick="ClassModule.resetSearch()">重置</button>
                    </div>
                    
                    <!-- 数据表格 -->
                    <div id="classTable"></div>
                    
                    <!-- 分页 -->
                    <div id="classPagination"></div>
                </div>
            </div>
        `;
        
        this.loadData();
    },

    /**
     * 加载班级数据
     */
    async loadData(page = 1) {
        try {
            this.currentPage = page;
            const skip = (page - 1) * this.pageSize;
            
            const response = await App.Http.get('/class_info/get_class_limit', {
                skip: skip,
                limiit: this.pageSize
            });
            
            if (response && response.status_code === 200) {
                this.currentData = response.data || [];
                this.totalItems = this.currentData.length; // 实际应该从API获取总数
                this.renderTable();
                this.renderPagination();
            } else {
                // 如果分页接口失败，尝试获取全部
                const allResponse = await App.Http.get('/class_info/get_class_all');
                if (allResponse && allResponse.status_code === 200) {
                    this.currentData = allResponse.data || [];
                    this.totalItems = this.currentData.length;
                    this.renderTable();
                }
            }
        } catch (error) {
            console.error('加载班级数据失败:', error);
            App.Utils.showMessage('加载数据失败: ' + error.message, 'error');
        }
    },

    /**
     * 渲染表格
     */
    renderTable() {
        const columns = [
            { key: 'class_id', title: '班级编号' },
            { 
                key: 'course_start_date', 
                title: '课程开始时间',
                formatter: (val) => App.Utils.formatDate(val)
            },
            { key: 'is_homeroom_teacher', title: '班主任' },
            { key: 'class_teacher', title: '授课老师' }
        ];

        const actions = (row) => `
            <button class="btn btn-primary btn-sm" onclick="ClassModule.openEditModal(${row.class_id})">编辑</button>
            <button class="btn btn-danger btn-sm" onclick="ClassModule.confirmDelete(${row.class_id})">删除</button>
        `;

        App.DataTable.render('classTable', columns, this.currentData, actions);
    },

    /**
     * 渲染分页
     */
    renderPagination() {
        const totalPages = Math.ceil(this.totalItems / this.pageSize);
        App.Pagination.render('classPagination', this.currentPage, totalPages, this.totalItems, (page) => {
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
            const response = await App.Http.get('/class_info/search', {
                key: key,
                value: value
            });

            if (response && response.status_code === 200) {
                this.currentData = response.data || [];
                this.totalItems = this.currentData.length;
                this.renderTable();
                document.getElementById('classPagination').innerHTML = '';
                if (this.currentData.length === 0) {
                    App.Utils.showMessage('未找到匹配的班级信息', 'warning');
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
        document.getElementById('searchKey').value = '班级编号';
        document.getElementById('searchValue').value = '';
        this.loadData();
    },

    /**
     * 打开添加班级模态框
     */
    openAddModal() {
        const today = new Date().toISOString().split('T')[0];
        
        const formHtml = `
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">班级编号</label>
                        <input type="number" name="class_id" required>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">课程开始时间</label>
                        <input type="date" name="course_start_date" required max="${today}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">班主任</label>
                        <input type="text" name="is_homeroom_teacher" required minlength="1" maxlength="20">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">授课老师</label>
                        <input type="text" name="class_teacher" required minlength="1" maxlength="20">
                    </div>
                </div>
            </div>
        `;

        App.Utils.createFormModal('添加班级', formHtml, (data) => {
            this.addClass(data);
        });
    },

    /**
     * 打开编辑班级模态框
     */
    openEditModal(classId) {
        const classInfo = this.currentData.find(c => c.class_id === classId);
        if (!classInfo) {
            App.Utils.showMessage('未找到该班级', 'error');
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        const formHtml = `
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label>班级编号</label>
                        <input type="text" value="${classInfo.class_id}" disabled>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">课程开始时间</label>
                        <input type="date" name="course_start_date" required max="${today}" value="${classInfo.course_start_date || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">班主任</label>
                        <input type="text" name="is_homeroom_teacher" required minlength="1" maxlength="20" value="${classInfo.is_homeroom_teacher || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">授课老师</label>
                        <input type="text" name="class_teacher" required minlength="1" maxlength="20" value="${classInfo.class_teacher || ''}">
                    </div>
                </div>
            </div>
        `;

        App.Utils.createFormModal('编辑班级', formHtml, (data) => {
            this.updateClass(classId, data);
        });
    },

    /**
     * 添加班级
     */
    async addClass(data) {
        try {
            // 转换数据类型
            data.class_id = parseInt(data.class_id);
            
            const response = await App.Http.post('/class_info/', data);
            
            if (response && (response.status_code === 200 || response.message?.includes('成功'))) {
                App.Utils.showMessage('添加成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '添加失败', 'error');
            }
        } catch (error) {
            console.error('添加班级失败:', error);
            App.Utils.showMessage('添加失败: ' + error.message, 'error');
        }
    },

    /**
     * 更新班级
     */
    async updateClass(classId, data) {
        try {
            const response = await App.Http.put(`/class_info/${classId}`, data);
            
            if (response && (response.status_code === 200 || response.message?.includes('成功'))) {
                App.Utils.showMessage('更新成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '更新失败', 'error');
            }
        } catch (error) {
            console.error('更新班级失败:', error);
            App.Utils.showMessage('更新失败: ' + error.message, 'error');
        }
    },

    /**
     * 确认删除
     */
    confirmDelete(classId) {
        App.Utils.createModal(
            '确认删除',
            `<p>确定要删除编号为 <strong>${classId}</strong> 的班级吗？此操作不可恢复。</p>`,
            () => {
                this.deleteClass(classId);
            }
        );
    },

    /**
     * 删除班级
     */
    async deleteClass(classId) {
        try {
            const response = await App.Http.delete(`/class_info/${classId}`);
            
            if (response && (response.status_code === 200 || response.message?.includes('成功'))) {
                App.Utils.showMessage('删除成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除班级失败:', error);
            App.Utils.showMessage('删除失败: ' + error.message, 'error');
        }
    }
};

// 注册路由
App.Router.register('class', () => ClassModule.render());

// 导出模块
window.ClassModule = ClassModule;

/**
 * 学生管理系统 - 就业管理模块
 * API: /employment/*
 */

const EmploymentModule = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    currentData: [],

    /**
     * 渲染就业管理页面
     */
    render() {
        document.getElementById('pageTitle').textContent = '就业管理';
        document.getElementById('contentBody').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>就业信息列表</h3>
                    <button class="btn btn-success" onclick="EmploymentModule.openAddModal()">
                        + 添加就业信息
                    </button>
                </div>
                <div class="card-body">
                    <!-- 搜索栏 -->
                    <div class="search-bar">
                        <select id="searchKey">
                            <option value="学生编号">学生编号</option>
                            <option value="班级编号">班级编号</option>
                            <option value="就业公司">就业公司</option>
                            <option value="工资">薪资</option>
                        </select>
                        <input type="text" id="searchValue" placeholder="请输入搜索内容">
                        <button class="btn btn-primary" onclick="EmploymentModule.search()">搜索</button>
                        <button class="btn btn-default" onclick="EmploymentModule.resetSearch()">重置</button>
                    </div>
                    
                    <!-- 数据表格 -->
                    <div id="employmentTable"></div>
                    
                    <!-- 分页 -->
                    <div id="employmentPagination"></div>
                </div>
            </div>
        `;
        
        this.loadData();
    },

    /**
     * 加载就业数据
     */
    async loadData(page = 1) {
        try {
            this.currentPage = page;
            const response = await App.Http.get('/employment/pageshow', {
                page: page,
                size: this.pageSize
            });
            
            if (response && response.data) {
                this.currentData = response.data || [];
                // 如果分页接口没有返回总数，使用当前数据长度
                this.totalItems = this.currentData.length >= this.pageSize ? 
                    this.currentData.length + (page - 1) * this.pageSize + 1 : 
                    (page - 1) * this.pageSize + this.currentData.length;
                this.renderTable();
                this.renderPagination();
            } else {
                this.currentData = [];
                this.renderTable();
            }
        } catch (error) {
            console.error('加载就业数据失败:', error);
            App.Utils.showMessage('加载数据失败: ' + error.message, 'error');
        }
    },

    /**
     * 渲染表格
     */
    renderTable() {
        const columns = [
            { key: 'employment_id', title: '就业编号' },
            { key: 'student_id', title: '学生编号' },
            { key: 'student_name', title: '学生姓名' },
            { key: 'class_id', title: '班级编号' },
            { 
                key: 'open_time', 
                title: '就业开放时间',
                formatter: (val) => App.Utils.formatDate(val)
            },
            { 
                key: 'offer_time', 
                title: 'Offer时间',
                formatter: (val) => App.Utils.formatDate(val)
            },
            { key: 'company', title: '就业公司' },
            { 
                key: 'salary', 
                title: '薪资',
                formatter: (val) => val ? `¥${val}` : '-'
            }
        ];

        const actions = (row) => `
            <button class="btn btn-primary btn-sm" onclick="EmploymentModule.openEditModal(${row.employment_id})">编辑</button>
            <button class="btn btn-danger btn-sm" onclick="EmploymentModule.confirmDelete(${row.employment_id})">删除</button>
        `;

        App.DataTable.render('employmentTable', columns, this.currentData, actions);
    },

    /**
     * 渲染分页
     */
    renderPagination() {
        const totalPages = Math.ceil(this.totalItems / this.pageSize);
        App.Pagination.render('employmentPagination', this.currentPage, totalPages, this.totalItems, (page) => {
            this.loadData(page);
        });
    },

    /**
     * 搜索
     */
    async search() {
        const key = document.getElementById('searchKey').value;
        let value = document.getElementById('searchValue').value.trim();
        
        if (!value) {
            App.Utils.showMessage('请输入搜索内容', 'warning');
            return;
        }
        
        // 学生编号和班级编号需要转为数字
        if (key === '学生编号' || key === '班级编号') {
            value = parseInt(value);
            if (isNaN(value)) {
                App.Utils.showMessage('请输入有效的数字', 'warning');
                return;
            }
        }
        
        try {
            const response = await App.Http.get('/employment/query_by_type', {
                key: key,
                value: value
            });
            
            if (response && response.status_code === 200) {
                this.currentData = response.data || [];
                this.totalItems = this.currentData.length;
                this.renderTable();
                document.getElementById('employmentPagination').innerHTML = '';
                if (this.currentData.length === 0) {
                    App.Utils.showMessage('未找到匹配的就业信息', 'warning');
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
        document.getElementById('searchKey').value = '学生编号';
        document.getElementById('searchValue').value = '';
        this.loadData();
    },

    /**
     * 打开添加就业信息模态框
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
                        <label class="required">班级编号</label>
                        <input type="number" name="class_id" required>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>学生姓名</label>
                        <input type="text" name="student_name" maxlength="20">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>就业开放时间</label>
                        <input type="date" name="open_time">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>Offer时间</label>
                        <input type="date" name="offer_time">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>就业公司</label>
                        <input type="text" name="company" maxlength="50">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>薪资</label>
                        <input type="number" name="salary" step="0.01">
                    </div>
                </div>
            </div>
        `;

        App.Utils.createFormModal('添加就业信息', formHtml, (data) => {
            this.addEmployment(data);
        });
    },

    /**
     * 打开编辑就业信息模态框
     */
    openEditModal(employmentId) {
        const employment = this.currentData.find(e => e.employment_id === employmentId);
        if (!employment) {
            App.Utils.showMessage('未找到该就业信息', 'error');
            return;
        }

        const formHtml = `
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label>就业编号</label>
                        <input type="text" value="${employment.employment_id}" disabled>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">学生编号</label>
                        <input type="number" name="student_id" required value="${employment.student_id || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">班级编号</label>
                        <input type="number" name="class_id" required value="${employment.class_id || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>学生姓名</label>
                        <input type="text" name="student_name" maxlength="20" value="${employment.student_name || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>就业开放时间</label>
                        <input type="date" name="open_time" value="${employment.open_time || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>Offer时间</label>
                        <input type="date" name="offer_time" value="${employment.offer_time || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>就业公司</label>
                        <input type="text" name="company" maxlength="50" value="${employment.company || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>薪资</label>
                        <input type="number" name="salary" step="0.01" value="${employment.salary || ''}">
                    </div>
                </div>
            </div>
        `;

        App.Utils.createFormModal('编辑就业信息', formHtml, (data) => {
            this.updateEmployment(employmentId, data);
        });
    },

    /**
     * 添加就业信息
     */
    async addEmployment(data) {
        try {
            // 转换数据类型
            data.student_id = parseInt(data.student_id);
            data.class_id = parseInt(data.class_id);
            if (data.salary) {
                data.salary = parseFloat(data.salary);
            }
            
            const response = await App.Http.post('/employment/add', data);
            
            if (response && (response.message?.includes('成功') || response.status_code === 200)) {
                App.Utils.showMessage('添加成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '添加失败', 'error');
            }
        } catch (error) {
            console.error('添加就业信息失败:', error);
            App.Utils.showMessage('添加失败: ' + error.message, 'error');
        }
    },

    /**
     * 更新就业信息
     */
    async updateEmployment(employmentId, data) {
        try {
            // 转换数据类型
            data.student_id = parseInt(data.student_id);
            data.class_id = parseInt(data.class_id);
            if (data.salary) {
                data.salary = parseFloat(data.salary);
            }
            
            const response = await App.Http.put(`/employment/${employmentId}`, data);
            
            if (response && (response.message?.includes('成功') || response.status_code === 200)) {
                App.Utils.showMessage('更新成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '更新失败', 'error');
            }
        } catch (error) {
            console.error('更新就业信息失败:', error);
            App.Utils.showMessage('更新失败: ' + error.message, 'error');
        }
    },

    /**
     * 确认删除
     */
    confirmDelete(employmentId) {
        App.Utils.createModal(
            '确认删除',
            `<p>确定要删除编号为 <strong>${employmentId}</strong> 的就业信息吗？此操作不可恢复。</p>`,
            () => {
                this.deleteEmployment(employmentId);
            }
        );
    },

    /**
     * 删除就业信息
     */
    async deleteEmployment(employmentId) {
        try {
            const response = await App.Http.delete(`/employment/${employmentId}`);
            
            if (response && (response.message?.includes('成功') || response.status_code === 200)) {
                App.Utils.showMessage('删除成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除就业信息失败:', error);
            App.Utils.showMessage('删除失败: ' + error.message, 'error');
        }
    }
};

// 注册路由
App.Router.register('employment', () => EmploymentModule.render());

// 导出模块
window.EmploymentModule = EmploymentModule;

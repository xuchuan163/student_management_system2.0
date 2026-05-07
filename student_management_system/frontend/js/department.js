/**
 * 学生管理系统 - 部门管理模块
 * API: /department/*
 * 权限: admin可增删改，admin/employee可查询
 */

const DepartmentModule = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    currentData: [],

    /**
     * 检查是否有管理权限
     */
    hasAdminPermission() {
        return App.Utils.hasPermission(['admin']);
    },

    /**
     * 渲染部门管理页面
     */
    render() {
        document.getElementById('pageTitle').textContent = '部门管理';
        
        const canManage = this.hasAdminPermission();
        
        document.getElementById('contentBody').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>部门列表</h3>
                    ${canManage ? `
                    <button class="btn btn-success" onclick="DepartmentModule.openAddModal()">
                        + 添加部门
                    </button>
                    ` : ''}
                </div>
                <div class="card-body">
                    <!-- 搜索栏 -->
                    <div class="search-bar">
                        <input type="text" id="searchDeptId" placeholder="输入部门编号搜索">
                        <input type="text" id="searchDeptName" placeholder="输入部门名称搜索">
                        <button class="btn btn-primary" onclick="DepartmentModule.search()">搜索</button>
                        <button class="btn btn-default" onclick="DepartmentModule.resetSearch()">重置</button>
                    </div>
                    
                    <!-- 数据表格 -->
                    <div id="departmentTable"></div>
                    
                    <!-- 分页 -->
                    <div id="departmentPagination"></div>
                </div>
            </div>
        `;
        
        this.loadData();
    },

    /**
     * 加载部门数据
     */
    async loadData(page = 1) {
        try {
            this.currentPage = page;
            const response = await App.Http.get(`/department/page/${this.pageSize}/${page}`);
            
            if (response && response.status_code === 200) {
                // 处理后端返回的分页数据结构 {total, data}
                const result = response.data || {};
                this.currentData = result.data || [];
                this.totalItems = result.total || 0;
                this.renderTable();
                this.renderPagination();
            } else {
                this.currentData = [];
                this.totalItems = 0;
                this.renderTable();
                document.getElementById('departmentPagination').innerHTML = '';
            }
        } catch (error) {
            console.error('加载部门数据失败:', error);
            App.Utils.showMessage('加载数据失败: ' + error.message, 'error');
        }
    },

    /**
     * 渲染表格
     */
    renderTable() {
        const canManage = this.hasAdminPermission();
        
        const columns = [
            { key: 'department_id', title: '部门编号' },
            { key: 'dept_name', title: '部门名称' },
            { key: 'parent_id', title: '上级部门ID' },
            { key: 'leader', title: '部门负责人' },
            { key: 'phone', title: '联系电话' },
            { key: 'remark', title: '备注' }
        ];

        const actions = canManage ? (row) => `
            <button class="btn btn-primary btn-sm" onclick="DepartmentModule.openEditModal(${row.department_id})">编辑</button>
            <button class="btn btn-danger btn-sm" onclick="DepartmentModule.confirmDelete(${row.department_id})">删除</button>
        ` : null;

        App.DataTable.render('departmentTable', columns, this.currentData, actions);
    },

    /**
     * 渲染分页
     */
    renderPagination() {
        const totalPages = Math.ceil(this.totalItems / this.pageSize);
        App.Pagination.render('departmentPagination', this.currentPage, totalPages, this.totalItems, (page) => {
            this.loadData(page);
        });
    },

    /**
     * 搜索
     */
    async search() {
        const deptName = document.getElementById('searchDeptName').value.trim();
        
        try {
            const response = await App.Http.get(`/department/page/${this.pageSize}/1`, {
                dept_name: deptName
            });
            
            if (response && response.status_code === 200) {
                this.currentData = response.data || [];
                this.totalItems = this.currentData.length;
                this.renderTable();
                document.getElementById('departmentPagination').innerHTML = '';
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
        document.getElementById('searchDeptName').value = '';
        this.loadData();
    },

    /**
     * 打开添加部门模态框
     */
    openAddModal() {
        if (!this.hasAdminPermission()) {
            App.Utils.showMessage('您没有权限执行此操作', 'error');
            return;
        }

        const formHtml = `
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">部门名称</label>
                        <input type="text" name="dept_name" required minlength="1" maxlength="50">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>上级部门ID</label>
                        <input type="number" name="parent_id" value="0">
                        <small style="color: #999;">0表示顶级部门</small>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>部门负责人</label>
                        <input type="text" name="leader" minlength="1" maxlength="20">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>联系电话</label>
                        <input type="tel" name="phone" pattern="^1[3-9]\d{9}$" placeholder="11位手机号">
                    </div>
                </div>
                <div class="form-col form-col-1">
                    <div class="form-group">
                        <label>备注</label>
                        <textarea name="remark" rows="3"></textarea>
                    </div>
                </div>
            </div>
        `;

        App.Utils.createFormModal('添加部门', formHtml, (data) => {
            this.addDepartment(data);
        });
    },

    /**
     * 打开编辑部门模态框
     */
    openEditModal(departmentId) {
        if (!this.hasAdminPermission()) {
            App.Utils.showMessage('您没有权限执行此操作', 'error');
            return;
        }

        const department = this.currentData.find(d => d.department_id === departmentId);
        if (!department) {
            App.Utils.showMessage('未找到该部门', 'error');
            return;
        }

        const formHtml = `
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label>部门编号</label>
                        <input type="text" value="${department.department_id}" disabled>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">部门名称</label>
                        <input type="text" name="dept_name" required minlength="1" maxlength="50" value="${department.dept_name || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>上级部门ID</label>
                        <input type="number" name="parent_id" value="${department.parent_id || 0}">
                        <small style="color: #999;">0表示顶级部门</small>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>部门负责人</label>
                        <input type="text" name="leader" minlength="1" maxlength="20" value="${department.leader || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>联系电话</label>
                        <input type="tel" name="phone" pattern="^1[3-9]\d{9}$" placeholder="11位手机号" value="${department.phone || ''}">
                    </div>
                </div>
                <div class="form-col form-col-1">
                    <div class="form-group">
                        <label>备注</label>
                        <textarea name="remark" rows="3">${department.remark || ''}</textarea>
                    </div>
                </div>
            </div>
        `;

        App.Utils.createFormModal('编辑部门', formHtml, (data) => {
            this.updateDepartment(departmentId, data);
        });
    },

    /**
     * 添加部门
     */
    async addDepartment(data) {
        if (!this.hasAdminPermission()) {
            App.Utils.showMessage('您没有权限执行此操作', 'error');
            return;
        }

        try {
            // 转换数据类型
            data.parent_id = parseInt(data.parent_id) || 0;
            
            const response = await App.Http.post('/department/add', data);
            
            if (response && (response.status_code === 200 || response.message?.includes('成功'))) {
                App.Utils.showMessage('添加成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '添加失败', 'error');
            }
        } catch (error) {
            console.error('添加部门失败:', error);
            App.Utils.showMessage('添加失败: ' + error.message, 'error');
        }
    },

    /**
     * 更新部门
     */
    async updateDepartment(departmentId, data) {
        if (!this.hasAdminPermission()) {
            App.Utils.showMessage('您没有权限执行此操作', 'error');
            return;
        }

        try {
            // 转换数据类型
            data.parent_id = parseInt(data.parent_id) || 0;
            
            // 后端: PUT body=Department, query=department_id
            const response = await App.Http.put('/department/update', data, {
                department_id: departmentId
            });
            
            if (response && (response.status_code === 200 || response.message?.includes('成功'))) {
                App.Utils.showMessage('更新成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '更新失败', 'error');
            }
        } catch (error) {
            console.error('更新部门失败:', error);
            App.Utils.showMessage('更新失败: ' + error.message, 'error');
        }
    },

    /**
     * 确认删除
     */
    confirmDelete(departmentId) {
        if (!this.hasAdminPermission()) {
            App.Utils.showMessage('您没有权限执行此操作', 'error');
            return;
        }

        App.Utils.createModal(
            '确认删除',
            `<p>确定要删除编号为 <strong>${departmentId}</strong> 的部门吗？此操作不可恢复。</p>`,
            () => {
                this.deleteDepartment(departmentId);
            }
        );
    },

    /**
     * 删除部门
     */
    async deleteDepartment(departmentId) {
        if (!this.hasAdminPermission()) {
            App.Utils.showMessage('您没有权限执行此操作', 'error');
            return;
        }

        try {
            const response = await App.Http.delete(`/department/${departmentId}`);
            
            if (response && (response.status_code === 200 || response.message?.includes('成功'))) {
                App.Utils.showMessage('删除成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除部门失败:', error);
            App.Utils.showMessage('删除失败: ' + error.message, 'error');
        }
    }
};

// 注册路由
App.Router.register('department', () => DepartmentModule.render());

// 导出模块
window.DepartmentModule = DepartmentModule;

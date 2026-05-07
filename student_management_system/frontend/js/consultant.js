/**
 * 学生管理系统 - 顾问管理模块
 * API: /consultant/*
 * 权限: admin可增删改，admin/employee可查询
 */

const ConsultantModule = {
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
     * 渲染顾问管理页面
     */
    render() {
        document.getElementById('pageTitle').textContent = '顾问管理';
        
        const canManage = this.hasAdminPermission();
        
        document.getElementById('contentBody').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>顾问列表</h3>
                    ${canManage ? `
                    <button class="btn btn-success" onclick="ConsultantModule.openAddModal()">
                        + 添加顾问
                    </button>
                    ` : ''}
                </div>
                <div class="card-body">
                    <!-- 数据表格 -->
                    <div id="consultantTable"></div>
                    
                    <!-- 分页 -->
                    <div id="consultantPagination"></div>
                </div>
            </div>
        `;
        
        this.loadData();
    },

    /**
     * 加载顾问数据
     */
    async loadData(page = 1) {
        try {
            this.currentPage = page;
            const response = await App.Http.get(`/consultant/page/${this.pageSize}/${page}`);
            
            if (response && response.status_code === 200) {
                this.currentData = response.data || [];
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
            console.error('加载顾问数据失败:', error);
            App.Utils.showMessage('加载数据失败: ' + error.message, 'error');
        }
    },

    /**
     * 渲染表格
     */
    renderTable() {
        const canManage = this.hasAdminPermission();
        
        const columns = [
            { key: 'consultant_id', title: '顾问编号' },
            { key: 'name', title: '姓名' },
            { key: 'gender', title: '性别' },
            { key: 'dept_id', title: '部门ID' },
            { key: 'position', title: '职位' },
            { key: 'phone', title: '联系电话' },
            { 
                key: 'entry_date', 
                title: '入职日期',
                formatter: (val) => App.Utils.formatDateTime(val)
            },
            { 
                key: 'status', 
                title: '状态',
                formatter: (val) => val === 1 ? '<span style="color: #52c41a;">在职</span>' : '<span style="color: #999;">离职</span>'
            },
            { key: 'remark', title: '备注' }
        ];

        const actions = canManage ? (row) => `
            <button class="btn btn-primary btn-sm" onclick="ConsultantModule.openEditModal(${row.consultant_id})">编辑</button>
            <button class="btn btn-danger btn-sm" onclick="ConsultantModule.confirmDelete(${row.consultant_id})">删除</button>
        ` : null;

        App.DataTable.render('consultantTable', columns, this.currentData, actions);
    },

    /**
     * 渲染分页
     */
    renderPagination() {
        const totalPages = Math.ceil(this.totalItems / this.pageSize);
        App.Pagination.render('consultantPagination', this.currentPage, totalPages, this.totalItems, (page) => {
            this.loadData(page);
        });
    },

    /**
     * 打开添加顾问模态框
     */
    openAddModal() {
        if (!this.hasAdminPermission()) {
            App.Utils.showMessage('您没有权限执行此操作', 'error');
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        const formHtml = `
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">顾问姓名</label>
                        <input type="text" name="name" required minlength="1" maxlength="20">
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
                        <label class="required">所属部门ID</label>
                        <input type="number" name="dept_id" required>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">职位</label>
                        <input type="text" name="position" required minlength="1" maxlength="50">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>联系电话</label>
                        <input type="tel" name="phone" pattern="^1[3-9]\\d{9}$" placeholder="11位手机号">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">入职日期</label>
                        <input type="date" name="entry_date" required max="${today}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">状态</label>
                        <select name="status" required>
                            <option value="1">在职</option>
                            <option value="0">离职</option>
                        </select>
                    </div>
                </div>
                <div class="form-col form-col-1">
                    <div class="form-group">
                        <label class="required">备注</label>
                        <textarea name="remark" rows="3" required minlength="1" maxlength="255"></textarea>
                    </div>
                </div>
            </div>
        `;

        App.Utils.createFormModal('添加顾问', formHtml, (data) => {
            this.addConsultant(data);
        });
    },

    /**
     * 打开编辑顾问模态框
     */
    openEditModal(consultantId) {
        if (!this.hasAdminPermission()) {
            App.Utils.showMessage('您没有权限执行此操作', 'error');
            return;
        }

        const consultant = this.currentData.find(c => c.consultant_id === consultantId);
        if (!consultant) {
            App.Utils.showMessage('未找到该顾问', 'error');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const entryDate = consultant.entry_date ? consultant.entry_date.split('T')[0] : '';

        const formHtml = `
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label>顾问编号</label>
                        <input type="text" value="${consultant.consultant_id}" disabled>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">顾问姓名</label>
                        <input type="text" name="name" required minlength="1" maxlength="20" value="${consultant.name || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">性别</label>
                        <select name="gender" required>
                            <option value="男" ${consultant.gender === '男' ? 'selected' : ''}>男</option>
                            <option value="女" ${consultant.gender === '女' ? 'selected' : ''}>女</option>
                        </select>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">所属部门ID</label>
                        <input type="number" name="dept_id" required value="${consultant.dept_id || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">职位</label>
                        <input type="text" name="position" required minlength="1" maxlength="50" value="${consultant.position || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label>联系电话</label>
                        <input type="tel" name="phone" pattern="^1[3-9]\\d{9}$" placeholder="11位手机号" value="${consultant.phone || ''}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">入职日期</label>
                        <input type="date" name="entry_date" required max="${today}" value="${entryDate}">
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label class="required">状态</label>
                        <select name="status" required>
                            <option value="1" ${consultant.status === 1 ? 'selected' : ''}>在职</option>
                            <option value="0" ${consultant.status === 0 ? 'selected' : ''}>离职</option>
                        </select>
                    </div>
                </div>
                <div class="form-col form-col-1">
                    <div class="form-group">
                        <label class="required">备注</label>
                        <textarea name="remark" rows="3" required minlength="1" maxlength="255">${consultant.remark || ''}</textarea>
                    </div>
                </div>
            </div>
        `;

        App.Utils.createFormModal('编辑顾问', formHtml, (data) => {
            this.updateConsultant(consultantId, data);
        });
    },

    /**
     * 添加顾问
     */
    async addConsultant(data) {
        if (!this.hasAdminPermission()) {
            App.Utils.showMessage('您没有权限执行此操作', 'error');
            return;
        }

        try {
            // 转换数据类型
            data.dept_id = parseInt(data.dept_id);
            data.status = parseInt(data.status);
            
            const response = await App.Http.post('/consultant/add', data);
            
            if (response && (response.status_code === 200 || response.message?.includes('成功'))) {
                App.Utils.showMessage('添加成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '添加失败', 'error');
            }
        } catch (error) {
            console.error('添加顾问失败:', error);
            App.Utils.showMessage('添加失败: ' + error.message, 'error');
        }
    },

    /**
     * 更新顾问
     */
    async updateConsultant(consultantId, data) {
        if (!this.hasAdminPermission()) {
            App.Utils.showMessage('您没有权限执行此操作', 'error');
            return;
        }

        try {
            // 转换数据类型
            data.dept_id = parseInt(data.dept_id);
            data.status = parseInt(data.status);
            
            // 后端: PUT body=Cosulant, query=consultant_id
            const response = await App.Http.put('/consultant/update', data, {
                consultant_id: consultantId
            });
            
            if (response && (response.status_code === 200 || response.message?.includes('成功'))) {
                App.Utils.showMessage('更新成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '更新失败', 'error');
            }
        } catch (error) {
            console.error('更新顾问失败:', error);
            App.Utils.showMessage('更新失败: ' + error.message, 'error');
        }
    },

    /**
     * 确认删除
     */
    confirmDelete(consultantId) {
        if (!this.hasAdminPermission()) {
            App.Utils.showMessage('您没有权限执行此操作', 'error');
            return;
        }

        App.Utils.createModal(
            '确认删除',
            `<p>确定要删除编号为 <strong>${consultantId}</strong> 的顾问吗？此操作不可恢复。</p>`,
            () => {
                this.deleteConsultant(consultantId);
            }
        );
    },

    /**
     * 删除顾问
     */
    async deleteConsultant(consultantId) {
        if (!this.hasAdminPermission()) {
            App.Utils.showMessage('您没有权限执行此操作', 'error');
            return;
        }

        try {
            const response = await App.Http.delete(`/consultant/${consultantId}`);
            
            if (response && (response.status_code === 200 || response.message?.includes('成功'))) {
                App.Utils.showMessage('删除成功');
                this.loadData();
            } else {
                App.Utils.showMessage(response.message || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除顾问失败:', error);
            App.Utils.showMessage('删除失败: ' + error.message, 'error');
        }
    }
};

// 注册路由
App.Router.register('consultant', () => ConsultantModule.render());

// 导出模块
window.ConsultantModule = ConsultantModule;

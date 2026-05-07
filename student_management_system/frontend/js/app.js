/**
 * 学生管理系统 - 核心框架
 * 提供路由管理、HTTP请求封装、消息提示等基础功能
 */

// ============================================
// 配置
// ============================================
const CONFIG = {
    API_BASE_URL: '',  // 使用相对路径，自动匹配当前域名和端口
    DEFAULT_PAGE_SIZE: 10
};

// ============================================
// 工具函数
// ============================================
const Utils = {
    /**
     * 显示消息提示
     */
    showMessage(message, type = 'success', duration = 3000) {
        // 移除已有的消息
        const existingMsg = document.querySelector('.message');
        if (existingMsg) {
            existingMsg.remove();
        }

        const msgEl = document.createElement('div');
        msgEl.className = `message ${type}`;
        msgEl.textContent = message;
        document.body.appendChild(msgEl);

        setTimeout(() => {
            msgEl.remove();
        }, duration);
    },

    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('zh-CN');
    },

    /**
     * 格式化日期时间
     */
    formatDateTime(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleString('zh-CN');
    },

    /**
     * 获取Cookie值
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    },

    /**
     * 获取当前用户信息
     */
    getCurrentUser() {
        const role = this.getCookie('role') || sessionStorage.getItem('role');
        const username = this.getCookie('username') || sessionStorage.getItem('username');
        return { role, username };
    },

    /**
     * 检查是否有权限
     */
    hasPermission(allowedRoles) {
        const user = this.getCurrentUser();
        if (!user.role) return false;
        return allowedRoles.includes(user.role);
    },

    /**
     * 防抖函数
     */
    debounce(fn, delay = 300) {
        let timer = null;
        return function (...args) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    /**
     * 创建模态框
     */
    createModal(title, content, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" id="modalCancel">取消</button>
                    <button class="btn btn-primary" id="modalConfirm">确定</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // 关闭事件
        const closeModal = () => overlay.remove();
        
        overlay.querySelector('.modal-close').addEventListener('click', () => {
            closeModal();
            if (onCancel) onCancel();
        });

        overlay.querySelector('#modalCancel').addEventListener('click', () => {
            closeModal();
            if (onCancel) onCancel();
        });

        overlay.querySelector('#modalConfirm').addEventListener('click', () => {
            closeModal();
            if (onConfirm) onConfirm();
        });

        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
                if (onCancel) onCancel();
            }
        });
    },

    /**
     * 创建表单模态框
     */
    createFormModal(title, formHtml, onSubmit, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="modalForm">
                    <div class="modal-body">
                        ${formHtml}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" id="modalCancel">取消</button>
                        <button type="submit" class="btn btn-primary">确定</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(overlay);

        const closeModal = () => overlay.remove();

        overlay.querySelector('.modal-close').addEventListener('click', () => {
            closeModal();
            if (onCancel) onCancel();
        });

        overlay.querySelector('#modalCancel').addEventListener('click', () => {
            closeModal();
            if (onCancel) onCancel();
        });

        overlay.querySelector('#modalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            onSubmit(data);
            closeModal();
        });

        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
                if (onCancel) onCancel();
            }
        });

        return overlay;
    }
};

// ============================================
// HTTP 请求封装
// ============================================
const Http = {
    /**
     * 基础请求方法
     */
    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'  // 携带Cookie
        };

        const response = await fetch(`${CONFIG.API_BASE_URL}${url}`, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });

        // 处理401未授权
        if (response.status === 401) {
            Utils.showMessage('登录已过期，请重新登录', 'error');
            setTimeout(() => {
                window.location.href = '/frontend/index.html';
            }, 1500);
            throw new Error('Unauthorized');
        }

        // 尝试解析JSON响应
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            throw new Error(data.message || data || '请求失败');
        }

        return data;
    },

    /**
     * GET 请求
     */
    get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    /**
     * POST 请求
     */
    post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * POST FormData 请求
     */
    postForm(url, formData) {
        return this.request(url, {
            method: 'POST',
            body: formData,
            headers: {}  // 让浏览器自动设置Content-Type
        });
    },

    /**
     * PUT 请求
     */
    put(url, data = {}, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * DELETE 请求
     */
    delete(url) {
        return this.request(url, { method: 'DELETE' });
    }
};

// ============================================
// 路由管理
// ============================================
const Router = {
    routes: {},
    currentRoute: null,

    /**
     * 注册路由
     */
    register(path, handler) {
        this.routes[path] = handler;
    },

    /**
     * 导航到指定路由
     */
    navigate(path) {
        window.location.hash = path;
    },

    /**
     * 处理路由变化
     */
    handle() {
        const hash = window.location.hash.slice(1) || 'student';
        const handler = this.routes[hash];
        
        if (handler) {
            this.currentRoute = hash;
            handler();
            this.updateActiveNav(hash);
        } else {
            // 默认路由
            this.navigate('student');
        }
    },

    /**
     * 更新导航激活状态
     */
    updateActiveNav(route) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.route === route) {
                item.classList.add('active');
            }
        });
    },

    /**
     * 初始化路由
     */
    init() {
        window.addEventListener('hashchange', () => this.handle());
        // 页面加载时处理一次
        if (window.location.hash) {
            this.handle();
        }
    }
};

// ============================================
// 分页组件
// ============================================
const Pagination = {
    /**
     * 渲染分页组件
     */
    render(containerId, currentPage, totalPages, totalItems, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '<div class="pagination">';
        html += `<span class="pagination-info">共 ${totalItems} 条，${totalPages} 页</span>`;
        
        // 上一页
        html += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="Pagination.goTo(${currentPage - 1}, ${onPageChange})">上一页</button>`;
        
        // 页码
        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        
        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        if (startPage > 1) {
            html += `<button onclick="Pagination.goTo(1, ${onPageChange})">1</button>`;
            if (startPage > 2) html += '<span>...</span>';
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="${i === currentPage ? 'active' : ''}" onclick="Pagination.goTo(${i}, ${onPageChange})">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += '<span>...</span>';
            html += `<button onclick="Pagination.goTo(${totalPages}, ${onPageChange})">${totalPages}</button>`;
        }

        // 下一页
        html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="Pagination.goTo(${currentPage + 1}, ${onPageChange})">下一页</button>`;
        html += '</div>';

        container.innerHTML = html;
    },

    /**
     * 跳转到指定页
     */
    goTo(page, callback) {
        callback(page);
    }
};

// ============================================
// 表格组件
// ============================================
const DataTable = {
    /**
     * 渲染表格
     */
    render(containerId, columns, data, actions = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>暂无数据</p>
                </div>
            `;
            return;
        }

        let html = '<div class="table-container"><table class="data-table"><thead><tr>';
        
        // 表头
        columns.forEach(col => {
            html += `<th>${col.title}</th>`;
        });
        
        if (actions) {
            html += '<th>操作</th>';
        }
        
        html += '</tr></thead><tbody>';

        // 数据行
        data.forEach((row, index) => {
            html += '<tr>';
            columns.forEach(col => {
                let value = row[col.key];
                if (col.formatter) {
                    value = col.formatter(value, row, index);
                }
                html += `<td>${value !== undefined && value !== null ? value : '-'}</td>`;
            });
            
            if (actions) {
                html += `<td class="actions">${actions(row, index)}</td>`;
            }
            
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
    }
};

// ============================================
// 初始化
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // 绑定导航点击事件
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const route = item.dataset.route;
            if (route) {
                Router.navigate(route);
            }
        });
    });
});

// 导出全局对象
window.App = {
    CONFIG,
    Utils,
    Http,
    Router,
    Pagination,
    DataTable
};

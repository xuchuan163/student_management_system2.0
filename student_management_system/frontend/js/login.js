/**
 * 学生管理系统 - 登录模块
 */

// 检查是否已登录（通过后端专用接口验证）
async function checkAuth() {
    if (!window.location.pathname.includes('index.html')) return;
    
    try {
        const res = await fetch('/api/check_auth', {
            method: 'GET',
            credentials: 'include'
        });
        const data = await res.json();
        if (data.authenticated) {
            // 已登录，跳转到首页
            window.location.href = '/frontend/home.html';
        }
    } catch (e) {
        // 网络错误，留在登录页
    }
}

// 登录处理
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorEl = document.getElementById('loginError');
    
    if (!username || !password) {
        errorEl.textContent = '请输入用户名和密码';
        return;
    }
    
    try {
        // 使用 FormData 提交，因为后端使用 Form 接收
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await fetch('/operate/login', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok && data.code === 200) {
            // 登录成功，保存用户信息到 sessionStorage
            const role = response.headers.get('Role') || 'admin';
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('role', role);
            
            // 跳转到管理页面（Cookie 已由后端设置）
            window.location.href = '/frontend/home.html';
        } else {
            errorEl.textContent = data.msg || '登录失败，请检查用户名和密码';
        }
    } catch (error) {
        console.error('登录错误:', error);
        errorEl.textContent = '网络错误，请稍后重试';
    }
}

// 登出处理
async function handleLogout() {
    try {
        await fetch('/operate/logout', {
            method: 'GET',
            credentials: 'include'
        });
        
        // 清除本地存储
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('username');
        
        // 跳转到登录页
        window.location.href = '/frontend/index.html';
    } catch (error) {
        console.error('登出错误:', error);
        window.location.href = '/frontend/index.html';
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查认证状态
    checkAuth();
    
    // 绑定登录表单
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 绑定登出按钮
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

from fastapi import FastAPI, HTTPException, Request
import uvicorn
from utils.log import logger
from fastapi.responses import HTMLResponse, RedirectResponse
from api.statistical_analysis import analysis_router
from fastapi.staticfiles import StaticFiles
from api import class_info, student, teacher, employment, score, login, consultant, department
from utils import decorator
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="学生管理系统",
              description="基于 FastAPI + SQLAlchemy 实现的前后端分离学生信息管理系统",
              version="1.0.0"
              )

# 注册所有 API 路由
app.include_router(student.student_router, prefix='/student', tags=['学生基本信息'])
app.include_router(score.score_router, prefix="/score", tags=["成绩板块"])
app.include_router(employment.employment_router, prefix='/employment', tags=["就业信息系统"])
app.include_router(class_info.class_router, prefix='/class_info', tags=["班级管理系统"])
app.include_router(teacher.teacher_router, prefix="/teacher", tags=["教师信息管理系统"])
app.include_router(analysis_router, prefix='/student', tags=['统计分析接口'])
app.include_router(department.department_router, prefix='/department', tags=['部门信息'])
app.include_router(consultant.consultant_router, prefix='/consultant', tags=['顾问信息'])
app.include_router(login.login_router, prefix='/operate', tags=['账号操作'])

# 根路径重定向到前端登录页
@app.get("/", tags=['首页'])
def root():
    return RedirectResponse("/frontend/index.html")


# 登录状态验证接口（供前端调用，检查 Cookie 中的 Token 是否有效）
@app.get("/api/check_auth", tags=['认证'])
def check_auth(request: Request):
    cookie_key = os.getenv('COOKIE_KEY', 'token')
    token = request.cookies.get(cookie_key)
    if not token:
        return {"authenticated": False}
    try:
        info = decorator.aes_decrypt(token)
        now = int(datetime.now().timestamp())
        if now > info["exp"]:
            return {"authenticated": False, "expired": True}
        return {"authenticated": True, "role": info.get("role", ""), "uid": info.get("uid", "")}
    except Exception:
        return {"authenticated": False}


# ========== 静态文件挂载必须放在所有路由之后 ==========
# 挂载日志目录
app.mount("/log", StaticFiles(directory="log"))

# 挂载 frontend 目录（前端文件）
app.mount("/frontend", StaticFiles(directory="frontend", html=True), name="frontend")


if __name__ == '__main__':
    server_host = os.getenv('SERVER_HOST', 'localhost')
    server_port = int(os.getenv('SERVER_PORT', '8937'))
    uvicorn.run('main:app', host=server_host, port=server_port)
    logger.info('启动项目')

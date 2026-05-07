from fastapi import APIRouter, Request, Response, Form, Depends
from starlette.responses import HTMLResponse
from database import get_db
from utils.decorator import get_token, auth
from dao import sysuser
from utils.log import logger
import os
from dotenv import load_dotenv

load_dotenv()

COOKIE_KEY = os.getenv('COOKIE_KEY', 'token')
COOKIE_MAX_AGE = int(os.getenv('COOKIE_MAX_AGE', '2592000'))

login_router = APIRouter()


# 登录接口：校验账号密码后下发cookie token
@login_router.post("/login")
async def login(res: Response, username: str = Form(...), password: str = Form(...), db=Depends(get_db)):
    # 1. 根据账号查询用户
    user = sysuser.queryUserById(db, username)
    if not user:
        logger.warning(f'{username}账号不存在')
        return {"code": 400, "msg": "账号不存在"}
    # 2. 判断密码是否正确
    if user.password != password:
        logger.warning(f'{username}密码错误')
        return {"code": 400, "msg": "密码错误"}
    # # 3. 获取用户角色
    role = user.role.role_name
    # 4. 生成token
    token = get_token(user.id, role)
    # 设置浏览器cookie
    res.set_cookie(
        key=COOKIE_KEY,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True  # 防止JS窃取，安全必备
    )
    res.headers["Role"] = role          # 角色
    res.headers["Username"] = username  # 账号
    logger.info(f'{username}登录成功')
    return {"code": 200, "msg": "登录成功"}


# 登录页面
@login_router.get("/home", response_class=HTMLResponse)
def admin_page():
    with open("html/manager.html", "r", encoding="utf-8") as f:
        return f.read()

# 登出接口：清除cookie
@login_router.get("/logout")
async def logout(res: Response):
    res.delete_cookie(COOKIE_KEY)
    return {"msg": "退出登录成功"}


@login_router.get("/manager", response_class=HTMLResponse)
def admin_page():
    with open("html/manager.html", "r", encoding="utf-8") as f:
        return f.read()




# 学生信息管理系统

基于 **FastAPI + SQLAlchemy** 实现的前后端分离学生信息管理系统，前端采用原生 HTML/CSS/JS（无框架），后端提供 RESTful API 接口。

## 技术栈

| 层级 | 技术 |
|------|------|
| Web 框架 | FastAPI 0.136.1 |
| ORM | SQLAlchemy 2.0.49 |
| 数据验证 | Pydantic 2.13.3 |
| 数据库 | MySQL |
| ASGI 服务器 | Uvicorn 0.46.0 |
| 加密 | cryptography 48.0.0 (AES-CBC) |
| 环境变量 | python-dotenv 1.2.2 |
| 前端 | 原生 HTML5 / CSS3 / JavaScript (SPA) |

## 项目结构

```
student_management_system/
├── main.py                 # 应用入口，路由注册与启动
├── database.py             # 数据库连接配置（SQLAlchemy 引擎/会话）
├── requirements.txt        # Python 依赖
├── .env                    # 环境变量配置（数据库、服务器、加密等）
│
├── api/                    # API 路由层（接口定义）
│   ├── login.py            # 登录/登出接口
│   ├── student.py          # 学生信息 CRUD
│   ├── teacher.py          # 教师信息 CRUD + 搜索
│   ├── class_info.py       # 班级信息 CRUD + 搜索
│   ├── score.py            # 成绩信息 CRUD
│   ├── employment.py       # 就业信息 CRUD + 搜索
│   ├── department.py       # 部门信息 CRUD（需 admin 权限）
│   ├── consultant.py       # 顾问信息 CRUD（需 admin 权限）
│   └── statistical_analysis.py  # 统计分析接口（8 个统计视图）
│
├── dao/                    # 数据访问层（SQL 操作）
│   ├── sysuser.py          # 系统用户查询
│   ├── student.py          # 学生数据操作
│   ├── teacher.py          # 教师数据操作
│   ├── class_info.py       # 班级数据操作
│   ├── score.py            # 成绩数据操作
│   ├── employment.py       # 就业数据操作
│   ├── department.py       # 部门数据操作
│   ├── consultant.py       # 顾问数据操作
│   └── statistical_analysis.py  # 统计查询
│
├── models/                 # SQLAlchemy ORM 模型
│   ├── student.py          # 学生表 (t_student)
│   ├── teacher.py          # 教师表 (t_teacher)
│   ├── class_info.py       # 班级表 (t_class_info)
│   ├── class_to_teacher.py # 班级-教师关联表
│   ├── score.py            # 成绩表 (t_student_score)
│   ├── employment.py       # 就业表 (t_employment_info)
│   ├── department.py       # 部门表 (t_department)
│   ├── consultant.py       # 顾问表 (t_consultant)
│   └── sysuser.py          # 系统用户表 (t_sys_user) + 角色表 (t_sys_role)
│
├── schemas/                # Pydantic 数据模型（请求/响应校验）
│   ├── student.py
│   ├── teacher.py
│   ├── class_info.py
│   ├── score.py
│   ├── employment.py
│   ├── department.py
│   └── consultant.py
│
├── utils/                  # 工具模块
│   ├── decorator.py        # AES 加解密 + Token 生成 + 权限认证装饰器
│   └── log.py              # 日志配置（文件 + 控制台）
│
├── frontend/               # 前端文件（SPA 单页应用）
│   ├── index.html          # 登录页
│   ├── home.html           # 主界面（侧边栏导航 + 内容区）
│   ├── css/
│   │   └── style.css       # 全局样式
│   └── js/
│       ├── app.js          # 核心框架（路由/HTTP/工具函数/分页/数据表格）
│       ├── login.js        # 登录/登出逻辑
│       ├── student.js      # 学生管理模块
│       ├── teacher.js      # 教师管理模块
│       ├── classInfo.js    # 班级管理模块
│       ├── score.js        # 成绩管理模块
│       ├── employment.js   # 就业管理模块
│       ├── department.js   # 部门管理模块
│       ├── consultant.js   # 顾问管理模块
│       └── statistics.js   # 统计分析模块
│
└── log/                    # 日志文件目录
```

## API 接口一览

### 账号操作 `/operate`
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/operate/login` | 用户登录（表单提交） |
| GET  | `/operate/logout` | 退出登录 |

### 学生信息 `/student`
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/student/students` | 添加学生 |
| GET  | `/student/students` | 查询学生（支持 `key`/`value` 搜索：编号/姓名/班级） |
| PUT  | `/student/students/{id}` | 修改学生信息 |
| DELETE | `/student/{student_id}` | 删除学生（软删除） |

### 教师信息 `/teacher`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/teacher/check_teacher` | 分页查询教师 |
| POST | `/teacher/add_teacher` | 添加教师 |
| PUT  | `/teacher/update_teacher/{id}` | 修改教师信息 |
| DELETE | `/teacher/delete_teacher/{id}` | 删除教师 |
| GET  | `/teacher/search` | 搜索教师（教师编号/教师姓名/任教科目） |

### 班级信息 `/class_info`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/class_info/search` | 搜索班级（班级编号/班主任/授课老师） |
| GET  | `/class_info/get_class_all` | 查询所有班级 |
| GET  | `/class_info/get_class_limit` | 分页查询班级 |
| POST | `/class_info/` | 添加班级 |
| GET  | `/class_info/{class_id}` | 查询单个班级 |
| PUT  | `/class_info/{class_id}` | 修改班级信息 |
| DELETE | `/class_info/{class_id}` | 删除班级 |

### 成绩管理 `/score`
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/score/score` | 录入成绩 |
| GET  | `/score/score/{student_id}` | 获取某学生所有成绩 |
| PUT  | `/score/score/update` | 修改成绩（按学生编号+考核序次） |
| DELETE | `/score/score/delete` | 删除成绩（按学生编号+考核序次） |

### 就业信息 `/employment`
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/employment/add` | 添加就业信息 |
| GET  | `/employment/query_by_type` | 按条件查询（学生编号/班级编号/就业公司/工资） |
| PUT  | `/employment/{employment_id}` | 修改就业信息 |
| DELETE | `/employment/{employment_id}` | 删除就业信息 |
| GET  | `/employment/pageshow` | 分页查询就业信息 |

### 部门信息 `/department`（需 admin 权限）
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/department/add` | 添加部门 |
| PUT  | `/department/update` | 修改部门 |
| DELETE | `/department/{department_id}` | 删除部门 |
| GET  | `/department/page/{page_size}/{page_num}` | 分页查询部门 |
| GET  | `/department/query_parent` | 查询父部门 |

### 顾问信息 `/consultant`（需 admin 权限）
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/consultant/add` | 添加顾问 |
| PUT  | `/consultant/update` | 修改顾问 |
| DELETE | `/consultant/{consultant_id}` | 删除顾问 |
| GET  | `/consultant/page/{page_size}/{page_num}` | 分页查询顾问 |

### 统计分析 `/student`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/student/age/over30` | 查询超过 30 岁的学生 |
| GET  | `/student/count` | 统计每个班级人数及男女比例 |
| GET  | `/student/score/excellent` | 查询每次考试 80 分以上的学生 |
| GET  | `/student/score/excellent_1` | 查询两次以上不及格的学生 |
| GET  | `/student/score/excellent_2` | 每次考试各班级平均分排名 |
| GET  | `/student/top_salary` | 就业薪资前五名学生 |
| GET  | `/student/employ_time` | 每个学生的就业时长 |
| GET  | `/student/avg_time` | 每个班级的平均就业时长 |

### 认证接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/check_auth` | 检查 Cookie Token 是否有效 |

## 快速开始

### 1. 环境准备

- Python 3.10+
- MySQL 5.7+ / 8.0+

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

复制并编辑 `.env` 文件：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password

# 服务器配置
SERVER_HOST=0.0.0.0
SERVER_PORT=8937

# 安全配置（AES 密钥必须为 16 位字符串）
AES_KEY=1234567890123456
AES_IV=1234567890123456

# Token 配置
TOKEN_EXPIRE_SECONDS=3600
COOKIE_MAX_AGE=2592000
COOKIE_KEY=token

# 数据库连接池配置
POOL_SIZE=10
MAX_OVERFLOW=20
POOL_RECYCLE=3600
POOL_TIMEOUT=30
```

### 4. 启动服务

```bash
python main.py
```

服务启动后访问：`http://localhost:8937`

## 核心设计说明

### 认证机制
- 登录成功后通过 AES-CBC 加密生成 Token，写入 HttpOnly Cookie
- 所有受保护接口通过 `@auth(allow_role=[...])` 装饰器进行权限校验
- 前端通过 `/api/check_auth` 接口验证登录状态

### 软删除
- 学生表使用 `del_flag` 字段实现软删除（`'0'` 正常，`'Y'` 已删除）

### 前端架构
- 基于 Hash 路由的 SPA 单页应用，无前端框架依赖
- 通过 `App.Http` 封装统一请求处理（含 Token 自动携带）
- 搜索接口使用中文 Literal 键名（如 `姓名`、`编号`、`班级`）

### 路由注意事项
- FastAPI 静态文件挂载（`app.mount`）必须放在所有 API 路由注册之后
- 动态路径路由（如 `/{class_id}`）必须放在固定路径路由（如 `/search`）之后

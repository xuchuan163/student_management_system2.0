from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,declarative_base
from dotenv import load_dotenv
import os

load_dotenv()
DB_HOST = os.getenv('DB_HOST')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_NAME = os.getenv('DB_NAME')

DATA_URL = f'mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}'

# 从 .env 读取连接池配置
POOL_SIZE = int(os.getenv('POOL_SIZE', '10'))
MAX_OVERFLOW = int(os.getenv('MAX_OVERFLOW', '20'))
POOL_RECYCLE = int(os.getenv('POOL_RECYCLE', '3600'))
POOL_TIMEOUT = int(os.getenv('POOL_TIMEOUT', '30'))

engine = create_engine(DATA_URL,
                       # 1. 连接池核心参数（必调）
                       pool_size=POOL_SIZE,
                       max_overflow=MAX_OVERFLOW,
                       pool_recycle=POOL_RECYCLE,
                       pool_pre_ping=True,  # 连接前心跳检测，彻底解决"断连"问题
                       pool_timeout=POOL_TIMEOUT,
                       )

Base = declarative_base()

Session = sessionmaker(bind=engine)


def get_db() -> Session:
    try:
        db = Session()
        yield db
    finally:
        db.close()

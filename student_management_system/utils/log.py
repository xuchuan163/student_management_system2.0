import logging
import os

# 先创建 log 文件夹（不存在就自动创建）
if not os.path.exists("log"):
    os.makedirs("log")

logger = logging.getLogger("student_management_system_logger")
logger.setLevel(logging.INFO)

# 创建文件处理器
file_handler = logging.FileHandler("log/student_management_system.log") # 将loggong创建的日志发送到指定的目的地
file_handler.setLevel(logging.INFO)

# 创建控制台处理器
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# 设置日志格式
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# 将处理器添加到日志记录器
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# DEBUG < INFO < WARNING < ERROR < CRITICAL  不同级别记录的就不一样，debug就可以包含所以的，而error就只能包含error 和critical级别的

import json
import base64
from datetime import datetime
from fastapi import Request, HTTPException, Response
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
import inspect
from functools import wraps  # 必须加这个！

import os
from dotenv import load_dotenv

load_dotenv()

AES_KEY = os.getenv('AES_KEY', '1234567890123456').encode('utf-8')  # 16位 AES128
AES_IV  = os.getenv('AES_IV', '1234567890123456').encode('utf-8')   # CBC固定16位
TOKEN_EXPIRE_SECONDS = int(os.getenv('TOKEN_EXPIRE_SECONDS', '3600'))  # Token 有效期（秒）
COOKIE_KEY = os.getenv('COOKIE_KEY', 'token')  # Cookie 中 Token 的键名

# ==================== AES 标准PKCS7加密 ====================
def aes_encrypt(text: str):
    padder = padding.PKCS7(128).padder()
    padded = padder.update(text.encode()) + padder.finalize()

    cipher = Cipher(algorithms.AES(AES_KEY), modes.CBC(AES_IV))
    encrypt = cipher.encryptor()
    res = encrypt.update(padded) + encrypt.finalize()
    return base64.b64encode(res).decode()

# ==================== AES 解密 ====================
def aes_decrypt(token: str):
    try:
        byte = base64.b64decode(token)
        cipher = Cipher(algorithms.AES(AES_KEY), modes.CBC(AES_IV))
        decrypt = cipher.decryptor()
        data = decrypt.update(byte) + decrypt.finalize()

        unpad = padding.PKCS7(128).unpadder()
        plain = unpad.update(data) + unpad.finalize()
        return json.loads(plain.decode())
    except:
        raise HTTPException(401, "Token无效或已过期")

# ==================== 生成登录Token ====================
def get_token(uid, role):
    expire = int(datetime.now().timestamp()) + TOKEN_EXPIRE_SECONDS
    payload = {"uid": uid, "exp": expire, "role": role}
    return aes_encrypt(json.dumps(payload))

# ==================== 权限认证装饰器 ====================
def auth(allow_role=[]):
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            token = request.cookies.get(COOKIE_KEY)
            if not token:
                raise HTTPException(401, "请先登录")

            info = aes_decrypt(token)
            now = int(datetime.now().timestamp())

            if now > info["exp"]:
                raise HTTPException(401, "登录已过期，请重新登录")

            # admin无视所有权限
            if info["role"] != "admin" and info["role"] not in allow_role:
                raise HTTPException(403, "无权访问该接口")

            return await func(request, *args, **kwargs)
        return wrapper
    return decorator

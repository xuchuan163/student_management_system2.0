from sqlalchemy.orm import Session
from models.sysuser import SysUser


def queryUserById(db: Session, username: str) -> SysUser:
    '''
    根据用户名查询用户信息
    :param db:  Session
    :param username: username
    :return: SysUser
    '''
    user = db.query(SysUser).filter(SysUser.username == username).first()
    return user

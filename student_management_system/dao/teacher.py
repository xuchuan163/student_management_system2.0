from datetime import datetime, date
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.teacher import TeacherInfo


def check_teachers(db: Session, page_num: int = 1, page_size: int = 10) -> list:
    """
    查询老师信息
    :param db: Session
    :param skip: int 页码
    :param limit: int 数量
    :return: list
    """
    teachers = db.query(TeacherInfo).filter(TeacherInfo.del_flag !='Y').order_by(TeacherInfo.update_time.desc()).limit(
        page_size).offset((page_num - 1) * page_size).all()
    return teachers


def search_teachers(db: Session, key: str, value):
    """
    按条件搜索老师信息
    :param db: Session
    :param key: 搜索字段（教师编号、教师姓名、任教科目）
    :param value: 搜索值
    :return: list
    """
    query = db.query(TeacherInfo).filter(TeacherInfo.del_flag != 'Y')
    
    if key == '教师编号':
        query = query.filter(TeacherInfo.teacher_id == value)
    elif key == '教师姓名':
        query = query.filter(TeacherInfo.name.like(f'%{value}%'))
    elif key == '任教科目':
        query = query.filter(TeacherInfo.subject == value)
    
    return query.all()


# 添加老师信息
def add_teacher(db: Session, data: dict):
    """
    添加老师信息
    :param db: Session
    :param data: dict
    :return: None
    """
    if data:
        teacher = TeacherInfo(
            name=data['name'],
            sex=data['sex'],
            birth=data['birth'],
            subject=data['subject'],
            create_time=datetime.now(),
            update_time=datetime.now(),
            del_flag='0'
        )
        db.add(teacher)
        db.commit()
        return True
    return False


# 修改老师信息
def up_teacher(db: Session, teacher_id: int, update_data: dict):
    teacher = db.query(TeacherInfo).filter(TeacherInfo.teacher_id == teacher_id, TeacherInfo.del_flag !='Y').first()
    if not teacher:
        raise HTTPException(status_code=500, detail=f"老师编号{teacher_id}不存在或已删除")
    if update_data:
        if 'name' in update_data:
            teacher.name = update_data['name']
        if 'sex' in update_data:
            teacher.sex = update_data['sex']
        if 'birth' in update_data:
            teacher.birth = update_data['birth']
        if 'subject' in update_data:
            teacher.subject = update_data['subject']
        teacher.update_time = datetime.now()
        db.commit()
        db.refresh(teacher)
    return teacher


# 删除老师信息
def del_teacher(db: Session, teacher_id: int):
    teacher = db.query(TeacherInfo).filter(TeacherInfo.teacher_id == teacher_id, TeacherInfo.del_flag !='Y').first()
    if not teacher:
        raise HTTPException(status_code=500, detail=f"老师编号{teacher_id}不存在或已删除")

    # 软删除：修改del_flag为'Y'，不物理删除
    teacher.del_flag = 'Y'
    teacher.update_time = datetime.now()
    db.commit()
    db.refresh(teacher)
    return {"detail": f"老师编号{teacher_id}软删除成功"}

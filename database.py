"""データベース接続設定モジュール"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator

# 環境変数からデータベースURLを取得
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/bento_db"
)

# SQLAlchemyエンジンの作成
engine = create_engine(DATABASE_URL)

# セッションローカルの作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ベースクラスの作成
Base = declarative_base()


def get_db() -> Generator:
    """
    データベースセッションを取得する依存性注入関数
    
    Yields:
        データベースセッション
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

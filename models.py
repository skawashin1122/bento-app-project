"""データベースモデル定義モジュール"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Menu(Base):
    """メニューテーブルモデル"""
    __tablename__ = "menus"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    price = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)

    # リレーション定義
    orders = relationship("Order", back_populates="menu")


class Order(Base):
    """注文テーブルモデル"""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_name = Column(String(255), nullable=False)
    menu_id = Column(Integer, ForeignKey("menus.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Integer, nullable=False)
    ordered_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    # リレーション定義
    menu = relationship("Menu", back_populates="orders")

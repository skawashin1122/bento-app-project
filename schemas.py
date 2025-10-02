"""Pydanticスキーマ定義モジュール"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


# メニュー関連スキーマ
class MenuBase(BaseModel):
    """メニューベーススキーマ"""
    name: str = Field(..., description="メニュー名")
    price: int = Field(..., gt=0, description="価格（円）")
    description: Optional[str] = Field(None, description="メニュー説明")


class MenuCreate(MenuBase):
    """メニュー作成スキーマ"""
    pass


class MenuResponse(MenuBase):
    """メニューレスポンススキーマ"""
    id: int = Field(..., description="メニューID")

    model_config = ConfigDict(from_attributes=True)


# 注文関連スキーマ
class OrderBase(BaseModel):
    """注文ベーススキーマ"""
    user_name: str = Field(..., description="注文者名")
    menu_id: int = Field(..., gt=0, description="メニューID")
    quantity: int = Field(..., gt=0, description="注文数量")


class OrderCreate(OrderBase):
    """注文作成スキーマ"""
    pass


class OrderResponse(BaseModel):
    """注文レスポンススキーマ"""
    id: int = Field(..., description="注文ID")
    user_name: str = Field(..., description="注文者名")
    menu_id: int = Field(..., description="メニューID")
    menu_name: str = Field(..., description="メニュー名")
    quantity: int = Field(..., description="注文数量")
    total_price: int = Field(..., description="合計金額（円）")
    ordered_at: datetime = Field(..., description="注文日時")

    model_config = ConfigDict(from_attributes=True)

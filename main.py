"""FastAPIメインアプリケーション"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import logging
import os

from database import engine, get_db, Base
from models import Menu, Order
from schemas import MenuResponse, OrderCreate, OrderResponse

# ロギング設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPIアプリケーションの初期化
app = FastAPI(
    title="弁当注文管理システム API",
    description="弁当の注文を管理するためのREST API",
    version="1.0.0",
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切なオリジンを指定してください
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静的ファイルのマウント
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    logger.info(f"静的ファイルディレクトリをマウントしました: {static_dir}")


@app.on_event("startup")
async def startup_event():
    """アプリケーション起動時の初期化処理"""
    logger.info("アプリケーション起動中...")
    
    # テーブルが存在しない場合は作成
    Base.metadata.create_all(bind=engine)
    logger.info("データベーステーブルを確認/作成しました")
    
    # 初期データの投入
    db = next(get_db())
    try:
        # 既存のメニューデータをチェック
        existing_menus = db.query(Menu).count()
        if existing_menus == 0:
            logger.info("初期メニューデータを投入します...")
            
            initial_menus = [
                Menu(name="から揚げ弁当", price=500, description="ジューシーなから揚げがたっぷり"),
                Menu(name="焼き肉弁当", price=700, description="特製タレの焼き肉が美味しい"),
                Menu(name="幕の内弁当", price=600, description="バラエティ豊かなおかずが楽しめる"),
            ]
            
            db.add_all(initial_menus)
            db.commit()
            logger.info("初期メニューデータの投入が完了しました")
        else:
            logger.info(f"既存のメニューデータが{existing_menus}件存在します")
    except Exception as e:
        logger.error(f"初期化エラー: {e}")
        db.rollback()
    finally:
        db.close()


@app.get("/", tags=["Health Check"])
async def root():
    """
    ルートエンドポイント - フロントエンドのindex.htmlを返す
    """
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    index_file = os.path.join(static_dir, "index.html")
    
    if os.path.exists(index_file):
        return FileResponse(index_file)
    else:
        return {
            "message": "弁当注文管理システム API",
            "status": "running",
            "docs": "/docs"
        }


@app.get("/health", tags=["Health Check"])
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {
        "message": "弁当注文管理システム API",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/api/menus", response_model=List[MenuResponse], tags=["メニュー"])
async def get_menus(db: Session = Depends(get_db)):
    """
    メニュー一覧を取得
    
    Returns:
        メニューのリスト
    """
    try:
        menus = db.query(Menu).all()
        return menus
    except Exception as e:
        logger.error(f"メニュー取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="メニューの取得に失敗しました"
        )


@app.post("/api/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED, tags=["注文"])
async def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    """
    新規注文を作成
    
    Args:
        order: 注文情報（ユーザー名、メニューID、数量）
        
    Returns:
        作成された注文情報
        
    Raises:
        HTTPException: メニューが存在しない、または注文作成に失敗した場合
    """
    try:
        # メニューの存在確認
        menu = db.query(Menu).filter(Menu.id == order.menu_id).first()
        if not menu:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"メニューID {order.menu_id} が見つかりません"
            )
        
        # 合計金額の計算
        total_price = menu.price * order.quantity
        
        # 注文の作成
        new_order = Order(
            user_name=order.user_name,
            menu_id=order.menu_id,
            quantity=order.quantity,
            total_price=total_price
        )
        
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        
        logger.info(f"注文作成: ID={new_order.id}, ユーザー={order.user_name}, メニュー={menu.name}")
        
        # レスポンス用のデータを作成
        return OrderResponse(
            id=new_order.id,
            user_name=new_order.user_name,
            menu_id=new_order.menu_id,
            menu_name=menu.name,
            quantity=new_order.quantity,
            total_price=new_order.total_price,
            ordered_at=new_order.ordered_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"注文作成エラー: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="注文の作成に失敗しました"
        )


@app.get("/api/orders", response_model=List[OrderResponse], tags=["注文"])
async def get_orders(db: Session = Depends(get_db)):
    """
    注文履歴を取得
    
    Returns:
        注文履歴のリスト（注文日時の降順）
    """
    try:
        orders = db.query(Order).order_by(Order.ordered_at.desc()).all()
        
        # レスポンス用のデータを作成
        order_responses = []
        for order in orders:
            menu = db.query(Menu).filter(Menu.id == order.menu_id).first()
            order_responses.append(
                OrderResponse(
                    id=order.id,
                    user_name=order.user_name,
                    menu_id=order.menu_id,
                    menu_name=menu.name if menu else "不明",
                    quantity=order.quantity,
                    total_price=order.total_price,
                    ordered_at=order.ordered_at
                )
            )
        
        return order_responses
        
    except Exception as e:
        logger.error(f"注文履歴取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="注文履歴の取得に失敗しました"
        )

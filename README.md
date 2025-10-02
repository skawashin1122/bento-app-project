# 弁当注文管理システム

Docker環境で動作する弁当の注文管理システムです。FastAPIとPostgreSQLを使用したREST APIで、メニューの閲覧と注文の作成・履歴確認ができます。

## 技術スタック

- **バックエンド**: FastAPI (Python 3.11+)
- **データベース**: PostgreSQL 15
- **コンテナ管理**: Docker Compose
- **ORM**: SQLAlchemy
- **バリデーション**: Pydantic

## 機能一覧

### 1. メニュー管理機能
- 弁当メニューの一覧表示
- メニュー情報: ID、名前、価格、説明

### 2. 注文機能
- 新規注文の作成
- 必須入力項目: ユーザー名、メニューID、数量
- 注文日時の自動記録
- バリデーション機能（数量は1以上、メニューIDの存在確認）

### 3. 注文履歴機能
- 全注文履歴の表示
- 注文情報: 注文ID、ユーザー名、メニュー名、数量、合計金額、注文日時

## プロジェクト構成

```
test-app/
├── docker-compose.yml      # Docker Compose設定ファイル
├── Dockerfile              # FastAPIコンテナの定義
├── requirements.txt        # Python依存パッケージ
├── main.py                 # FastAPIエントリーポイント
├── models.py               # SQLAlchemyモデル定義
├── schemas.py              # Pydanticスキーマ定義
├── database.py             # データベース接続設定
├── static/                 # フロントエンド静的ファイル
│   ├── index.html          # メインHTML
│   ├── styles.css          # スタイルシート
│   └── app.js              # JavaScriptロジック
└── README.md               # このファイル
```

## セットアップ手順

### 前提条件
- Docker Desktop がインストールされていること
- Git がインストールされていること（リポジトリをクローンする場合）

### 起動方法

1. **リポジトリのクローン**（または既存ディレクトリに移動）
```powershell
cd c:\Users\mk941574\Desktop\test-app
```

2. **Docker環境の起動**
```powershell
docker-compose up --build
```

このコマンド一発で以下が自動的に実行されます:
- PostgreSQLコンテナの起動
- データベースの作成
- テーブルの作成
- 初期メニューデータの投入
- FastAPIアプリケーションの起動

3. **アクセス確認**
- **フロントエンド（Web UI）**: http://localhost:8000
- **API ドキュメント（Swagger UI）**: http://localhost:8000/docs
- **API ドキュメント（ReDoc）**: http://localhost:8000/redoc
- **ヘルスチェック**: http://localhost:8000/health

### 停止方法

```powershell
docker-compose down
```

データを削除して完全にクリーンアップする場合:
```powershell
docker-compose down -v
```

## フロントエンド機能

### Web UI（http://localhost:8000）

システムにアクセスすると、以下の機能を備えた直感的なWeb UIが表示されます:

#### 1. メニュー一覧表示
- 本日の弁当メニューをカード形式で表示
- 各メニューには名前、価格、説明、IDが表示されます
- レスポンシブデザインでスマートフォンにも対応

#### 2. 注文フォーム
- **お名前**: 注文者の名前を入力
- **メニュー選択**: ドロップダウンからメニューを選択
- **数量**: 注文する数量を指定（1以上）
- **合計金額**: 自動計算されて表示
- 入力バリデーション付き
- 注文完了後はモーダルで結果を表示

#### 3. 注文履歴
- 「履歴を表示」ボタンで過去の注文を一覧表示
- 注文ID、注文者、メニュー名、数量、合計金額、注文日時を表示
- テーブル形式で見やすく整理

### デザイン特徴
- 落ち着いた白ベースの配色
- ブルー系のアクセントカラー
- スマートフォン・タブレット対応のレスポンシブデザイン
- ホバーエフェクトとアニメーション
- 見やすいフォントとスペーシング

## API エンドポイント一覧

### ヘルスチェック
- **GET /** - フロントエンドのindex.htmlを返す
- **GET /health** - APIのヘルスチェック

### メニュー関連
- **GET /api/menus** - メニュー一覧を取得

### 注文関連
- **POST /api/orders** - 新規注文を作成
- **GET /api/orders** - 注文履歴を取得

## 使用例

### 1. メニュー一覧の取得

**リクエスト:**
```powershell
curl http://localhost:8000/api/menus
```

**レスポンス例:**
```json
[
  {
    "id": 1,
    "name": "から揚げ弁当",
    "price": 500,
    "description": "ジューシーなから揚げがたっぷり"
  },
  {
    "id": 2,
    "name": "焼き肉弁当",
    "price": 700,
    "description": "特製タレの焼き肉が美味しい"
  },
  {
    "id": 3,
    "name": "幕の内弁当",
    "price": 600,
    "description": "バラエティ豊かなおかずが楽しめる"
  }
]
```

### 2. 新規注文の作成

**リクエスト:**
```powershell
curl -X POST http://localhost:8000/api/orders `
  -H "Content-Type: application/json" `
  -d '{\"user_name\": \"田中太郎\", \"menu_id\": 1, \"quantity\": 2}'
```

**レスポンス例:**
```json
{
  "id": 1,
  "user_name": "田中太郎",
  "menu_id": 1,
  "menu_name": "から揚げ弁当",
  "quantity": 2,
  "total_price": 1000,
  "ordered_at": "2025-10-02T10:30:00"
}
```

### 3. 注文履歴の取得

**リクエスト:**
```powershell
curl http://localhost:8000/api/orders
```

**レスポンス例:**
```json
[
  {
    "id": 2,
    "user_name": "佐藤花子",
    "menu_id": 2,
    "menu_name": "焼き肉弁当",
    "quantity": 1,
    "total_price": 700,
    "ordered_at": "2025-10-02T12:00:00"
  },
  {
    "id": 1,
    "user_name": "田中太郎",
    "menu_id": 1,
    "menu_name": "から揚げ弁当",
    "quantity": 2,
    "total_price": 1000,
    "ordered_at": "2025-10-02T10:30:00"
  }
]
```

## データベース設計

### menusテーブル
| カラム名 | 型 | 制約 | 説明 |
|---------|-----|-----|-----|
| id | INTEGER | PRIMARY KEY, SERIAL | メニューID |
| name | VARCHAR(255) | NOT NULL | メニュー名 |
| price | INTEGER | NOT NULL | 価格（円） |
| description | TEXT | - | メニュー説明 |

### ordersテーブル
| カラム名 | 型 | 制約 | 説明 |
|---------|-----|-----|-----|
| id | INTEGER | PRIMARY KEY, SERIAL | 注文ID |
| user_name | VARCHAR(255) | NOT NULL | 注文者名 |
| menu_id | INTEGER | FOREIGN KEY (menus.id) | メニューID |
| quantity | INTEGER | NOT NULL | 注文数量 |
| total_price | INTEGER | NOT NULL | 合計金額（円） |
| ordered_at | TIMESTAMP | DEFAULT NOW() | 注文日時 |

## 初期データ

アプリケーション起動時に以下のメニューが自動的に登録されます:

1. から揚げ弁当 - 500円
2. 焼き肉弁当 - 700円
3. 幕の内弁当 - 600円

## トラブルシューティング

### ポートが既に使用されている場合
既に8000番ポートが使用されている場合は、`docker-compose.yml`の以下の部分を変更してください:
```yaml
ports:
  - "8001:8000"  # ホスト側のポートを8001に変更
```

### データベース接続エラーが発生する場合
コンテナの起動順序の問題の可能性があります。以下のコマンドで再起動してください:
```powershell
docker-compose down
docker-compose up --build
```

### データをリセットしたい場合
以下のコマンドでボリュームを削除してから再起動してください:
```powershell
docker-compose down -v
docker-compose up --build
```

## 開発者向け情報

### ログの確認
```powershell
# アプリケーションログ
docker-compose logs app

# データベースログ
docker-compose logs db

# リアルタイムでログを確認
docker-compose logs -f
```

### データベースに直接接続
```powershell
docker exec -it bento_db psql -U postgres -d bento_db
```

### コードの自動リロード
`docker-compose.yml`で`--reload`オプションを有効にしているため、Pythonコードを変更すると自動的にアプリケーションが再起動されます。

## ライセンス

このプロジェクトはサンプルアプリケーションです。

## 作成日

2025年10月2日

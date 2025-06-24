---
title: "チュートリアル3: データ操作をマスターしよう"
version: "1.1"
last_updated: "2025-06-24"
author: "mcp starter"
reviewers: []
related_docs: ["02-hello-world.md", "04-practical-usage.md"]
status: "approved"
dependencies:
  upstream: ["02-hello-world.md"]
  downstream: ["04-practical-usage.md"]
impact_level: "medium"
---

# チュートリアル3: データ操作をマスターしよう 📊

**所要時間: 25分**  
**前提知識: [チュートリアル2](02-hello-world.md)完了**

## 🎯 今回の目標

- SQLiteデータベースを操作するツールを作成
- FastMCPでのデータ永続化を学習
- 実用的なCRUD操作を実装

## 📚 SQLiteとは？

SQLiteは軽量なデータベースで、ファイル1つでデータを管理できます。
FastMCPスターターキットではメインのデータストレージとして使用します。

### 特徴
- ✅ セットアップ不要（Python標準ライブラリ）
- ✅ 軽量・高速
- ✅ 単一ファイルで管理
- ✅ SQL標準対応

## 🏗️ ステップ1: データベース設計

### テーブル設計
今回は「タスク管理」アプリを作ります。

```sql
-- tasks テーブル
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- categories テーブル
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#007bff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- task_categories テーブル（多対多関係）
CREATE TABLE task_categories (
    task_id INTEGER,
    category_id INTEGER,
    PRIMARY KEY (task_id, category_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

## 📝 ステップ2: 設定ファイルとデータベース初期化

### ファイル作成: `config.toml`
```toml
[server]
name = "Task Manager"
version = "1.0.0"
description = "SQLiteを使用したタスク管理MCPサーバー"
author = "あなたの名前"

[transport]
default = "stdio"
http_port = 8000
http_host = "127.0.0.1"

[database]
path = "tasks.db"
backup_enabled = true
auto_migrate = true

[features]
enable_logging = true
log_level = "INFO"
enable_metrics = false
```

### ファイル作成: `database.py`
```python
"""
データベース管理モジュール
SQLiteを使用したタスク管理システム
"""
import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path

class TaskDatabase:
    def __init__(self, db_path: str = "tasks.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """データベースとテーブルを初期化"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # 外部キー制約を有効化
            cursor.execute("PRAGMA foreign_keys = ON")
            
            # tasksテーブル作成
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'pending',
                    priority INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # categoriesテーブル作成
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    color TEXT DEFAULT '#007bff',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # task_categoriesテーブル作成
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS task_categories (
                    task_id INTEGER,
                    category_id INTEGER,
                    PRIMARY KEY (task_id, category_id),
                    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
                )
            """)
            
            conn.commit()
    
    def get_connection(self):
        """データベース接続を取得"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # 辞書形式でアクセス可能
        conn.execute("PRAGMA foreign_keys = ON")  # 外部キー制約を有効化
        return conn

# グローバルデータベースインスタンス
db = TaskDatabase()
```

## 🔧 ステップ3: タスク管理ツール作成

### ファイル作成: `task_manager.py`
```python
"""
FastMCPを使用したタスク管理MCPサーバー
"""
import tomllib
from pathlib import Path
from fastmcp import FastMCP
import sqlite3
from typing import List, Dict, Optional
import json
import shutil
from datetime import datetime

# 設定読み込み
config_path = Path("config.toml")
if config_path.exists():
    with open(config_path, "rb") as f:
        config = tomllib.load(f)
else:
    config = {}

# データベース管理クラス
class TaskDatabase:
    def __init__(self, db_path: str = None):
        if db_path is None:
            db_path = config.get("database", {}).get("path", "tasks.db")
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """データベースとテーブルを初期化"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # 外部キー制約を有効化
            cursor.execute("PRAGMA foreign_keys = ON")
            
            # tasksテーブル作成
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'pending',
                    priority INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # categoriesテーブル作成
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    color TEXT DEFAULT '#007bff',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # task_categoriesテーブル作成
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS task_categories (
                    task_id INTEGER,
                    category_id INTEGER,
                    PRIMARY KEY (task_id, category_id),
                    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
                )
            """)
            
            conn.commit()
    
    def get_connection(self):
        """データベース接続を取得"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # 辞書形式でアクセス可能
        conn.execute("PRAGMA foreign_keys = ON")  # 外部キー制約を有効化
        return conn

# グローバルデータベースインスタンス
db = TaskDatabase()

# 設定を使用してサーバー作成
mcp = FastMCP(
    name=config.get("server", {}).get("name", "Task Manager")
)

@mcp.tool
def create_task(title: str, description: str = "", priority: int = 1) -> dict:
    """新しいタスクを作成する
    
    Args:
        title: タスクのタイトル
        description: タスクの詳細説明
        priority: 優先度（1-5、5が最高）
        
    Returns:
        作成されたタスクの情報
    """
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO tasks (title, description, priority)
                VALUES (?, ?, ?)
            """, (title, description, priority))
            
            task_id = cursor.lastrowid
            
            # 作成されたタスクを取得
            cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
            task = dict(cursor.fetchone())
            
            return {
                "success": True,
                "task": task,
                "message": f"タスク '{title}' を作成しました"
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "タスクの作成に失敗しました"
        }

@mcp.tool
def get_tasks(status: str = "all", limit: int = 10) -> dict:
    """タスク一覧を取得する
    
    Args:
        status: フィルタするステータス（all, pending, completed, cancelled）
        limit: 取得する最大件数
        
    Returns:
        タスク一覧
    """
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            if status == "all":
                cursor.execute("""
                    SELECT * FROM tasks 
                    ORDER BY priority DESC, created_at DESC 
                    LIMIT ?
                """, (limit,))
            else:
                cursor.execute("""
                    SELECT * FROM tasks 
                    WHERE status = ? 
                    ORDER BY priority DESC, created_at DESC 
                    LIMIT ?
                """, (status, limit))
            
            tasks = [dict(row) for row in cursor.fetchall()]
            
            return {
                "success": True,
                "tasks": tasks,
                "count": len(tasks),
                "filter": status
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "tasks": []
        }

@mcp.tool
def update_task_status(task_id: int, status: str) -> dict:
    """タスクのステータスを更新する
    
    Args:
        task_id: タスクID
        status: 新しいステータス（pending, completed, cancelled）
        
    Returns:
        更新結果
    """
    valid_statuses = ["pending", "completed", "cancelled"]
    
    if status not in valid_statuses:
        return {
            "success": False,
            "error": f"無効なステータス: {status}",
            "valid_statuses": valid_statuses
        }
    
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            # タスクの存在確認
            cursor.execute("SELECT title FROM tasks WHERE id = ?", (task_id,))
            task = cursor.fetchone()
            
            if not task:
                return {
                    "success": False,
                    "error": f"ID {task_id} のタスクが見つかりません"
                }
            
            # ステータス更新
            cursor.execute("""
                UPDATE tasks 
                SET status = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            """, (status, task_id))
            
            return {
                "success": True,
                "message": f"タスク '{task['title']}' のステータスを '{status}' に更新しました",
                "task_id": task_id,
                "new_status": status
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool
def delete_task(task_id: int) -> dict:
    """タスクを削除する
    
    Args:
        task_id: 削除するタスクのID
        
    Returns:
        削除結果
    """
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            # タスクの存在確認
            cursor.execute("SELECT title FROM tasks WHERE id = ?", (task_id,))
            task = cursor.fetchone()
            
            if not task:
                return {
                    "success": False,
                    "error": f"ID {task_id} のタスクが見つかりません"
                }
            
            # 関連カテゴリも自動削除（ON DELETE CASCADE）
            cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
            
            return {
                "success": True,
                "message": f"タスク '{task['title']}' を削除しました",
                "deleted_task_id": task_id
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool
def search_tasks(keyword: str) -> dict:
    """タスクを検索する
    
    Args:
        keyword: 検索キーワード（タイトルまたは説明に含まれる）
        
    Returns:
        検索結果
    """
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            search_pattern = f"%{keyword}%"
            cursor.execute("""
                SELECT * FROM tasks 
                WHERE title LIKE ? OR description LIKE ?
                ORDER BY priority DESC, created_at DESC
            """, (search_pattern, search_pattern))
            
            tasks = [dict(row) for row in cursor.fetchall()]
            
            return {
                "success": True,
                "tasks": tasks,
                "count": len(tasks),
                "keyword": keyword
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "tasks": []
        }

@mcp.tool
def get_task_statistics() -> dict:
    """タスクの統計情報を取得する
    
    Returns:
        統計情報
    """
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            # 全体統計
            cursor.execute("SELECT COUNT(*) as total FROM tasks")
            total = cursor.fetchone()["total"]
            
            # ステータス別統計
            cursor.execute("""
                SELECT status, COUNT(*) as count 
                FROM tasks 
                GROUP BY status
            """)
            status_stats = {row["status"]: row["count"] for row in cursor.fetchall()}
            
            # 優先度別統計
            cursor.execute("""
                SELECT priority, COUNT(*) as count 
                FROM tasks 
                GROUP BY priority 
                ORDER BY priority DESC
            """)
            priority_stats = {f"priority_{row['priority']}": row["count"] for row in cursor.fetchall()}
            
            return {
                "success": True,
                "statistics": {
                    "total_tasks": total,
                    "by_status": status_stats,
                    "by_priority": priority_stats
                }
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool
def create_category(name: str, color: str = "#007bff") -> dict:
    """新しいカテゴリを作成する
    
    Args:
        name: カテゴリ名
        color: カテゴリの色（HEX形式）
        
    Returns:
        作成されたカテゴリの情報
    """
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO categories (name, color)
                VALUES (?, ?)
            """, (name, color))
            
            category_id = cursor.lastrowid
            cursor.execute("SELECT * FROM categories WHERE id = ?", (category_id,))
            category = dict(cursor.fetchone())
            
            return {
                "success": True,
                "category": category,
                "message": f"カテゴリ '{name}' を作成しました"
            }
    
    except sqlite3.IntegrityError:
        return {
            "success": False,
            "error": f"カテゴリ '{name}' は既に存在します"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool
def assign_category_to_task(task_id: int, category_id: int) -> dict:
    """タスクにカテゴリを割り当てる
    
    Args:
        task_id: タスクID
        category_id: カテゴリID
        
    Returns:
        割り当て結果
    """
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            # タスクとカテゴリの存在確認
            cursor.execute("SELECT title FROM tasks WHERE id = ?", (task_id,))
            task = cursor.fetchone()
            cursor.execute("SELECT name FROM categories WHERE id = ?", (category_id,))
            category = cursor.fetchone()
            
            if not task:
                return {"success": False, "error": f"タスクID {task_id} が見つかりません"}
            if not category:
                return {"success": False, "error": f"カテゴリID {category_id} が見つかりません"}
            
            # カテゴリ割り当て
            cursor.execute("""
                INSERT OR IGNORE INTO task_categories (task_id, category_id)
                VALUES (?, ?)
            """, (task_id, category_id))
            
            return {
                "success": True,
                "message": f"タスク '{task['title']}' にカテゴリ '{category['name']}' を割り当てました"
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool
def backup_database(backup_path: str = None) -> dict:
    """データベースをバックアップする
    
    Args:
        backup_path: バックアップファイルのパス
        
    Returns:
        バックアップ結果
    """
    try:
        if backup_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"backup_tasks_{timestamp}.db"
        
        shutil.copy2(db.db_path, backup_path)
        
        return {
            "success": True,
            "message": f"データベースを {backup_path} にバックアップしました",
            "backup_path": backup_path
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool
def export_tasks_to_json(file_path: str = "tasks_export.json") -> dict:
    """タスクをJSONファイルにエクスポートする
    
    Args:
        file_path: エクスポートファイルのパス
        
    Returns:
        エクスポート結果
    """
    try:
        tasks_result = get_tasks(limit=1000)
        
        if not tasks_result["success"]:
            return tasks_result
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(tasks_result["tasks"], f, ensure_ascii=False, indent=2)
        
        return {
            "success": True,
            "message": f"タスクを {file_path} にエクスポートしました",
            "exported_count": len(tasks_result["tasks"]),
            "file_path": file_path
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@mcp.tool
def get_categories() -> dict:
    """カテゴリ一覧を取得する
    
    Returns:
        カテゴリ一覧
    """
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM categories ORDER BY name")
            categories = [dict(row) for row in cursor.fetchall()]
            
            return {
                "success": True,
                "categories": categories,
                "count": len(categories)
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "categories": []
        }

@mcp.tool
def get_server_info() -> dict:
    """サーバーの情報を取得する
    
    Returns:
        サーバー情報の辞書
    """
    server_config = config.get("server", {})
    db_config = config.get("database", {})
    
    return {
        "server_name": server_config.get("name", "Task Manager"),
        "version": server_config.get("version", "1.0.0"),
        "description": server_config.get("description", "SQLiteを使用したタスク管理MCPサーバー"),
        "author": server_config.get("author", "あなたの名前"),
        "database_path": db.db_path,
        "tools_count": 12  # 現在のツール数
    }

if __name__ == "__main__":
    # 設定からデフォルトトランスポートを取得
    transport_config = config.get("transport", {})
    default_transport = transport_config.get("default", "stdio")
    
    # サーバーを起動
    if default_transport == "stdio":
        mcp.run()
    elif default_transport == "http":
        mcp.run(
            transport="streamable-http",
            host=transport_config.get("http_host", "127.0.0.1"),
            port=transport_config.get("http_port", 8000)
        )
    else:
        mcp.run()
```

## 🚀 ステップ4: サーバー起動とテスト

### 起動
```bash
# 設定ファイルに基づいてサーバー起動
python task_manager.py

# または明示的にトランスポート指定
fastmcp run task_manager.py --transport streamable-http --port 8000
```

### 基本操作テスト

#### 推奨方法: FastMCP CLIを使用
```bash
# 開発環境での簡単テスト
fastmcp dev task_manager.py

# またはSSEモードでWeb UIを使用
fastmcp run task_manager.py --transport sse --port 8000
# ブラウザで http://localhost:8000 にアクセス
```

#### HTTPモードでのテスト例

**1. サーバー起動**
```bash
python task_manager.py
# config.tomlでdefault = "http"に設定している場合
```

**2. HTTPクライアントでテスト**
```python
import asyncio
from fastmcp import Client

async def test_task_manager():
    client = Client("http://127.0.0.1:8000/mcp")
    
    async with client:
        # サーバー情報取得
        info = await client.call_tool("get_server_info")
        print(f"サーバー情報: {info[0].text}")
        
        # タスク作成
        result = await client.call_tool("create_task", {
            "title": "FastMCPを学習する",
            "description": "チュートリアル3を完了する",
            "priority": 5
        })
        print(f"タスク作成: {result[0].text}")

if __name__ == "__main__":
    asyncio.run(test_task_manager())
```

> **重要**: 手動のJSONRPCテストはMCPプロトコルの初期化が必要で複雑です。**FastMCP CLIまたはHTTPモードの使用を強く推奨します。**

## 📊 ステップ5: プロジェクト構造と完成形

### 推奨プロジェクト構造

```
task-manager/
├── task_manager.py      # メインサーバー
├── config.toml          # 設定ファイル
├── tasks.db            # SQLiteデータベース（自動生成）
├── test_client.py      # テスト用クライアント
└── README.md           # プロジェクト説明
```

### テスト用クライアント作成: `test_client.py`
```python
"""
タスク管理サーバーをテストするクライアント
"""
import asyncio
from fastmcp import Client

async def test_task_manager():
    # STDIOモードでテスト
    client = Client("task_manager.py")
    
    async with client:
        print("🔗 タスク管理サーバーに接続しました")
        
        # サーバー情報取得
        info = await client.call_tool("get_server_info")
        print(f"ℹ️  サーバー情報: {info[0].text}")
        
        # カテゴリ作成
        cat_result = await client.call_tool("create_category", {
            "name": "学習", 
            "color": "#28a745"
        })
        print(f"📂 カテゴリ作成: {cat_result[0].text}")
        
        # タスク作成
        task_result = await client.call_tool("create_task", {
            "title": "FastMCPマスター",
            "description": "データ操作チュートリアルを完了する",
            "priority": 5
        })
        print(f"✅ タスク作成: {task_result[0].text}")
        
        # タスク一覧取得
        tasks = await client.call_tool("get_tasks")
        print(f"📋 タスク一覧: {tasks[0].text}")
        
        # 統計情報取得
        stats = await client.call_tool("get_task_statistics")
        print(f"📊 統計情報: {stats[0].text}")

if __name__ == "__main__":
    asyncio.run(test_task_manager())
```

## ✅ チェックポイント

以下を確認してください：

- [ ] `config.toml`ファイルが作成される
- [ ] データベースファイル（tasks.db）が作成される
- [ ] タスクの作成・取得・更新・削除ができる
- [ ] カテゴリ機能が動作する
- [ ] 検索機能が動作する
- [ ] 統計情報が取得できる
- [ ] バックアップ・エクスポート機能が動作する

## 🔧 トラブルシューティング

### よくあるエラー

**1. 設定ファイルが読み込めない**
```python
# Python 3.11未満の場合
try:
    import tomllib
except ImportError:
    import tomli as tomllib
```

**2. データベースが作成されない**
```python
# 権限を確認
import os
print(f"現在のディレクトリ: {os.getcwd()}")
print(f"書き込み権限: {os.access('.', os.W_OK)}")
```

**3. 外部キー制約エラー**
```python
# 明示的に外部キー制約を有効化
conn.execute("PRAGMA foreign_keys = ON")
```

## 🎉 学習成果

このチュートリアルで学んだこと：

- ✅ 設定ファイル（TOML）の活用
- ✅ SQLiteの実用的な操作
- ✅ FastMCPでのデータ永続化
- ✅ エラーハンドリングとログ出力
- ✅ 実用的なCRUD操作の実装
- ✅ データのバックアップ・エクスポート
- ✅ 外部キー制約とデータ整合性

## 🔄 次のステップ

データ操作をマスターしたら、次は実用的なアプリケーションを作ってみましょう！

**[→ チュートリアル4: 実践応用](04-practical-usage.md)**

---

💡 **ヒント**: 作成したタスク管理システムは実際の業務でも活用できます！設定ファイルを使用することで、環境に応じた柔軟な運用が可能になります。

## 更新履歴

| バージョン | 更新日 | 更新者 | 更新内容 | 影響ドキュメント |
|---|-----|-----|----|---|
| 1.0        | 2025-06-23 | mcp starter | 初版作成 | - |
| 1.1        | 2025-06-24 | mcp starter | hello_world.pyの見直し内容を反映、設定ファイル導入、変数名統一、外部キー制約追加 | tutorial03_task_manager.py | 
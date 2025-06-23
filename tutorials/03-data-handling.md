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

## 📝 ステップ2: データベース初期化

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
                    FOREIGN KEY (task_id) REFERENCES tasks(id),
                    FOREIGN KEY (category_id) REFERENCES categories(id)
                )
            """)
            
            conn.commit()
    
    def get_connection(self):
        """データベース接続を取得"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # 辞書形式でアクセス可能
        return conn
    
    def dict_factory(self, cursor, row):
        """SQLiteの結果を辞書形式に変換"""
        return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}

# グローバルデータベースインスタンス
db = TaskDatabase()
```

## 🔧 ステップ3: タスク管理ツール作成

### ファイル作成: `task_manager.py`
```python
"""
FastMCPを使用したタスク管理MCPサーバー
"""
from fastmcp import FastMCP
from database import db
from typing import List, Dict, Optional
import json

app = FastMCP("Task Manager")

@app.tool()
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

@app.tool()
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

@app.tool()
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

@app.tool()
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
            
            # タスク削除
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

@app.tool()
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

@app.tool()
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

if __name__ == "__main__":
    app.run()
```

## 🚀 ステップ4: サーバー起動とテスト

### 起動
```bash
python task_manager.py
```

### 基本操作テスト

**1. タスク作成**
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "create_task", "arguments": {"title": "FastMCPを学習する", "description": "チュートリアルを全て完了する", "priority": 5}}}' | python task_manager.py
```

**2. タスク一覧取得**
```bash
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "get_tasks", "arguments": {}}}' | python task_manager.py
```

**3. ステータス更新**
```bash
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "update_task_status", "arguments": {"task_id": 1, "status": "completed"}}}' | python task_manager.py
```

## 📊 ステップ5: カテゴリ機能を追加

既存のファイルに追加：

```python
@app.tool()
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

@app.tool()
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
```

## 🎯 ステップ6: 実用的な機能追加

### データバックアップ機能
```python
@app.tool()
def backup_database(backup_path: str = None) -> dict:
    """データベースをバックアップする
    
    Args:
        backup_path: バックアップファイルのパス
        
    Returns:
        バックアップ結果
    """
    try:
        from datetime import datetime
        import shutil
        
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

@app.tool()
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
```

## ✅ チェックポイント

以下を確認してください：

- [ ] データベースファイル（tasks.db）が作成される
- [ ] タスクの作成・取得・更新・削除ができる
- [ ] 検索機能が動作する
- [ ] 統計情報が取得できる
- [ ] カテゴリ機能が動作する

## 📁 完成したプロジェクト構造

```
task-manager/
├── task_manager.py    # メインサーバー
├── database.py        # データベース管理
├── tasks.db          # SQLiteデータベース
├── config.toml       # 設定ファイル
└── README.md         # プロジェクト説明
```

## 🔧 トラブルシューティング

### よくあるエラー

**1. データベースが作成されない**
```python
# 権限を確認
import os
print(os.getcwd())  # 現在のディレクトリ
print(os.access(".", os.W_OK))  # 書き込み権限
```

**2. 外部キー制約エラー**
```python
# 外部キー制約を有効化
with sqlite3.connect(db_path) as conn:
    conn.execute("PRAGMA foreign_keys = ON")
```

## 🎉 学習成果

このチュートリアルで学んだこと：

- ✅ SQLiteの基本操作
- ✅ FastMCPでのデータ永続化
- ✅ CRUD操作の実装
- ✅ エラーハンドリング
- ✅ データのバックアップ・エクスポート

## 🔄 次のステップ

データ操作をマスターしたら、次は実用的なアプリケーションを作ってみましょう！

**[→ チュートリアル4: 実践応用](04-practical-usage.md)**

---

💡 **ヒント**: 作成したタスク管理システムは実際の業務でも活用できます！ 
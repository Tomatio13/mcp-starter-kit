# チュートリアル5: デプロイ 🚀

**所要時間: 20分**  
**前提知識: [チュートリアル4](04-practical-usage.md)完了**

## 🎯 今回の目標

- Claude Desktop、VS Code、Cursorへの統合
- 本格的な運用環境の構築
- 継続的なメンテナンス方法を学習

## 🎮 Claude Desktopへの統合

### ステップ1: Claude Desktop設定

**1. 設定ファイルの場所を確認**

| OS | 設定ファイルの場所 |
|----|--------------------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

**2. 設定ファイルを編集**

```json
{
  "mcpServers": {
    "fastmcp-starter": {
      "command": "python",
      "args": ["/path/to/your/project/main.py"],
      "env": {
        "PYTHONPATH": "/path/to/your/project"
      }
    },
    "task-manager": {
      "command": "python",
      "args": ["/path/to/task-manager/task_manager.py"],
      "env": {}
    },
    "smart-analyzer": {
      "command": "python",
      "args": ["/path/to/smart-analyzer/main.py"],
      "env": {
        "DATA_DIR": "/path/to/smart-analyzer/data"
      }
    }
  }
}
```

**3. Claude Desktopを再起動**

設定後、Claude Desktopを再起動すると、新しいツールが利用可能になります。

### ステップ2: 動作確認

Claude Desktopで以下のように質問してみてください：

```
利用可能なツールを教えて
```

```
新しいタスクを作成してください：「FastMCPチュートリアルを完了する」
```

```
https://example.com を分析してください
```

## 💻 VS Codeへの統合

### ステップ1: MCP拡張機能のインストール

1. **拡張機能マーケットプレイスを開く**
   - `Ctrl+Shift+X` (Windows/Linux) または `Cmd+Shift+X` (macOS)

2. **"MCP" で検索**
   - `Model Context Protocol` 拡張機能をインストール

3. **設定を開く**
   - `Ctrl+,` (Windows/Linux) または `Cmd+,` (macOS)

### ステップ2: MCP設定

**1. settings.json を編集**

```json
{
  "mcp.servers": {
    "fastmcp-starter": {
      "command": "python",
      "args": ["/path/to/your/project/main.py"],
      "cwd": "/path/to/your/project",
      "env": {}
    }
  },
  "mcp.autoStart": true,
  "mcp.logLevel": "info"
}
```

**2. ワークスペース設定（.vscode/settings.json）**

```json
{
  "mcp.servers": {
    "project-tools": {
      "command": "python",
      "args": ["${workspaceFolder}/main.py"],
      "cwd": "${workspaceFolder}",
      "env": {
        "PYTHONPATH": "${workspaceFolder}"
      }
    }
  }
}
```

### ステップ3: 使用方法

1. **コマンドパレット** (`Ctrl+Shift+P`)
2. **"MCP: Start Server"** を実行
3. **"MCP: List Tools"** でツール一覧確認
4. **"MCP: Call Tool"** でツール実行

## 📝 Cursorへの統合

### ステップ1: Cursor設定

**1. 設定メニューを開く**
- `Cmd/Ctrl + ,` で設定を開く

**2. MCP Servers設定**
```json
{
  "mcp": {
    "servers": {
      "fastmcp-starter": {
        "command": "python",
        "args": ["/absolute/path/to/main.py"],
        "env": {}
      }
    }
  }
}
```

### ステップ2: 統合テスト

**1. Cursorでプロジェクトを開く**
**2. チャットで以下を試す：**

```
@fastmcp-starter タスクを作成して
```

```
@fastmcp-starter 利用可能なツールを表示して
```

## 🔧 本格運用環境の構築

### 仮想環境の整備

**1. プロダクション用仮想環境**
```bash
# プロダクション環境作成
python -m venv venv-prod
source venv-prod/bin/activate  # Windows: venv-prod\Scripts\activate

# 依存関係インストール
pip install fastmcp requests beautifulsoup4 textblob

# 要件ファイル作成
pip freeze > requirements.txt
```

**2. requirements.txt の最適化**
```txt
fastmcp>=0.1.0
requests>=2.31.0
beautifulsoup4>=4.12.0
textblob>=0.17.1
sqlite3  # Python標準ライブラリ
```

### 設定ファイルの管理

**1. 環境別設定**
```bash
config/
├── development.toml    # 開発環境
├── staging.toml       # ステージング環境
└── production.toml    # 本番環境
```

**2. production.toml**
```toml
[server]
name = "FastMCP Production Server"
version = "1.0.0"
log_level = "WARNING"
debug = false

[database]
path = "/var/lib/fastmcp/production.db"
backup_enabled = true
backup_interval = 3600

[security]
enable_rate_limiting = true
max_requests_per_minute = 100
allowed_origins = ["https://yourdomain.com"]

[monitoring]
enable_metrics = true
health_check_interval = 60
```

### ログ設定

**logging_config.py**
```python
import logging
import logging.handlers
from pathlib import Path

def setup_logging(log_level="INFO", log_file=None):
    """本格的なログ設定"""
    
    # ログディレクトリ作成
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # フォーマッター
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # ルートロガー
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, log_level.upper()))
    
    # コンソールハンドラー
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # ファイルハンドラー（ローテーション）
    if log_file:
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger
```

## 📊 監視とメンテナンス

### ヘルスチェック機能

**health_monitor.py**
```python
from fastmcp import FastMCP
import psutil
import sqlite3
from datetime import datetime

app = FastMCP("Health Monitor")

@app.tool
def health_check() -> dict:
    """システムヘルスチェック"""
    try:
        # システムリソース
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # データベース接続チェック
        db_status = check_database_connection()
        
        # サービス稼働時間
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        uptime = datetime.now() - boot_time
        
        health_data = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": disk.percent,
                "uptime_hours": uptime.total_seconds() / 3600
            },
            "database": db_status,
            "alerts": []
        }
        
        # アラート判定
        if cpu_percent > 80:
            health_data["alerts"].append("High CPU usage")
        if memory.percent > 80:
            health_data["alerts"].append("High memory usage")
        if disk.percent > 90:
            health_data["alerts"].append("Low disk space")
        
        if health_data["alerts"]:
            health_data["status"] = "warning"
        
        return health_data
    
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

def check_database_connection():
    """データベース接続チェック"""
    try:
        conn = sqlite3.connect("data/analysis.db")
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        conn.close()
        return {"status": "connected", "error": None}
    except Exception as e:
        return {"status": "error", "error": str(e)}
```

### 自動バックアップ

**backup_system.py**
```python
import shutil
import schedule
import time
from datetime import datetime
from pathlib import Path

def backup_database():
    """データベースバックアップ"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = Path("backups")
    backup_dir.mkdir(exist_ok=True)
    
    source = "data/analysis.db"
    backup_file = backup_dir / f"analysis_backup_{timestamp}.db"
    
    try:
        shutil.copy2(source, backup_file)
        print(f"Backup completed: {backup_file}")
        
        # 古いバックアップを削除（30日以上）
        cleanup_old_backups(backup_dir, days=30)
        
    except Exception as e:
        print(f"Backup failed: {e}")

def cleanup_old_backups(backup_dir: Path, days: int = 30):
    """古いバックアップファイルを削除"""
    import time
    
    cutoff = time.time() - (days * 24 * 60 * 60)
    
    for backup_file in backup_dir.glob("*.db"):
        if backup_file.stat().st_mtime < cutoff:
            backup_file.unlink()
            print(f"Deleted old backup: {backup_file}")

# スケジュール設定
schedule.every().day.at("02:00").do(backup_database)
schedule.every().week.do(lambda: cleanup_old_backups(Path("backups"), 30))

def run_scheduler():
    """スケジューラー実行"""
    while True:
        schedule.run_pending()
        time.sleep(60)  # 1分間隔でチェック

if __name__ == "__main__":
    run_scheduler()
```

## 🔒 セキュリティ設定

### 基本的なセキュリティ対策

**security.py**
```python
import hashlib
import hmac
import time
from functools import wraps

class SecurityManager:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        self.rate_limits = {}
    
    def rate_limit(self, max_requests: int = 10, window: int = 60):
        """レート制限デコレータ"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                client_id = self.get_client_id()
                now = time.time()
                
                if client_id not in self.rate_limits:
                    self.rate_limits[client_id] = []
                
                # 古いリクエストを削除
                self.rate_limits[client_id] = [
                    req_time for req_time in self.rate_limits[client_id]
                    if now - req_time < window
                ]
                
                # レート制限チェック
                if len(self.rate_limits[client_id]) >= max_requests:
                    raise Exception("Rate limit exceeded")
                
                # リクエスト記録
                self.rate_limits[client_id].append(now)
                
                return func(*args, **kwargs)
            return wrapper
        return decorator
    
    def get_client_id(self) -> str:
        """クライアントIDを取得（簡易実装）"""
        # 実際の実装では、IPアドレスやユーザーIDを使用
        return "default_client"
    
    def validate_request(self, data: str, signature: str) -> bool:
        """リクエスト署名検証"""
        expected_signature = hmac.new(
            self.secret_key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)

# 使用例
security = SecurityManager("your-secret-key")

@security.rate_limit(max_requests=5, window=60)
def protected_tool():
    """保護されたツール"""
    return "Protected response"
```

## ✅ デプロイチェックリスト

本格運用前に以下を確認：

### 機能チェック
- [ ] 全ツールが正常動作する
- [ ] エラーハンドリングが適切
- [ ] ログが正しく出力される
- [ ] データベースバックアップが動作する

### セキュリティチェック
- [ ] レート制限が設定されている
- [ ] 不要なデバッグ情報が出力されない
- [ ] データベースファイルが保護されている
- [ ] 設定ファイルにパスワードが平文で含まれない

### パフォーマンスチェック
- [ ] メモリ使用量が適切
- [ ] CPU使用率が正常範囲
- [ ] レスポンス時間が許容範囲
- [ ] 同時接続数の制限が適切

### 運用チェック
- [ ] 監視システムが稼働
- [ ] バックアップが自動実行される
- [ ] ログローテーションが設定されている
- [ ] 緊急時の対応手順が文書化されている

## 🎉 おめでとうございます！

全チュートリアルを完了しました！

### 学習した内容
- ✅ MCPとFastMCPの基本概念
- ✅ 実用的なツールの作成
- ✅ データベース操作とデータ永続化
- ✅ Web API連携と非同期処理
- ✅ 本格的なデプロイと運用

### 次のステップ
1. **実際のプロジェクトで活用**
2. **コミュニティへの参加**
3. **新機能の追加**
4. **他の開発者との知識共有**

## 🤝 コミュニティとサポート

- **GitHub Issues**: バグ報告・機能要望
- **Discussions**: 質問・アイデア共有  
- **Wiki**: 知識ベース
- **Discord**: リアルタイム議論

---

**🎊 あなたは今、MCPサーバー開発のエキスパートです！**

この知識を活用して、素晴らしいツールを作り、他の開発者を支援してください。 
---
title: "デプロイガイド"
version: "1.0"
last_updated: "2025-06-23"
author: "mcp starter"
reviewers: []
related_docs: ["01_development_standards.md", "02_test_specifications.md", "01_system_architecture.md"]
status: "approved"
dependencies:
  upstream: ["01_development_standards.md", "02_test_specifications.md", "02_design/01_system_architecture.md"]
  downstream: []
impact_level: "high"
---

# デプロイガイド

## 1. 概要

### 1.1 目的
本ドキュメントは、FastMCPスターターキットプロジェクトのデプロイメント手順と運用方法を定義します。初学者が簡単にMCPサーバを起動・運用できる環境を提供します。

### 1.2 デプロイ対象
- FastMCPフレームワークベースのMCPサーバ
- SSE/STDIO両方の通信方式対応
- 学習システム・チュートリアル・サンプルプロジェクト
- クロスプラットフォーム対応（Linux/macOS/Windows）

## 2. 環境準備

### 2.1 必要な環境
```yaml
System Requirements:
  OS: Linux/macOS/Windows
  Python: 3.8以上 (3.11推奨)
  Memory: 512MB以上
  Disk: 1GB以上の空き容量
  Network: インターネット接続（初回セットアップ時）

Development Tools:
  Git: バージョン管理
  pip: パッケージ管理
  venv: 仮想環境
```

### 2.2 一括セットアップスクリプト
```bash
#!/bin/bash
# setup.sh - 自動環境構築スクリプト

set -e

echo "🚀 FastMCP Starter Setup"
echo "======================"

# Python バージョンチェック
check_python() {
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python3 が見つかりません"
        exit 1
    fi
    
    python_version=$(python3 --version | cut -d' ' -f2)
    echo "✅ Python ${python_version} 検出"
}

# 仮想環境作成
create_venv() {
    echo "📦 仮想環境を作成中..."
    python3 -m venv fastmcp-env
    source fastmcp-env/bin/activate
    pip install --upgrade pip
}

# 依存関係インストール
install_dependencies() {
    echo "⬇️  依存関係をインストール中..."
    pip install -r requirements.txt
}

# データベース初期化
init_database() {
    echo "🗄️  データベースを初期化中..."
    python scripts/init_db.py
}

# 設定ファイル作成
create_config() {
    echo "⚙️  設定ファイルを作成中..."
    cp config.template.toml config.toml
    echo "�� config.toml を編集してください"
}

# メイン実行
main() {
    check_python
    create_venv
    install_dependencies
    init_database
    create_config
    
    echo "🎉 セットアップ完了！"
    echo "📖 チュートリアルを開始: python src/main.py --tutorial"
}

main
```

## 3. 起動方法

### 3.1 SSE モード起動
```bash
# 基本起動（SSE）
python src/main.py --transport sse

# ポート指定
python src/main.py --transport sse --port 8080

# デバッグモード
python src/main.py --transport sse --debug
```

### 3.2 STDIO モード起動
```bash
# STDIO モード
python src/main.py --transport stdio

# 設定ファイル指定
python src/main.py --transport stdio --config custom.toml
```

### 3.3 設定ファイル
```toml
# config.toml
[server]
host = "localhost"
port = 8000
transport = "sse"  # sse or stdio
debug = false

[database]
url = "sqlite:///fastmcp.db"

[learning]
enable_tutorials = true
progress_tracking = true
```

## 4. プラットフォーム別設定

### 4.1 Claude Desktop統合
```json
// Claude Desktop設定
{
  "mcpServers": {
    "fastmcp-starter": {
      "command": "python",
      "args": ["/path/to/fastmcp-starter/src/main.py", "--transport", "stdio"],
      "env": {
        "PYTHONPATH": "/path/to/fastmcp-starter/src"
      }
    }
  }
}
```

### 4.2 VS Code/Cursor統合
```json
// MCP拡張設定
{
  "mcp.servers": [
    {
      "name": "FastMCP Starter",
      "url": "http://localhost:8000",
      "transport": "sse"
    }
  ]
}
```

## 5. Docker デプロイ

### 5.1 Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/
COPY config.toml .
COPY scripts/ ./scripts/

EXPOSE 8000

CMD ["python", "src/main.py", "--transport", "sse", "--host", "0.0.0.0"]
```

### 5.2 docker-compose.yml
```yaml
version: '3.8'
services:
  fastmcp-starter:
    build: .
    ports:
      - "8000:8000"
    environment:
      - PYTHONPATH=/app/src
    volumes:
      - ./data:/app/data
```

## 6. 運用・監視

### 6.1 ヘルスチェック
```python
# health_check.py
import asyncio
import aiohttp

async def health_check():
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get('http://localhost:8000/health') as resp:
                if resp.status == 200:
                    print("✅ Server is healthy")
                    return True
        except:
            print("❌ Server is down")
            return False

if __name__ == "__main__":
    asyncio.run(health_check())
```

### 6.2 ログ監視
```bash
# ログファイル監視
tail -f logs/fastmcp.log

# エラー抽出
grep "ERROR" logs/fastmcp.log
```

## 7. トラブルシューティング

### 7.1 よくある問題
```yaml
問題: ポートが使用中
解決: netstat -tulpn | grep 8000 でプロセス確認

問題: Python モジュールが見つからない
解決: PYTHONPATH環境変数を確認

問題: データベース接続エラー
解決: python scripts/init_db.py で再初期化
```

### 7.2 デバッグ方法
```bash
# デバッグログ有効化
export LOG_LEVEL=DEBUG
python src/main.py --debug

# テストモード起動
python src/main.py --test-mode
```

## 8. 更新履歴

| バージョン | 更新日 | 更新者 | 更新内容 | 影響ドキュメント |
|---|-----|-----|----|----|
| 1.0 | 2025-06-23 | mcp starter | 初版作成（FastMCP対応デプロイガイドの策定） | 01_development_standards.md, 02_test_specifications.md | 
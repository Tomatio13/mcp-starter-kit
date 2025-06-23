---
title: "チュートリアル2: Hello World ツールを作ろう 🎯"
version: "2.2"
last_updated: "2025-06-23"
author: "mcp starter"
reviewers: []
related_docs: ["01-basics.md", "03-data-handling.md"]
status: "approved"
---

# チュートリアル2: Hello World ツールを作ろう 🎯

**所要時間: 20分**  
**前提知識: [チュートリアル1](01-basics.md)完了**

## 🎯 今回の目標

- 初めてのMCPツールを作成
- FastMCPの基本的な使い方をマスター
- STDIO/HTTP/SSE全てでテスト実行

## 📝 ステップ1: 環境準備

### プロジェクトディレクトリ作成
```bash
mkdir my-first-mcp
cd my-first-mcp

# 仮想環境作成（推奨）
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### FastMCPインストール

**推奨方法（uvを使用）**:
```bash
# uvがインストール済みの場合
uv add fastmcp

# または
uv pip install fastmcp
```

**従来の方法**:
```bash
pip install fastmcp
```

> 💡 **ヒント**: [uv](https://docs.astral.sh/uv/)はPythonパッケージ管理の最新ツールで、FastMCPでも推奨されています。

## 🏗️ ステップ2: Hello Worldサーバー作成

### ファイル作成: `hello_world.py`
```python
"""
私の初めてのMCPサーバー
FastMCPを使ったHello Worldの例
"""
from fastmcp import FastMCP

# MCPサーバーを作成
mcp = FastMCP("Hello World Server")

@mcp.tool
def say_hello(name: str) -> str:
    """指定された名前に挨拶する
    
    Args:
        name: 挨拶する相手の名前
        
    Returns:
        挨拶メッセージ
    """
    return f"こんにちは、{name}さん！FastMCPへようこそ 🎉"

@mcp.tool
def add_numbers(a: float, b: float) -> float:
    """2つの数値を足し算する
    
    Args:
        a: 1つ目の数値
        b: 2つ目の数値
        
    Returns:
        計算結果
    """
    result = a + b
    return result

@mcp.tool
def get_server_info() -> dict:
    """サーバーの情報を取得する
    
    Returns:
        サーバー情報の辞書
    """
    return {
        "server_name": "Hello World Server",
        "version": "1.0.0",
        "description": "初学者向けのMCPサーバーサンプル",
        "author": "あなたの名前",
        "tools_count": 3
    }

if __name__ == "__main__":
    # サーバーを起動
    mcp.run()
```

## 🚀 ステップ3: サーバー起動

### STDIOモードで起動（デフォルト）
```bash
# 直接実行
python hello_world.py

# または FastMCP CLI を使用
fastmcp run hello_world.py
```

起動すると以下のような表示が出ます：
```
Starting FastMCP server 'Hello World Server'
Transport: stdio
Waiting for messages...
```

### HTTPモードで起動
```bash
# FastMCP CLIを使用
fastmcp run hello_world.py --transport streamable-http --port 8000

# または直接実行
python hello_world.py --transport streamable-http --port 8000
```

起動すると：
```
Starting FastMCP server 'Hello World Server'
Transport: streamable-http
Server running on http://127.0.0.1:8000/mcp
```

### SSEモードで起動（非推奨・互換性のため）

> ⚠️ **注意**: SSEトランスポートは非推奨です。新しいプロジェクトではHTTPモードを使用してください。

```bash
# FastMCP CLIを使用
fastmcp run hello_world.py --transport sse --port 8000

# または直接実行
python hello_world.py --transport sse --port 8000
```

起動すると：
```
Starting FastMCP server 'Hello World Server'
Transport: sse
Server running on http://127.0.0.1:8000/sse
```

## 🧪 ステップ4: テスト実行

### 方法1: Pythonクライアントを使用したテスト（プログラム的）

テスト用のPythonファイルを作成してサーバーをテストできます：

#### ファイル作成: `test_client.py`
```python
"""
Hello Worldサーバーをテストするクライアント
"""
import asyncio
from fastmcp import Client

async def test_hello_world_server():
    # サーバーファイルを指定してクライアント作成
    client = Client("hello_world.py")
    
    async with client:
        print("🔗 サーバーに接続しました")
        
        # 利用可能なツール一覧を取得
        tools = await client.list_tools()
        print(f"📋 利用可能なツール: {[tool.name for tool in tools]}")
        
        # say_helloツールを実行
        result1 = await client.call_tool("say_hello", {"name": "太郎"})
        print(f"✅ say_hello結果: {result1[0].text}")
        
        # add_numbersツールを実行
        result2 = await client.call_tool("add_numbers", {"a": 10, "b": 25})
        print(f"🔢 add_numbers結果: {result2[0].text}")
        
        # get_server_infoツールを実行
        result3 = await client.call_tool("get_server_info")
        print(f"ℹ️  server_info結果: {result3[0].text}")

if __name__ == "__main__":
    asyncio.run(test_hello_world_server())
```

#### テスト実行:
```bash
python test_client.py
```

期待される出力：
```
🔗 サーバーに接続しました
📋 利用可能なツール: ['say_hello', 'add_numbers', 'get_server_info']
✅ say_hello結果: こんにちは、太郎さん！FastMCPへようこそ 🎉
🔢 add_numbers結果: 35.0
ℹ️  server_info結果: {"server_name": "Hello World Server", "version": "1.0.0", ...}
```

### 方法2: HTTPモー ドでのテスト

HTTPモードの場合、FastMCPクライアントで簡単にテストできます：

```python
import asyncio
from fastmcp import Client

async def test_http_server():
    # HTTPサーバーのURLを指定
    client = Client("http://127.0.0.1:8000/mcp")
    
    async with client:
        tools = await client.list_tools()
        print(f"利用可能なツール: {[tool.name for tool in tools]}")
        
        result = await client.call_tool("say_hello", {"name": "HTTP太郎"})
        print(f"結果: {result[0].text}")

if __name__ == "__main__":
    asyncio.run(test_http_server())
```

### 方法3: SSEモードでのテスト（非推奨・互換性のため）

> ⚠️ **注意**: SSEは非推奨のため、新しいプロジェクトではHTTPモードを使用してください。

SSEモードの場合、専用のトランスポートを指定する必要があります：

```python
import asyncio
from fastmcp import Client
from fastmcp.client import SSETransport

async def test_sse_server():
    # SSEトランスポートを明示的に指定
    transport = SSETransport(
        url="http://127.0.0.1:8000/sse"
    )
    client = Client(transport)
    
    async with client:
        tools = await client.list_tools()
        print(f"利用可能なツール: {[tool.name for tool in tools]}")
        
        result = await client.call_tool("say_hello", {"name": "SSE太郎"})
        print(f"結果: {result[0].text}")

if __name__ == "__main__":
    asyncio.run(test_sse_server())
```

または、URLで直接指定することも可能です（ただし推奨されません）：

```python
import asyncio
from fastmcp import Client

async def test_sse_simple():
    # SSE URLを直接指定（非推奨）
    client = Client("http://127.0.0.1:8000/sse")
    
    async with client:
        result = await client.call_tool("say_hello", {"name": "SSE太郎"})
        print(f"結果: {result[0].text}")

if __name__ == "__main__":
    asyncio.run(test_sse_simple())
```

## 📊 ステップ4: ツールを追加してみよう

既存のファイルに新しいツールを追加：

```python
@mcp.tool
def calculate_age(birth_year: int) -> dict:
    """生年から年齢を計算する
    
    Args:
        birth_year: 生年（西暦）
        
    Returns:
        年齢情報
    """
    from datetime import datetime
    
    current_year = datetime.now().year
    age = current_year - birth_year
    
    return {
        "birth_year": birth_year,
        "current_year": current_year,
        "age": age,
        "message": f"{birth_year}年生まれの方は{age}歳です"
    }

@mcp.tool
def format_text(text: str, style: str = "upper") -> str:
    """テキストを様々な形式でフォーマットする
    
    Args:
        text: フォーマットするテキスト
        style: フォーマットスタイル（upper, lower, title, reverse）
        
    Returns:
        フォーマットされたテキスト
    """
    if style == "upper":
        return text.upper()
    elif style == "lower":
        return text.lower()
    elif style == "title":
        return text.title()
    elif style == "reverse":
        return text[::-1]
    else:
        return f"未対応のスタイル: {style}"
```

## 🔧 ステップ5: エラーハンドリング

実用的なツールにはエラーハンドリングが重要：

```python
@mcp.tool
def safe_divide(dividend: float, divisor: float) -> dict:
    """安全な除算を行う
    
    Args:
        dividend: 被除数
        divisor: 除数
        
    Returns:
        計算結果またはエラー情報
    """
    try:
        if divisor == 0:
            return {
                "success": False,
                "error": "ゼロで割ることはできません",
                "result": None
            }
        
        result = dividend / divisor
        return {
            "success": True,
            "error": None,
            "result": result,
            "calculation": f"{dividend} ÷ {divisor} = {result}"
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": f"計算エラー: {str(e)}",
            "result": None
        }
```

## 📁 ステップ6: 設定ファイルの活用

より高度な設定のため、設定ファイルを作成：

### `config.toml`
```toml
[server]
name = "Hello World Server"
version = "1.0.0"
description = "初学者向けのMCPサーバーサンプル"
author = "あなたの名前"

[transport]
default = "stdio"
http_port = 8000
http_host = "127.0.0.1"

[features]
enable_logging = true
log_level = "INFO"
enable_metrics = false
```

### 設定を読み込むコード
```python
import tomllib
from pathlib import Path

# 設定読み込み
config_path = Path("config.toml")
if config_path.exists():
    with open(config_path, "rb") as f:
        config = tomllib.load(f)
else:
    config = {}

# 設定を使用してサーバー作成
mcp = FastMCP(
    name=config.get("server", {}).get("name", "Hello World Server")
)
```

## ✅ チェックポイント

以下を確認してください：

- [ ] hello_world.pyが正常に起動する
- [ ] `fastmcp dev hello_world.py`でテストUIが使える
- [ ] Pythonクライアントでツールが実行できる
- [ ] HTTPモードでも動作する
- [ ] SSEモード（必要に応じて）でも動作する
- [ ] エラーハンドリングが機能する

## 🎉 完成！

おめでとうございます！あなたの初めてのMCPサーバーが完成しました。

### 完成したプロジェクト構造
```
my-first-mcp/
├── hello_world.py      # メインサーバー
├── test_client.py      # 詳細テスト用クライアント
├── config.toml         # 設定ファイル
├── venv/              # 仮想環境
└── README.md          # プロジェクト説明
```

> 💡 **参考**: このチュートリアルで説明した内容の実働可能な実装は `src/my-first-mcp/` ディレクトリにもあります。

## 🔧 トラブルシューティング

### よくあるエラー

**1. モジュールが見つからない**
```bash
# FastMCPが正しくインストールされているか確認
fastmcp version
```

**2. ポートが使用中**
```bash
# 別のポートを指定（HTTPの場合）
fastmcp run hello_world.py --transport streamable-http --port 8001

# SSEの場合
fastmcp run hello_world.py --transport sse --port 8001
```

**3. クライアント接続エラー**
- サーバーが起動していることを確認
- HTTPモードの場合、正しいURLを使用

### トランスポート選択のガイド

| トランスポート | 推奨度 | 用途 | 特徴 |
|---|---|---|---|
| **STDIO** | ⭐⭐⭐ | ローカルツール、コマンドライン統合 | シンプル、直接実行 |
| **HTTP (streamable-http)** | ⭐⭐⭐ | ウェブベースのデプロイメント | 最新、推奨方式 |
| **SSE** | ⭐ | レガシーシステムとの互換性 | 非推奨、互換性のためのみ |

**開発・テストのヒント:**
- **初心者**: `fastmcp dev`コマンドが最も簡単
- **プログラム的テスト**: Pythonクライアントを使用
- **本番環境**: HTTPトランスポートを推奨

## 🔄 次のステップ

基本的なツールが作れるようになったら、次はデータを扱ってみましょう！

**[→ チュートリアル3: データ操作](03-data-handling.md)**

---

## 更新履歴

| バージョン | 更新日 | 更新者 | 更新内容 | 影響ドキュメント |
|---|-----|-----|----|---|
| 1.0 | 2025-06-23 | mcp starter | 初版作成 | - |
| 2.0 | 2025-06-23 | mcp starter | 公式ドキュメント準拠の修正、インストール方法とテスト方法の更新 | 01-basics.md, 03-data-handling.md |
| 2.1 | 2025-06-23 | mcp starter | SSEトランスポートの情報を追加（非推奨として）、トランスポート選択ガイドを追加 | - |
| 2.2 | 2025-06-23 | mcp starter | 実際の動作確認を実施してコード例を修正（FastMCPコンストラクタ、SSETransportインポート等） | - |

---

💡 **ヒント**: 作成したツールは実際のプロジェクトでも再利用できます。ぜひ実験してみてください！ 
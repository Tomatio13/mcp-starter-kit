# チュートリアル2: Hello World ツールを作ろう 🎯

**所要時間: 20分**  
**前提知識: [チュートリアル1](01-basics.md)完了**

## 🎯 今回の目標

- 初めてのMCPツールを作成
- FastMCPの基本的な使い方をマスター
- STDIO/SSE両方でテスト実行

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
```bash
pip install fastmcp
```

## 🏗️ ステップ2: Hello Worldサーバー作成

### ファイル作成: `hello_world.py`
```python
"""
私の初めてのMCPサーバー
FastMCPを使ったHello Worldの例
"""
from fastmcp import FastMCP

# MCPサーバーを作成
app = FastMCP("Hello World Server")

@app.tool()
def say_hello(name: str) -> str:
    """指定された名前に挨拶する
    
    Args:
        name: 挨拶する相手の名前
        
    Returns:
        挨拶メッセージ
    """
    return f"こんにちは、{name}さん！FastMCPへようこそ 🎉"

@app.tool()
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

@app.tool()
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
    app.run()
```

## 🚀 ステップ3: サーバー起動

### STDIOモードで起動
```bash
python hello_world.py
```

起動すると以下のような表示が出ます：
```
Starting FastMCP server 'Hello World Server'
Transport: stdio
Waiting for messages...
```

### SSEモードで起動
別のターミナルで：
```bash
python hello_world.py --transport sse --port 8000
```

起動すると：
```
Starting FastMCP server 'Hello World Server'
Transport: sse
Server running on http://localhost:8000
```

## 🧪 ステップ4: テスト実行

### STDIOモードでのテスト

新しいターミナルを開いて：
```bash
# ツール一覧を取得
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | python hello_world.py
```

期待される出力：
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "say_hello",
        "description": "指定された名前に挨拶する",
        "inputSchema": {
          "type": "object",
          "properties": {
            "name": {"type": "string", "description": "挨拶する相手の名前"}
          },
          "required": ["name"]
        }
      },
      // ... 他のツール
    ]
  }
}
```

### ツール実行テスト
```bash
# say_helloツールを実行
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "say_hello", "arguments": {"name": "太郎"}}}' | python hello_world.py
```

期待される出力：
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "こんにちは、太郎さん！FastMCPへようこそ 🎉"
      }
    ]
  }
}
```

### SSEモードでのテスト

ブラウザで `http://localhost:8000` にアクセスすると、シンプルなテストUIが表示されます（FastMCPが提供）。

## 📊 ステップ5: ツールを追加してみよう

既存のファイルに新しいツールを追加：

```python
@app.tool()
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

@app.tool()
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

## 🔧 ステップ6: エラーハンドリング

実用的なツールにはエラーハンドリングが重要：

```python
@app.tool()
def safe_divide(dividend: float, divisor: float) -> dict:
    """安全な除算を行う
    
    Args:
        dividend: 被除数
        divisor: 除数
        
    Returns:
        計算結果または エラー情報
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

## 📁 ステップ7: 設定ファイルの活用

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
sse_port = 8000
sse_host = "localhost"

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
app = FastMCP(
    name=config.get("server", {}).get("name", "Hello World Server"),
    description=config.get("server", {}).get("description", "")
)
```

## ✅ チェックポイント

以下を確認してください：

- [ ] hello_world.pyが正常に起動する
- [ ] STDIOモードでツール一覧が取得できる
- [ ] ツールが正常に実行される
- [ ] SSEモードでも動作する
- [ ] エラーハンドリングが機能する

## 🎉 完成！

おめでとうございます！あなたの初めてのMCPサーバーが完成しました。

### 完成したプロジェクト構造
```
my-first-mcp/
├── hello_world.py      # メインサーバー
├── config.toml         # 設定ファイル
├── venv/              # 仮想環境
└── README.md          # プロジェクト説明
```

## 🔧 トラブルシューティング

### よくあるエラー

**1. モジュールが見つからない**
```bash
# FastMCPが正しくインストールされているか確認
pip list | grep fastmcp
```

**2. ポートが使用中**
```bash
# 別のポートを指定
python hello_world.py --transport sse --port 8001
```

**3. JSON形式エラー**
- STDIOテストでは改行を含めない
- ダブルクォートを使用する

## 🔄 次のステップ

基本的なツールが作れるようになったら、次はデータを扱ってみましょう！

**[→ チュートリアル3: データ操作](03-data-handling.md)**

---

💡 **ヒント**: 作成したツールは実際のプロジェクトでも再利用できます。ぜひ実験してみてください！ 
# トラブルシューティング 🔧

FastMCPスターターキットでよく遭遇する問題と解決策をまとめました。

## 🚨 よくある問題と解決策

### 1. インストール関連

#### ❌ `fastmcp` モジュールが見つからない

**エラーメッセージ:**
```
ModuleNotFoundError: No module named 'fastmcp'
```

**解決策:**
```bash
# 仮想環境が有効か確認
which python
python --version

# FastMCPをインストール
pip install fastmcp

# インストール確認
pip list | grep fastmcp
```

#### ❌ Python バージョンが古い

**エラーメッセージ:**
```
SyntaxError: invalid syntax (type hints)
```

**解決策:**
```bash
# Pythonバージョン確認
python --version

# Python 3.8以上が必要
# アップデートまたは新しいバージョンのインストール
```

### 2. サーバー起動関連

#### ❌ サーバーが起動しない

**症状:** `python main.py` を実行しても何も表示されない

**確認ポイント:**
```python
# main.py の最後に以下があることを確認
if __name__ == "__main__":
    app.run()
```

**解決策:**
```bash
# デバッグモードで起動
python main.py --debug

# ログレベルを上げて詳細確認
python main.py --log-level DEBUG
```

#### ❌ ポートが使用中

**エラーメッセージ:**
```
OSError: [Errno 48] Address already in use
```

**解決策:**
```bash
# 使用中のポートを確認
lsof -i :8000

# プロセスを終了
kill -9 <PID>

# または別のポートを使用
python main.py --port 8001
```

### 3. 通信関連

#### ❌ STDIO通信でレスポンスがない

**症状:** JSON送信してもレスポンスが返らない

**確認ポイント:**
1. **JSON形式が正しいか:**
```bash
# 正しい形式
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | python main.py

# 間違った形式（シングルクォート）
echo "{'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list'}" | python main.py
```

2. **改行が含まれていないか:**
```bash
# NG: 改行あり
echo '{"jsonrpc": "2.0", 
"id": 1, 
"method": "tools/list"}' | python main.py

# OK: 改行なし
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | python main.py
```

#### ❌ SSE接続でブラウザエラー

**症状:** `http://localhost:8000` でページが表示されない

**解決策:**
```bash
# SSEモードで起動されているか確認
python main.py --transport sse --port 8000

# ファイアウォール設定確認
curl http://localhost:8000

# ブラウザキャッシュクリア
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (macOS)
```

### 4. データベース関連

#### ❌ データベースファイルが作成されない

**症状:** `tasks.db` や `analysis.db` ファイルが見つからない

**確認ポイント:**
```python
import os
print("現在のディレクトリ:", os.getcwd())
print("書き込み権限:", os.access(".", os.W_OK))
```

**解決策:**
```bash
# ディレクトリ権限確認
ls -la

# 権限変更（必要に応じて）
chmod 755 .

# データディレクトリ作成
mkdir -p data
```

#### ❌ SQLite外部キー制約エラー

**エラーメッセージ:**
```
sqlite3.IntegrityError: FOREIGN KEY constraint failed
```

**解決策:**
```python
# 外部キー制約を有効化
with sqlite3.connect(db_path) as conn:
    conn.execute("PRAGMA foreign_keys = ON")
    cursor = conn.cursor()
    # 以下、通常の処理
```

### 5. Claude Desktop統合

#### ❌ Claude Desktopでツールが表示されない

**確認ポイント:**

1. **設定ファイルの場所が正しいか:**
```bash
# macOS
ls -la ~/Library/Application\ Support/Claude/

# Windows
dir %APPDATA%\Claude\

# Linux
ls -la ~/.config/Claude/
```

2. **JSON形式が正しいか:**
```json
{
  "mcpServers": {
    "fastmcp-starter": {
      "command": "python",
      "args": ["/full/path/to/main.py"],
      "env": {}
    }
  }
}
```

3. **パスが絶対パスか:**
```bash
# 絶対パス取得
pwd
# /home/user/fastmcp-starter

# 設定ファイルでは絶対パスを使用
"/home/user/fastmcp-starter/main.py"
```

#### ❌ Claude Desktopでエラーが発生

**解決策:**
```bash
# Claude Desktopのログ確認（macOS）
tail -f ~/Library/Logs/Claude/claude.log

# サーバーを個別テスト
python main.py --debug

# 最小構成でテスト
# hello.py を作成して単純なツールで確認
```

### 6. VS Code統合

#### ❌ MCP拡張機能が見つからない

**解決策:**
1. VS Code バージョンが最新か確認
2. 拡張機能マーケットプレイスで"Model Context Protocol"を検索
3. 手動インストール: 拡張機能VSIX ファイルをダウンロード

#### ❌ ワークスペース設定が反映されない

**確認ポイント:**
```json
// .vscode/settings.json
{
  "mcp.servers": {
    "project-tools": {
      "command": "python",
      "args": ["${workspaceFolder}/main.py"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

### 7. 開発関連

#### ❌ インポートエラー

**エラーメッセージ:**
```
ImportError: cannot import name 'FastMCP' from 'fastmcp'
```

**解決策:**
```bash
# FastMCPのバージョン確認
pip show fastmcp

# 最新版にアップデート
pip install --upgrade fastmcp

# キャッシュクリア
pip cache purge
```

#### ❌ 文字エンコーディングエラー

**エラーメッセージ:**
```
UnicodeDecodeError: 'utf-8' codec can't decode byte
```

**解決策:**
```python
# ファイル読み込み時にエンコーディング指定
with open("file.txt", "r", encoding="utf-8") as f:
    content = f.read()

# Web スクレイピング時
response = requests.get(url)
response.encoding = 'utf-8'  # 明示的に指定
```

## 🛠️ デバッグのヒント

### 1. ログレベル調整

```python
import logging

# デバッグログ有効化
logging.basicConfig(level=logging.DEBUG)

# FastMCP内のログ確認
logger = logging.getLogger("fastmcp")
logger.setLevel(logging.DEBUG)
```

### 2. ステップバイステップ確認

```python
# ツール実行前後でログ出力
@app.tool()
def debug_tool(param: str) -> str:
    print(f"[DEBUG] Input: {param}")
    
    try:
        result = process_something(param)
        print(f"[DEBUG] Result: {result}")
        return result
    except Exception as e:
        print(f"[ERROR] Exception: {e}")
        raise
```

### 3. 設定値確認

```python
# 環境変数確認
import os
print("PATH:", os.environ.get("PATH"))
print("PYTHONPATH:", os.environ.get("PYTHONPATH"))

# FastMCP設定確認
print("App name:", app.name)
print("Transport:", app.transport)
```

## 📞 サポートが必要な場合

### 1. 問題報告時の情報収集

以下の情報を含めてください：

```bash
# システム情報
python --version
pip --version
uname -a  # Linux/macOS
ver       # Windows

# FastMCP情報
pip show fastmcp

# エラー詳細
python main.py --debug 2>&1 | tee error.log
```

### 2. 最小再現コード

問題を再現する最小のコードを作成：

```python
from fastmcp import FastMCP

app = FastMCP("Debug Test")

@app.tool()
def test_tool() -> str:
    return "Hello"

if __name__ == "__main__":
    app.run()
```

### 3. サポートチャンネル

- **GitHub Issues**: バグ報告・機能要望
- **Discussions**: 質問・相談
- **Wiki**: 知識ベース
- **Discord**: リアルタイム支援

## 🔍 追加リソース

### 参考ドキュメント
- [FastMCP公式ドキュメント](https://github.com/jlowin/fastmcp)
- [MCP仕様書](https://modelcontextprotocol.io/)
- [Python公式ドキュメント](https://docs.python.org/)

### 有用なツール
- **SQLite Browser**: データベース内容確認
- **Postman**: API テスト
- **curl**: コマンドラインHTTPテスト
- **jq**: JSON整形・抽出

### コミュニティリソース
- **Stack Overflow**: `[fastmcp]` タグ
- **Reddit**: r/fastmcp
- **Discord**: FastMCP Community

---

**💡 解決しない問題がある場合は、遠慮なくコミュニティに質問してください！** 
# My First MCP Server 🚀

FastMCPを使った初めてのModel Context Protocol (MCP) サーバーです。

## 📝 概要

このプロジェクトは、FastMCPチュートリアル2で作成したHello Worldサーバーの完成版です。
基本的なMCPツールの実装例と、様々なトランスポート方式でのテスト方法を提供します。

## 🛠️ 機能

### 実装済みツール

1. **say_hello** - 指定された名前に挨拶する
2. **add_numbers** - 2つの数値を足し算する
3. **get_server_info** - サーバーの情報を取得する
4. **calculate_age** - 生年から年齢を計算する
5. **format_text** - テキストを様々な形式でフォーマットする
6. **safe_divide** - 安全な除算を行う（エラーハンドリング付き）

### サポート対象トランスポート

- **STDIO** (デフォルト) - ローカル実行に最適
- **HTTP (streamable-http)** - ウェブベースのデプロイメントに推奨
- **SSE** - レガシーシステムとの互換性のため（非推奨）

## 🚀 使用方法

### 1. 環境セットアップ

```bash
# 仮想環境作成（推奨）
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# FastMCPインストール
uv add fastmcp
# または
pip install fastmcp
```

### 2. サーバー起動

#### STDIOモード（デフォルト）
```bash
python hello_world.py
# または
fastmcp run hello_world.py
```

#### HTTPモード
```bash
fastmcp run hello_world.py --transport streamable-http --port 8000
```

#### SSEモード（非推奨）
```bash
fastmcp run hello_world.py --transport sse --port 8000 --host 0.0.0.0
```

### 3. テスト実行

#### 方法1: FastMCP Dev Command（最も簡単）
```bash
fastmcp dev hello_world.py
```

#### 方法2: Pythonクライアント
```bash
python test_client.py
```

## 📁 プロジェクト構造

```
my-first-mcp/
├── hello_world.py      # メインサーバー
├── test_client.py      # テスト用クライアント
├── config.toml         # 設定ファイル
└── README.md          # このファイル
```

## ⚙️ 設定

`config.toml`でサーバーの設定をカスタマイズできます：

```toml
[server]
name = "Hello World Server"
version = "1.0.0"
description = "初学者向けのMCPサーバーサンプル"
author = "あなたの名前"
```

## 🧪 テスト例

### say_helloツール
```python
result = await client.call_tool("say_hello", {"name": "太郎"})
# 結果: "こんにちは、太郎さん！FastMCPへようこそ 🎉"
```

### safe_divideツール
```python
result = await client.call_tool("safe_divide", {"dividend": 10, "divisor": 3})
# 結果: {"success": True, "result": 3.3333..., "calculation": "10 ÷ 3 = 3.3333..."}
```

## 🔧 トラブルシューティング

### よくあるエラー

1. **モジュールが見つからない**
   ```bash
   fastmcp version  # インストール確認
   ```

2. **ポートが使用中**
   ```bash
   fastmcp run hello_world.py --transport streamable-http --port 8001
   ```

3. **設定ファイルエラー**
   - `config.toml`の構文を確認
   - Python 3.11以上では`tomllib`が標準ライブラリ

## 📚 関連リンク

- [FastMCP公式ドキュメント](https://gofastmcp.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [チュートリアル2: Hello World ツールを作ろう](../../tutorials/02-hello-world.md)

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

---

💡 **ヒント**: このサンプルを参考にして、独自のMCPツールを作成してみてください！ 
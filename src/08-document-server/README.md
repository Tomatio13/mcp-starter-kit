# hackathon Document MCP Server

## 概要
MCPハッカソンのドキュメントサーバーです。FastMCPを使用して、ハッカソン参加者に必要な各種ドキュメントとユーティリティ機能を提供します。

## 🎯 解決する課題

### 現状の問題
- **問題1：** ハッカソン参加者が必要なドキュメントに素早くアクセスできない
- **問題2：** 複数のドキュメントが散在しており、一元的にアクセスする手段がない
- **問題3：** 基本的なユーティリティ機能が不足している

### 対象ユーザー
- **プライマリ：** MCPハッカソン参加者
- **セカンダリ：** ハッカソン運営者・審査員

## 🚀 ソリューション

### 解決アプローチ
FastMCPを使用したMCPサーバーを構築し、ハッカソン関連のドキュメントと基本的なユーティリティ機能を統合提供します。

### 主要機能
1. **ドキュメント提供** - ハッカソン参加者ガイド、発表テンプレート、評価プロンプト、READMEテンプレートの配信
2. **ユーティリティ機能** - 年齢計算、テキストフォーマット、安全な除算処理
3. **サーバー情報提供** - サーバーの基本情報と設定の取得

### 期待される効果
- **効率化：** ドキュメントアクセス時間の短縮
- **品質向上：** 統一されたテンプレートとガイドラインの提供
- **利便性向上：** 基本的なユーティリティ機能の統合提供

## 🏗️ システム構成

### アーキテクチャ図
```
[MCPクライアント] → [FastMCP Server] → [contextディレクトリ]
                           ↓
                   [ドキュメント・ユーティリティ機能]
```

### 技術スタック
- **MCP Server：** FastMCP (Python 3.12)
- **設定管理：** TOML
- **通信方式：** stdio / HTTP
- **ドキュメント形式：** Markdown

## 📁 プロジェクト構造

```
08-document-server/
├── hackathon_document_server.py  # メインサーバー
├── config.toml                  # 設定ファイル
├── context/                     # ドキュメント格納ディレクトリ
│   ├── MCPハッカソン参加者ガイド.md
│   ├── MCPハッカソン発表テンプレート.md
│   ├── MCPハッカソン評価プロンプト.md
│   └── MCPプロジェクト_READMEテンプレート.md
├── venv/                        # 仮想環境
└── README.md                    # このファイル
```

## 📋 前提条件

### 必要な環境
- [x] Python (バージョン 3.12以上)
- [x] FastMCP ライブラリ
- [x] Python標準ライブラリ（tomllib, pathlib, datetime）

## 🔧 セットアップ手順

### 1. 仮想環境の設定
```bash
# 仮想環境作成（推奨）
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 仮想環境が既に存在する場合
source venv/bin/activate
```

### 2. 依存関係のインストール
```bash
# FastMCPインストール
pip install fastmcp
```

### 4. 設定確認
`config.toml`ファイルで以下の設定を確認：
```toml
[server]
name = "hackathon Document Mcp Server"
version = "1.0.0"
description = "MCPハッカソンのドキュメントサーバ"
author = "Masato Asai"
```

### 5. サーバーの起動

#### STDIOモード（デフォルト）
```bash
fastmcp run hackathon_document_server.py
```

#### HTTPモード
```bash
fastmcp run hackathon_document_server.py --transport streamable-http --port 8000
```

#### SSEモード
```bash
fastmcp run hackathon_document_server.py --transport sse --host 0.0.0.0 --port 8000
```

## 📖 使用方法

### 基本的な使い方
1. **サーバー情報取得** - `get_server_info()` でサーバーの基本情報を取得
2. **ドキュメント取得** - 各種ドキュメント取得ツールを使用

### 利用可能なツール

#### ドキュメント系ツール
- `get_participant_guide()` - MCPハッカソン参加者ガイド
- `get_presentation_template()` - 発表用Marpテンプレート  
- `get_evaluation_prompt()` - 評価プロンプト
- `get_readme_template()` - READMEテンプレート

#### ユーティリティツール
- `get_server_info()` - サーバー情報取得

### テスト実行

#### 方法1: FastMCP Dev Command（最も簡単）
```bash
fastmcp dev hackathon_document_server.py
```

#### 方法2: クライアントテストスクリプト（作成した場合）
```bash
python test_client.py
```

### 実行例

#### get_participant_guideツール
```python
result = await client.call_tool("get_participant_guide")
# 結果: MCPハッカソン参加者ガイドのMarkdown内容
```

## 🔍 トラブルシューティング

### よくある問題と解決方法

#### 問題1：サーバーが起動しない
**症状：** Pythonスクリプト実行時にエラーが発生  
**原因：** FastMCPがインストールされていない、または設定ファイルに問題がある  
**解決方法：**
```bash
# FastMCPインストール確認
fastmcp version

# 再インストール
pip install fastmcp
python hackathon_document_server.py
```

#### 問題2：ドキュメントが読み込めない
**症状：** ドキュメント取得ツールでエラーが発生  
**解決方法：**
1. `context/`ディレクトリの存在確認
2. Markdownファイルの存在確認
3. ファイルの読み取り権限確認

#### 問題3：ポートが使用中（HTTPモード）
**症状：** HTTPモードでポートエラーが発生  
**解決方法：**
```bash
# 別のポートを使用
fastmcp run hackathon_document_server.py --transport streamable-http --port 8001
```

#### 問題4：設定ファイルエラー
**症状：** config.tomlの読み込みでエラーが発生  
**解決方法：**
- `config.toml`の構文を確認
- Python 3.12以上では`tomllib`が標準ライブラリ

## 📊 パフォーマンス・制限事項

### パフォーマンス指標
- **処理時間：** 平均 0.1秒未満
- **同時処理数：** stdio使用時は1接続、HTTP使用時は複数接続対応
- **メモリ使用量：** 最小限（ドキュメントはオンデマンド読み込み）

### 既知の制限事項
- ドキュメントファイルはUTF-8エンコーディング必須
- contextディレクトリ内のファイル変更はサーバー再起動が必要

## 🔒 セキュリティ考慮事項

### データ保護
- ローカルファイルシステムからの読み込みのみ
- 外部ネットワーク接続なし
- 入力値の基本的な検証実装済み

## 📈 機能詳細

### 設定ファイル（config.toml）
- サーバー名、バージョン、説明の設定
- 通信方式（stdio/HTTP）の選択
- HTTPポート・ホストの設定
- ロギングレベルの設定

### contextディレクトリ
以下のMarkdownファイルを格納：
- `MCPハッカソン参加者ガイド.md` - チーム編成から発表まで包括的なガイド
- `MCPハッカソン発表テンプレート.md` - Marpを使った5分間発表用テンプレート
- `MCPハッカソン評価プロンプト.md` - 審査員・自己評価用の詳細基準
- `MCPプロジェクト_READMEテンプレート.md` - プロジェクトドキュメントの標準構成

## 📞 サポート・お問い合わせ

### 開発者情報
- **作成者：** Masato Asai
- **プロジェクト：** MCPハッカソン 2025 成果物

### 技術的な問題
- FastMCP公式ドキュメントを参照
- Python 3.12の標準ライブラリドキュメントを確認

## 📚 関連資料

### 技術ドキュメント
- [MCP公式ドキュメント](https://modelcontextprotocol.io/)
- [FastMCP ドキュメント](https://github.com/jlowin/fastmcp)

## 📄 ライセンス

MIT License

---

**作成日：** 2025-08-12  
**最終更新：** 2025-08-12  
**作成者：** Masato Asai  
**MCPハッカソン 2025 成果物**

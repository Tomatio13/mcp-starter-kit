# スマート情報収集&分析システム 🚀

FastMCPを使った実践的なWeb情報収集・分析MCPサーバーです。

## 📝 概要

このプロジェクトは、FastMCPチュートリアル4で作成したスマート情報収集&分析システムの完成版です。
Web上の情報を収集し、テキスト分析を行い、結果をデータベースに保存する実用的なMCPツールを提供します。

## 🛠️ 主要機能

### 実装済みツール

1. **scrape_and_analyze** - URLを取得して分析する統合処理
2. **batch_analyze_urls** - 複数URLを一括分析
3. **get_analysis_history** - 分析履歴を取得
4. **search_by_sentiment** - 感情ラベルで検索
5. **get_keyword_analysis** - キーワード分析
6. **generate_summary_report** - サマリーレポート生成
7. **analyze_rss_feed** - RSSフィード分析（応用例）

### 分析機能

- **Web情報収集**: URLからコンテンツを取得
- **テキスト分析**: 感情分析・キーワード抽出
- **データ保存**: 分析結果をSQLiteデータベースに保存
- **レポート生成**: 分析結果をレポート形式で出力

## 🚀 使用方法

### 1. 環境セットアップ

```bash
# 仮想環境作成（推奨）
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係インストール
pip install fastmcp requests beautifulsoup4 textblob feedparser
```

### 2. サーバー起動

#### STDIOモード（デフォルト）
```bash
python main.py
# または
fastmcp run main.py
```

#### HTTPモード
```bash
fastmcp run main.py --transport streamable-http --port 8000
```

#### SSEモード
```bash
fastmcp run main.py --transport sse --port 8000 --host 0.0.0.0
```

#### 開発モード（最も簡単）
```bash
fastmcp dev main.py
```

### 3. テスト実行

#### 基本テスト
```bash
python test_client.py
```

## 📁 プロジェクト構造

```
04-smart-analyzer/
├── main.py              # メインサーバー
├── database.py          # データベース管理
├── web_scraper.py       # Web情報収集
├── text_analyzer.py     # テキスト分析
├── test_client.py       # テスト用クライアント
├── config.toml         # 設定ファイル
├── README.md           # このファイル
└── data/               # データファイル
    ├── analysis.db     # 分析結果DB（自動作成）
    └── reports/        # 生成レポート（自動作成）
```

## ⚙️ 設定

`config.toml`でシステムの設定をカスタマイズできます：

- **サーバー設定**: 名前、バージョン、説明
- **スクレイピング設定**: タイムアウト、レート制限
- **分析設定**: 感情分析、キーワード抽出の有効化
- **データベース設定**: パス、バックアップ間隔
- **レポート設定**: 出力ディレクトリ、フォーマット

## 🧪 使用例

### 基本的な分析
```python
# 単一URL分析
result = await client.call_tool("scrape_and_analyze", {
    "url": "https://example.com"
})

# 複数URL一括分析
urls = ["https://site1.com", "https://site2.com"]
result = await client.call_tool("batch_analyze_urls", {"urls": urls})
```

### 検索・レポート
```python
# 感情ラベルで検索
result = await client.call_tool("search_by_sentiment", {
    "sentiment_label": "positive"
})

# サマリーレポート生成
result = await client.call_tool("generate_summary_report")
```

### RSS分析（応用）
```python
# RSSフィード分析
result = await client.call_tool("analyze_rss_feed", {
    "rss_url": "https://feeds.example.com/rss.xml",
    "max_items": 10
})
```

## 📊 データベース構造

### urlsテーブル
- URL情報、タイトル、コンテンツ、スクレイピング日時

### analysesテーブル
- 感情スコア、感情ラベル、キーワード、単語数、分析日時

### reportsテーブル
- レポート名、説明、データ、ファイルパス、作成日時

## 🔧 トラブルシューティング

### よくあるエラー

1. **依存関係のエラー**
   ```bash
   pip install requests beautifulsoup4 textblob
   ```

2. **TextBlobが使えない場合**
   - 簡易感情分析に自動的にフォールバック

3. **feedparserが必要**
   ```bash
   pip install feedparser  # RSS分析用
   ```

## 🎯 応用アイデア

- **マーケティング調査**: 競合サイトの分析
- **ソーシャルメディア監視**: ブランド言及の感情分析
- **ニュース分析**: 特定トピックの感情変化追跡
- **SEO分析**: コンテンツの品質評価

## 📚 関連リンク

- [FastMCP公式ドキュメント](https://gofastmcp.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [チュートリアル4: 実践応用](../../tutorials/04-practical-usage.md)

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

---

💡 **ヒント**: このシステムは実際のビジネス分析や調査に活用できます！ 
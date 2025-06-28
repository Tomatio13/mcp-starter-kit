# Smart Information Analyzer MCP Server - TypeScript版

FastMCPを使用したスマート情報収集&分析システム（TypeScript版）

## 📋 概要

このプロジェクトは、FastMCPフレームワークを使用してTypeScriptで構築された高機能なWeb情報収集・分析MCPサーバーです。Webスクレイピング、感情分析、キーワード抽出、テキスト統計などの包括的な分析機能を提供します。

## 🛠 機能

### 実装済みツール

1. **scrape_and_analyze** - URLを取得して分析する（統合処理）
2. **batch_analyze_urls** - 複数URLを一括分析（最大10件）
3. **get_analysis_history** - 分析履歴を取得
4. **search_by_sentiment** - 感情ラベルで検索
5. **get_keyword_analysis** - キーワード分析
6. **generate_summary_report** - サマリーレポート生成
7. **analyze_rss_feed** - RSSフィード分析（応用例）
8. **get_server_info** - サーバーの情報を取得

### 分析機能

#### Web スクレイピング
- **Cheerio** による高速HTMLパース
- **Axios** によるHTTPリクエスト処理
- タイトル・本文の自動抽出
- 不要要素の自動除去（script, style, nav, footer等）
- リンク抽出機能

#### テキスト分析
- **感情分析**: Sentiment.jsライブラリによる高精度な感情スコア計算
- **キーワード抽出**: Natural.jsによる語幹抽出とストップワード除去
- **テキスト統計**: 単語数、文数、平均語長などの統計情報
- **多言語対応**: 英語テキストの高精度分析

#### データ永続化
- **SQLite** による軽量で高速なデータ保存
- **分析履歴管理**: URL、分析結果、統計情報の一元管理
- **レポート機能**: 分析結果のJSON形式保存

## 📦 セットアップ

### 必要な環境
- Node.js 18以降
- npm または yarn

### インストール

```bash
# 依存関係をインストール
npm install

# TypeScriptをビルド
npm run build
```

## 🚀 使用方法

### サーバー起動

```bash
# 開発モード（TypeScript直接実行）
npm run dev

# 本番モード（ビルド後実行）
npm start
```

### テストクライアント

```bash
# テストクライアントを起動
npx tsx test-client.ts
```

### 利用可能なコマンド

テストクライアント内で以下のコマンドが使用できます：

#### 基本分析
- `analyze <URL>` - 単一URL分析
- `batch <URL1> <URL2> ...` - 複数URL一括分析（最大10件）
- `history [件数]` - 分析履歴表示（デフォルト10件）

#### 検索・分析
- `sentiment <positive|negative|neutral>` - 感情別検索
- `keywords [最小頻度]` - キーワード分析（デフォルト0.01）
- `report` - サマリーレポート生成

#### 応用機能
- `rss <RSS_URL> [記事数]` - RSSフィード分析（最大20件）
- `info` - サーバー情報表示

## ⚙️ 設定

`config.json`ファイルでサーバーの設定をカスタマイズできます：

```json
{
  "server": {
    "name": "Smart Information Analyzer - TypeScript",
    "version": "1.0.0",
    "description": "スマート情報収集&分析システム - TypeScript版",
    "author": "あなたの名前"
  },
  "database": {
    "path": "data/analysis.db"
  },
  "transport": {
    "default": "stdio",
    "http_host": "127.0.0.1",
    "http_port": 8000
  }
}
```

## 📊 データベーススキーマ

### urls テーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | INTEGER PRIMARY KEY | URL ID（自動生成） |
| url | TEXT UNIQUE | 分析対象URL |
| title | TEXT | ページタイトル |
| content | TEXT | 取得したテキストコンテンツ |
| scraped_at | TIMESTAMP | スクレイピング日時 |
| status | TEXT | ステータス（pending/scraped/failed） |

### analyses テーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | INTEGER PRIMARY KEY | 分析ID（自動生成） |
| url_id | INTEGER | URL ID（外部キー） |
| sentiment_score | REAL | 感情スコア（-1.0〜1.0） |
| sentiment_label | TEXT | 感情ラベル（positive/negative/neutral） |
| keywords | TEXT | キーワードリスト（JSON形式） |
| word_count | INTEGER | 単語数 |
| analyzed_at | TIMESTAMP | 分析日時 |

### reports テーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | INTEGER PRIMARY KEY | レポートID（自動生成） |
| name | TEXT | レポート名 |
| description | TEXT | レポート説明 |
| data | TEXT | レポートデータ（JSON形式） |
| file_path | TEXT | ファイルパス |
| created_at | TIMESTAMP | 作成日時 |

## 🔧 開発

### ファイル構成

```
07-smart-analyzer-ts/
├── server.ts          # メインサーバーファイル
├── database.ts        # データベース管理クラス
├── web-scraper.ts     # Webスクレイピングモジュール
├── text-analyzer.ts   # テキスト分析モジュール
├── test-client.ts     # テストクライアント
├── config.json        # 設定ファイル
├── package.json       # プロジェクト設定
├── tsconfig.json      # TypeScript設定
├── data/              # データディレクトリ
│   └── analysis.db    # SQLiteデータベース（自動生成）
└── README.md          # このファイル
```

### TypeScriptの特徴

- **モジュラー設計**: 各機能を独立したモジュールとして実装
- **厳密な型定義**: 全てのデータ構造とAPIの型安全性
- **非同期処理**: Promise/async-awaitパターンの完全採用
- **エラーハンドリング**: 包括的な例外処理とフォールバック機能
- **リソース管理**: 適切なデータベース接続管理とクリーンアップ

### 使用ライブラリ

- **FastMCP**: MCPサーバーフレームワーク
- **Zod**: スキーマバリデーション
- **Cheerio**: サーバーサイドHTMLパーサー
- **Axios**: HTTPクライアント
- **Sentiment**: 感情分析ライブラリ
- **Natural**: 自然言語処理ライブラリ
- **SQLite3**: データベースドライバー

## 📝 使用例

### 基本的な分析フロー

```bash
# 1. 単一URLの分析
analyze https://example.com/article

# 2. 複数URLの一括分析
batch https://news1.com https://news2.com https://blog.example.com

# 3. ポジティブな記事を検索
sentiment positive

# 4. 頻繁に出現するキーワードを分析
keywords 0.02

# 5. 全体のサマリーレポート生成
report
```

### API呼び出し例

```typescript
// 単一URL分析
{
  "name": "scrape_and_analyze",
  "arguments": {
    "url": "https://example.com/article"
  }
}

// 感情別検索
{
  "name": "search_by_sentiment",
  "arguments": {
    "sentiment_label": "positive"
  }
}

// キーワード分析
{
  "name": "get_keyword_analysis",
  "arguments": {
    "min_frequency": 0.02
  }
}
```

### 分析結果の例

```json
{
  "success": true,
  "url": "https://example.com",
  "title": "Example Article",
  "sentiment": {
    "score": 0.3,
    "label": "positive",
    "method": "sentiment-js"
  },
  "top_keywords": [
    {"word": "technolog", "count": 15, "frequency": 0.05},
    {"word": "innov", "count": 12, "frequency": 0.04}
  ],
  "statistics": {
    "word_count": 300,
    "sentence_count": 20,
    "character_count": 1500
  }
}
```

## 🐛 トラブルシューティング

### よくある問題

1. **スクレイピングエラー**: 
   - User-Agentの設定を確認
   - タイムアウト設定を調整（デフォルト10秒）
   - HTTPSサイトの証明書エラー

2. **分析精度の問題**:
   - 英語以外のテキストの分析精度が低下する可能性
   - 短いテキストでは統計的な信頼性が低下
   - HTMLタグの除去が不完全な場合

3. **データベースエラー**:
   - ディスク容量不足
   - 同時アクセスによるロック
   - 不正なUTF-8文字の混入

4. **メモリ使用量**:
   - 大量のテキスト処理時にメモリ不足
   - 一括処理時のメモリリーク

### デバッグ方法

```bash
# データベースの内容を直接確認
sqlite3 data/analysis.db ".tables"
sqlite3 data/analysis.db "SELECT * FROM analyses ORDER BY analyzed_at DESC LIMIT 5;"

# 詳細なログ出力
DEBUG=* npm run dev

# 個別モジュールのテスト
npx tsx -e "import {scraper} from './web-scraper.js'; console.log(await scraper.scrapeUrl('https://example.com'));"
```

## 📚 参考資料

- [FastMCP Documentation](https://github.com/punkpeye/fastmcp)
- [Cheerio Documentation](https://cheerio.js.org/)
- [Sentiment.js](https://github.com/thisandagain/sentiment)
- [Natural.js](https://github.com/NaturalNode/natural)
- [Axios Documentation](https://axios-http.com/)

## 🤝 貢献

このプロジェクトへの貢献を歓迎します！以下の方法で貢献できます：

- バグ報告・修正
- 新機能の追加（他言語対応、新しい分析手法等）
- ドキュメント改善
- パフォーマンス最適化
- テストケース追加

## 📄 ライセンス

MIT License

## 🔮 今後の拡張予定

- 多言語感情分析対応
- 画像・動画コンテンツ分析
- リアルタイムストリーミング分析
- 機械学習による高度な分類
- 可視化ダッシュボード機能
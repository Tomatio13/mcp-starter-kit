# Task Manager MCP Server - TypeScript版

FastMCPを使用したタスク管理MCPサーバー（TypeScript版）

## 📋 概要

このプロジェクトは、FastMCPフレームワークとSQLiteデータベースを使用してTypeScriptで構築された高機能なタスク管理MCPサーバーです。タスクの作成、更新、削除、検索、統計、カテゴリ管理などの包括的な機能を提供します。

## 🛠 機能

### 実装済みツール

1. **create_task** - 新しいタスクを作成する
2. **get_tasks** - タスク一覧を取得する（ステータス/件数フィルタ対応）
3. **update_task_status** - タスクのステータスを更新する
4. **delete_task** - タスクを削除する
5. **search_tasks** - タスクを検索する（タイトル/説明対象）
6. **get_task_statistics** - タスクの統計情報を取得する
7. **create_category** - 新しいカテゴリを作成する
8. **get_categories** - カテゴリ一覧を取得する
9. **assign_category_to_task** - タスクにカテゴリを割り当てる
10. **backup_database** - データベースをバックアップする
11. **export_tasks_to_json** - タスクをJSONファイルにエクスポートする
12. **get_server_info** - サーバーの情報を取得する

### データベース機能

- **SQLite** による軽量で高速なデータ永続化
- **外部キー制約** によるデータ整合性保証
- **自動タイムスタンプ** 管理（作成日時/更新日時）
- **カテゴリ管理** によるタスク分類
- **多対多リレーション** 対応（タスク⇔カテゴリ）

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

#### 基本操作
- `create <タイトル> [説明] [優先度]` - タスク作成
- `list [ステータス] [件数]` - タスク一覧
- `update <ID> <ステータス>` - タスクステータス更新
- `delete <ID>` - タスク削除
- `search <キーワード>` - タスク検索

#### 統計・管理
- `stats` - 統計情報
- `backup [パス]` - データベースバックアップ
- `export [パス]` - JSONエクスポート
- `info` - サーバー情報

#### カテゴリ管理
- `category-create <名前> [色]` - カテゴリ作成
- `categories` - カテゴリ一覧
- `assign <タスクID> <カテゴリID>` - カテゴリ割り当て

## ⚙️ 設定

`config.json`ファイルでサーバーの設定をカスタマイズできます：

```json
{
  "server": {
    "name": "Task Manager - TypeScript",
    "version": "1.0.0",
    "description": "SQLiteを使用したタスク管理MCPサーバー - TypeScript版",
    "author": "あなたの名前"
  },
  "database": {
    "path": "tasks.db"
  },
  "transport": {
    "default": "stdio",
    "http_host": "127.0.0.1",
    "http_port": 8000
  }
}
```

## 📊 データベーススキーマ

### tasks テーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | INTEGER PRIMARY KEY | タスクID（自動生成） |
| title | TEXT NOT NULL | タスクタイトル |
| description | TEXT | タスク説明 |
| status | TEXT | ステータス（pending/completed/cancelled） |
| priority | INTEGER | 優先度（1-5） |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

### categories テーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | INTEGER PRIMARY KEY | カテゴリID（自動生成） |
| name | TEXT UNIQUE | カテゴリ名 |
| color | TEXT | カテゴリ色（HEX形式） |
| created_at | TIMESTAMP | 作成日時 |

### task_categories テーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| task_id | INTEGER | タスクID（外部キー） |
| category_id | INTEGER | カテゴリID（外部キー） |

## 🔧 開発

### ファイル構成

```
06-task-manager-ts/
├── server.ts          # メインサーバーファイル
├── database.ts        # データベース管理クラス
├── test-client.ts     # テストクライアント
├── config.json        # 設定ファイル
├── package.json       # プロジェクト設定
├── tsconfig.json      # TypeScript設定
├── tasks.db           # SQLiteデータベース（自動生成）
└── README.md          # このファイル
```

### TypeScriptの特徴

- **厳密な型定義**: データベースエンティティの完全な型安全性
- **Zodバリデーション**: ツール引数の実行時検証
- **非同期データベース操作**: Promise/async-awaitパターン
- **適切なエラーハンドリング**: try-catch文による例外処理
- **リソース管理**: プロセス終了時のデータベース接続クリーンアップ

## 📝 使用例

### タスク管理フロー

```bash
# 1. タスク作成
create "プロジェクト企画書作成" "来週の会議用資料" 5

# 2. カテゴリ作成
category-create "仕事" "#ff6b6b"

# 3. カテゴリ割り当て
assign 1 1

# 4. タスク一覧確認
list pending 5

# 5. タスク完了
update 1 completed

# 6. 統計確認
stats
```

### API呼び出し例

```typescript
// タスク作成
{
  "name": "create_task",
  "arguments": {
    "title": "新しいタスク",
    "description": "詳細な説明",
    "priority": 3
  }
}

// タスク検索
{
  "name": "search_tasks", 
  "arguments": {
    "keyword": "プロジェクト"
  }
}
```

## 🐛 トラブルシューティング

### よくある問題

1. **データベースロックエラー**: 複数のクライアントが同時にアクセスしている場合、少し待ってから再試行
2. **外部キー制約エラー**: 存在しないタスクIDやカテゴリIDを指定していないか確認
3. **型エラー**: Zodスキーマに適合しない引数を渡していないか確認
4. **ポート競合**: HTTP使用時、指定ポートが利用可能か確認

### デバッグ方法

```bash
# データベースの内容を直接確認
sqlite3 tasks.db ".tables"
sqlite3 tasks.db "SELECT * FROM tasks;"

# ログレベルを上げて詳細な情報を取得
DEBUG=* npm run dev
```

## 📚 参考資料

- [FastMCP Documentation](https://github.com/punkpeye/fastmcp)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Node.js sqlite3 Package](https://github.com/TryGhost/node-sqlite3)
- [Zod Schema Validation](https://zod.dev/)

## 🤝 貢献

このプロジェクトへの貢献を歓迎します！以下の方法で貢献できます：

- バグ報告
- 機能要求
- プルリクエスト
- ドキュメント改善

## 📄 ライセンス

MIT License
# Hello World MCP Server - TypeScript版

FastMCPを使用した初学者向けのMCPサーバーサンプル（TypeScript版）

## 📋 概要

このプロジェクトは、FastMCPフレームワークを使用してTypeScriptで構築されたシンプルなMCPサーバーです。基本的なツール実装とMCPプロトコルの理解を目的としています。

## 🛠 機能

### 実装済みツール

1. **say_hello** - 指定された名前に挨拶する
2. **add_numbers** - 2つの数値を足し算する  
3. **get_server_info** - サーバーの情報を取得する
4. **calculate_age** - 生年から年齢を計算する
5. **format_text** - テキストを様々な形式でフォーマットする
6. **safe_divide** - 安全な除算を行う（ゼロ除算対応）

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

- `1` または `tools/list` - ツール一覧を取得
- `hello <名前>` - 挨拶ツールのテスト
- `add <数値1> <数値2>` - 足し算ツールのテスト
- `info` - サーバー情報取得
- `age <生年>` - 年齢計算
- `format <テキスト> [スタイル]` - テキストフォーマット
- `divide <被除数> <除数>` - 安全な除算
- `quit` - 終了

## ⚙️ 設定

`config.json`ファイルでサーバーの設定をカスタマイズできます：

```json
{
  "server": {
    "name": "Hello World Server - TypeScript",
    "version": "1.0.0",
    "description": "初学者向けのMCPサーバーサンプル - TypeScript版",
    "author": "あなたの名前"
  },
  "transport": {
    "default": "stdio",
    "http_host": "127.0.0.1", 
    "http_port": 8000
  }
}
```

### トランスポート設定

- `"stdio"` - 標準入出力を使用（デフォルト）
- `"http"` - HTTPストリーミングを使用

## 🔧 開発

### ファイル構成

```
05-hello-world-ts/
├── server.ts          # メインサーバーファイル
├── test-client.ts     # テストクライアント
├── config.json        # 設定ファイル
├── package.json       # プロジェクト設定
├── tsconfig.json      # TypeScript設定
└── README.md          # このファイル
```

### TypeScriptの特徴

- **型安全性**: Zodスキーマによる厳密な型検証
- **非同期処理**: async/awaitパターンの使用
- **モジュールシステム**: ES Modulesの採用
- **エラーハンドリング**: try-catch文による適切なエラー処理

## 📝 使用例

### 基本的なツール呼び出し

```typescript
// 挨拶ツール
{
  "name": "say_hello",
  "arguments": { "name": "太郎" }
}
// 結果: "こんにちは、太郎さん！FastMCPへようこそ 🎉"

// 計算ツール
{
  "name": "add_numbers", 
  "arguments": { "a": 10, "b": 20 }
}
// 結果: 30
```

## 🐛 トラブルシューティング

### よくある問題

1. **型エラー**: TypeScriptの型チェックが厳密なため、引数の型を確認してください
2. **モジュールエラー**: `package.json`の`"type": "module"`設定を確認してください
3. **ポート競合**: HTTP使用時、ポート8000が使用可能か確認してください

## 📚 参考資料

- [FastMCP Documentation](https://github.com/punkpeye/fastmcp)
- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Zod Schema Validation](https://zod.dev/)

## 🤝 貢献

このプロジェクトへの貢献を歓迎します！バグ報告、機能要求、プルリクエストをお待ちしています。

## 📄 ライセンス

MIT License
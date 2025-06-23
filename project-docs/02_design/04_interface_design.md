---
title: "インターフェース設計書"
version: "1.0"
last_updated: "2025-06-23"
author: "mcp starter"
reviewers: []
related_docs:
  - "01_system_architecture.md"
  - "02_application_design.md"
  - "../01_requirements/03_functional_requirements.md"
  - "../03_development/01_development_standards.md"
  - "../03_development/02_test_specifications.md"
status: "draft"
dependencies:
  upstream:
    - "01_system_architecture.md"
    - "02_application_design.md" 
    - "../01_requirements/03_functional_requirements.md"
  downstream:
    - "../03_development/01_development_standards.md"
    - "../03_development/02_test_specifications.md"
---

# インターフェース設計書

## 1. 概要
FastMCPスターターキットのインターフェース設計は、MCPプロトコルに準拠したSSE（Server-Sent Events）とSTDIO（標準入出力）の両方の通信方式をサポートします。Claude、VS Code、その他のMCPクライアントと互換性を持ち、初学者でも理解しやすい統一的なインターフェースを提供します。

### 1.1 設計原則
- **プロトコル準拠**: MCP仕様完全準拠
- **透過性**: SSE/STDIO両方で同一機能
- **互換性**: 既存MCPクライアントとの完全互換
- **学習容易性**: 理解しやすいインターフェース設計

## 2. MCP通信プロトコル
### 2.1 基本通信仕様
| 項目 | SSE | STDIO |
|------|-----|--------|
| 通信方式 | HTTP/SSE | 標準入出力 |
| データ形式 | JSON-RPC 2.0 | JSON-RPC 2.0 |
| 文字エンコーディング | UTF-8 | UTF-8 |
| エラー処理 | HTTP Status + JSON-RPC | JSON-RPC Error |

### 2.2 SSE通信インターフェース
#### 2.2.1 エンドポイント仕様
```
基本URL: http://127.0.0.1:8000
接続エンドポイント: /mcp/sse
ヘルスチェック: /health
メトリクス: /metrics
```

#### 2.2.2 SSE接続フロー
```
1. Client → Server: GET /mcp/sse
   Headers: 
     Accept: text/event-stream
     Cache-Control: no-cache

2. Server → Client: HTTP 200 OK
   Headers:
     Content-Type: text/event-stream
     Connection: keep-alive
     Cache-Control: no-cache

3. Server → Client: SSE Messages
   data: {"jsonrpc": "2.0", "method": "initialize", ...}

4. Client → Server: POST /mcp/sse
   Content-Type: application/json
   Body: {"jsonrpc": "2.0", "method": "tools/list", ...}
```

#### 2.2.3 SSE メッセージ形式
```javascript
// サーバから送信される SSE メッセージ
event: message
data: {"jsonrpc": "2.0", "method": "notifications/message", "params": {...}}

event: error  
data: {"jsonrpc": "2.0", "error": {"code": -32000, "message": "Server error"}}

event: heartbeat
data: {"timestamp": "2025-06-23T18:44:45Z"}
```

### 2.3 STDIO通信インターフェース
#### 2.3.1 起動方法
```bash
# 基本起動
python -m fastmcp_starter --transport stdio

# 設定指定起動
python -m fastmcp_starter --transport stdio --config /path/to/config.toml

# デバッグモード起動
python -m fastmcp_starter --transport stdio --debug
```

#### 2.3.2 STDIO メッセージフロー
```
1. 初期化
Client → Server (stdin): {"jsonrpc": "2.0", "method": "initialize", "id": 1}
Server → Client (stdout): {"jsonrpc": "2.0", "result": {...}, "id": 1}

2. 機能利用
Client → Server (stdin): {"jsonrpc": "2.0", "method": "tools/list", "id": 2}
Server → Client (stdout): {"jsonrpc": "2.0", "result": {"tools": [...]}, "id": 2}

3. 通知送信
Server → Client (stdout): {"jsonrpc": "2.0", "method": "notifications/message", "params": {...}}
```

## 3. MCP API仕様
### 3.1 初期化 API
#### 3.1.1 initialize
```json
// Request
{
  "jsonrpc": "2.0",
  "method": "initialize", 
  "id": 1,
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "roots": {
        "listChanged": true
      }
    },
    "clientInfo": {
      "name": "Claude",
      "version": "1.0.0"
    }
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {},
      "resources": {},
      "prompts": {},
      "logging": {}
    },
    "serverInfo": {
      "name": "FastMCP Starter Kit",
      "version": "1.0.0"
    }
  }
}
```

#### 3.1.2 initialized
```json
// Notification (Client → Server)
{
  "jsonrpc": "2.0",
  "method": "initialized"
}
```

### 3.2 Tools API
#### 3.2.1 tools/list
```json
// Request
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 2
}

// Response
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "create_file",
        "description": "ファイルを作成します",
        "inputSchema": {
          "type": "object",
          "properties": {
            "path": {
              "type": "string",
              "description": "作成するファイルのパス"
            },
            "content": {
              "type": "string", 
              "description": "ファイルの内容"
            }
          },
          "required": ["path", "content"]
        }
      },
      {
        "name": "read_file",
        "description": "ファイルを読み込みます",
        "inputSchema": {
          "type": "object",
          "properties": {
            "path": {
              "type": "string",
              "description": "読み込むファイルのパス"
            }
          },
          "required": ["path"]
        }
      }
    ]
  }
}
```

#### 3.2.2 tools/call
```json
// Request
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "id": 3,
  "params": {
    "name": "create_file",
    "arguments": {
      "path": "/tmp/hello.txt",
      "content": "Hello, FastMCP!"
    }
  }
}

// Response (成功)
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "ファイル '/tmp/hello.txt' を正常に作成しました。"
      }
    ]
  }
}

// Response (エラー)
{
  "jsonrpc": "2.0",
  "id": 3,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "details": "ファイルパスが無効です: /tmp/hello.txt"
    }
  }
}
```

### 3.3 Resources API
#### 3.3.1 resources/list
```json
// Request
{
  "jsonrpc": "2.0",
  "method": "resources/list",
  "id": 4
}

// Response
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "resources": [
      {
        "uri": "tutorial://basic-tutorial",
        "name": "MCPサーバ基礎チュートリアル",
        "description": "MCPサーバの基本的な作成方法を学習します",
        "mimeType": "text/markdown"
      },
      {
        "uri": "sample://file-manager",
        "name": "ファイル管理サンプル",
        "description": "ファイル操作ツールのサンプルプロジェクト",
        "mimeType": "application/json"
      }
    ]
  }
}
```

#### 3.3.2 resources/read
```json
// Request
{
  "jsonrpc": "2.0",
  "method": "resources/read",
  "id": 5,
  "params": {
    "uri": "tutorial://basic-tutorial"
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "contents": [
      {
        "uri": "tutorial://basic-tutorial",
        "mimeType": "text/markdown",
        "text": "# MCPサーバ基礎チュートリアル\n\n## 1. MCPとは\n..."
      }
    ]
  }
}
```

### 3.4 Prompts API
#### 3.4.1 prompts/list
```json
// Request
{
  "jsonrpc": "2.0",
  "method": "prompts/list",
  "id": 6
}

// Response
{
  "jsonrpc": "2.0",
  "id": 6,
  "result": {
    "prompts": [
      {
        "name": "mcp_server_template",
        "description": "MCPサーバの基本的なテンプレートを生成します",
        "arguments": [
          {
            "name": "server_name",
            "description": "サーバ名",
            "required": true
          },
          {
            "name": "tools",
            "description": "実装するツール名のリスト",
            "required": false
          }
        ]
      }
    ]
  }
}
```

#### 3.4.2 prompts/get
```json
// Request
{
  "jsonrpc": "2.0",
  "method": "prompts/get",
  "id": 7,
  "params": {
    "name": "mcp_server_template",
    "arguments": {
      "server_name": "my_server",
      "tools": ["file_read", "file_write"]
    }
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "description": "MCPサーバテンプレート: my_server",
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "以下の仕様でMCPサーバを作成してください:\n\nサーバ名: my_server\n実装ツール: file_read, file_write\n\n..."
        }
      }
    ]
  }
}
```

## 4. Learning System API
### 4.1 チュートリアル管理 API
#### 4.1.1 tutorial/list
```json
// Request (Tool Call)
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "id": 8,
  "params": {
    "name": "tutorial_list",
    "arguments": {}
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 8,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "利用可能なチュートリアル:\n\n1. basic-tutorial (基礎編) - 15分\n2. file-tools-tutorial (実践編) - 30分\n3. async-tutorial (応用編) - 60分"
      }
    ]
  }
}
```

#### 4.1.2 tutorial/start
```json
// Request (Tool Call)
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "id": 9,
  "params": {
    "name": "tutorial_start",
    "arguments": {
      "tutorial_id": "basic-tutorial"
    }
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 9,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "チュートリアル「MCPサーバ基礎」を開始しました。\n\nステップ1/5: MCPとは何か\n\n# MCPとは\n\nMCP (Model Context Protocol) は..."
      }
    ]
  }
}
```

### 4.2 プロジェクト管理 API
#### 4.2.1 project/create
```json
// Request (Tool Call)
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "id": 10,
  "params": {
    "name": "project_create",
    "arguments": {
      "name": "my_file_manager",
      "template": "file-tools",
      "description": "ファイル管理用MCPサーバ"
    }
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 10,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "プロジェクト 'my_file_manager' を作成しました。\n\n作成されたファイル:\n- server.py\n- requirements.txt\n- README.md\n- config.toml"
      }
    ]
  }
}
```

## 5. エラー処理仕様
### 5.1 JSON-RPC エラーコード
| コード | 名前 | 説明 | 使用場面 |
|--------|------|------|----------|
| -32700 | Parse error | JSONパースエラー | 不正なJSON |
| -32600 | Invalid Request | 無効なリクエスト | JSON-RPC形式エラー |
| -32601 | Method not found | メソッド未実装 | 未サポートメソッド |
| -32602 | Invalid params | パラメータエラー | 引数不正 |
| -32603 | Internal error | 内部エラー | サーバ側エラー |
| -32000 | Server error | カスタムエラー | アプリ固有エラー |

### 5.2 エラーレスポンス例
```json
// ファイルアクセスエラー
{
  "jsonrpc": "2.0",
  "id": 11,
  "error": {
    "code": -32000,
    "message": "File access denied",
    "data": {
      "error_type": "permission_error",
      "file_path": "/etc/passwd",
      "suggestion": "ユーザーディレクトリ内のファイルのみアクセス可能です"
    }
  }
}

// バリデーションエラー
{
  "jsonrpc": "2.0",
  "id": 12,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "validation_errors": [
        {
          "field": "path",
          "message": "ファイルパスは必須です"
        },
        {
          "field": "content",
          "message": "コンテンツは空にできません"
        }
      ]
    }
  }
}
```

## 6. 認証・認可
### 6.1 認証方式
- **SSE**: ローカル接続のみ（127.0.0.1バインド）
- **STDIO**: プロセス権限ベース

### 6.2 セキュリティ制限
```json
// セキュリティエラー例
{
  "jsonrpc": "2.0",
  "id": 13,
  "error": {
    "code": -32000,
    "message": "Security violation",
    "data": {
      "violation_type": "path_traversal",
      "attempted_path": "../../../etc/passwd",
      "reason": "ユーザーディレクトリ外へのアクセスは禁止されています"
    }
  }
}
```

## 7. パフォーマンス仕様
### 7.1 応答時間要件
| 操作種別 | 目標応答時間 | 最大応答時間 |
|----------|--------------|--------------|
| tools/list | 100ms | 500ms |
| resources/list | 200ms | 1000ms |
| prompts/list | 100ms | 500ms |
| tools/call (軽量) | 500ms | 2000ms |
| tools/call (重量) | 2000ms | 10000ms |

### 7.2 ストリーミング対応
```json
// 長時間実行ツールの進捗通知
{
  "jsonrpc": "2.0",
  "method": "notifications/progress", 
  "params": {
    "token": "task-123",
    "value": {
      "kind": "report",
      "message": "ファイル処理中... (50/100)"
    }
  }
}
```

## 8. 接続管理
### 8.1 SSE 接続管理
- **接続タイムアウト**: 30分
- **ハートビート間隔**: 30秒
- **再接続**: 自動リトライ（指数バックオフ）

### 8.2 STDIO 接続管理
- **プロセス生存期間**: クライアント依存
- **バッファサイズ**: 64KB
- **エラー時動作**: プロセス終了

## 9. 互換性仕様
### 9.1 対応クライアント
| クライアント | SSE対応 | STDIO対応 | 検証状況 |
|--------------|---------|-----------|----------|
| Claude | ○ | ○ | 完全対応 |
| VS Code | ○ | ○ | 完全対応 |
| Cursor | ○ | ○ | 動作確認済み |
| Zed | ○ | ○ | 基本動作確認 |

### 9.2 プロトコルバージョン
- **対応バージョン**: 2024-11-05
- **下位互換性**: なし（最新版のみ）
- **アップグレード**: 自動対応

## 10. 承認
| 項目 | 氏名 | 承認日 |
|------|------|--------|
| 作成者 | mcp starter | 2025-06-23 |
| 承認者 | - | - |

## 更新履歴
| バージョン | 更新日 | 更新者 | 更新内容 | 影響ドキュメント |
|---|---|---|---|---|
| 1.0 | 2025-06-23 | mcp starter | FastMCPスターターキット向けインターフェース設計初版作成 | - | 
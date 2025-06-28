---
title: "チュートリアル6: Hello World ツールを作ろう（TypeScript版） 🎯"
version: "1.0"
last_updated: "2025-06-28"
author: "mcp starter"
reviewers: []
related_docs: ["02-hello-world.md", "03-data-handling.md"]
status: "approved"
---

# チュートリアル6: Hello World ツールを作ろう（TypeScript版） 🎯

**所要時間: 25分**  
**前提知識: TypeScriptの基本的な知識、[チュートリアル2](02-hello-world.md)を参考にしてください**

## 🎯 今回の目標

- TypeScriptで初めてのMCPツールを作成
- FastMCPのTypeScript版の基本的な使い方をマスター
- Zodスキーマによる型安全なツール実装
- STDIO/HTTPでテスト実行

## 📝 ステップ1: 環境準備

### プロジェクトディレクトリ作成
```bash
mkdir my-first-mcp-ts
cd my-first-mcp-ts
```

### Node.js環境初期化
```bash
# package.json作成
npm init -y

# 必要なパッケージをインストール
npm install fastmcp zod
npm install -D typescript tsx @types/node

# TypeScript設定ファイル作成
npx tsc --init
```

### package.jsonの設定
```json
{
  "name": "my-first-mcp-ts",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "tsx test-client.ts"
  },
  "dependencies": {
    "fastmcp": "^latest",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^latest",
    "tsx": "^latest",
    "typescript": "^latest"
  }
}
```

## 🏗️ ステップ2: Hello Worldサーバー作成

### ファイル作成: `server.ts`
```typescript
/**
 * 私の初めてのMCPサーバー
 * FastMCPを使ったHello Worldの例 - TypeScript版
 */
import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

// 設定ファイルの型定義
interface Config {
  server?: {
    name?: string;
    version?: string;
    description?: string;
    author?: string;
  };
  transport?: {
    default?: string;
    http_host?: string;
    http_port?: number;
  };
}

// 設定読み込み
async function loadConfig(): Promise<Config> {
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch {
    return {};
  }
}

// サーバー初期化
const config = await loadConfig();
const server = new FastMCP({
  name: config.server?.name || "Hello World Server",
  version: "1.0.0" as `${number}.${number}.${number}`
});

// ツール1: 挨拶ツール
server.addTool({
  name: "say_hello",
  description: "指定された名前に挨拶する",
  parameters: z.object({
    name: z.string().describe("挨拶する相手の名前")
  }),
  execute: async (args) => {
    return `こんにちは、${args.name}さん！FastMCPへようこそ 🎉`;
  }
});

// ツール2: 数値計算ツール
server.addTool({
  name: "add_numbers",
  description: "2つの数値を足し算する",
  parameters: z.object({
    a: z.number().describe("1つ目の数値"),
    b: z.number().describe("2つ目の数値")
  }),
  execute: async (args) => {
    const result = args.a + args.b;
    return `計算結果: ${args.a} + ${args.b} = ${result}`;
  }
});

// ツール3: サーバー情報取得
server.addTool({
  name: "get_server_info",
  description: "サーバーの情報を取得する",
  parameters: z.object({}),
  execute: async () => {
    const serverConfig = config.server || {};
    const info = {
      server_name: serverConfig.name || "Hello World Server",
      version: serverConfig.version || "1.0.0",
      description: serverConfig.description || "初学者向けのMCPサーバーサンプル - TypeScript版",
      author: serverConfig.author || "あなたの名前",
      tools_count: 6,
      runtime: "Node.js",
      language: "TypeScript"
    };
    return JSON.stringify(info, null, 2);
  }
});

// ツール4: 年齢計算ツール
server.addTool({
  name: "calculate_age",
  description: "生年から年齢を計算する",
  parameters: z.object({
    birth_year: z.number().int().min(1900).max(new Date().getFullYear()).describe("生年（西暦）")
  }),
  execute: async (args) => {
    const currentYear = new Date().getFullYear();
    const age = currentYear - args.birth_year;
    
    const result = {
      birth_year: args.birth_year,
      current_year: currentYear,
      age: age,
      message: `${args.birth_year}年生まれの方は${age}歳です`
    };
    return JSON.stringify(result, null, 2);
  }
});

// ツール5: テキストフォーマットツール
server.addTool({
  name: "format_text",
  description: "テキストを様々な形式でフォーマットする",
  parameters: z.object({
    text: z.string().describe("フォーマットするテキスト"),
    style: z.enum(["upper", "lower", "title", "reverse"]).default("upper").describe("フォーマットスタイル")
  }),
  execute: async (args) => {
    switch (args.style) {
      case "upper":
        return args.text.toUpperCase();
      case "lower":
        return args.text.toLowerCase();
      case "title":
        return args.text.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      case "reverse":
        return args.text.split('').reverse().join('');
      default:
        return `未対応のスタイル: ${args.style}`;
    }
  }
});

// ツール6: 安全な除算ツール
server.addTool({
  name: "safe_divide",
  description: "安全な除算を行う",
  parameters: z.object({
    dividend: z.number().describe("被除数"),
    divisor: z.number().describe("除数")
  }),
  execute: async (args) => {
    try {
      if (args.divisor === 0) {
        const result = {
          success: false,
          error: "ゼロで割ることはできません",
          result: null
        };
        return JSON.stringify(result, null, 2);
      }
      
      const calcResult = args.dividend / args.divisor;
      const result = {
        success: true,
        error: null,
        result: calcResult,
        calculation: `${args.dividend} ÷ ${args.divisor} = ${calcResult}`
      };
      return JSON.stringify(result, null, 2);
    } catch (error) {
      const result = {
        success: false,
        error: `計算エラー: ${error instanceof Error ? error.message : String(error)}`,
        result: null
      };
      return JSON.stringify(result, null, 2);
    }
  }
});

// サーバー起動
async function startServer() {
  const transportConfig = config.transport || {};
  const defaultTransport = transportConfig.default || "stdio";
  
  try {
    if (defaultTransport === "stdio") {
      await server.start({
        transportType: "stdio"
      });
    } else if (defaultTransport === "http") {
      await server.start({
        transportType: "httpStream",
        httpStream: {
          endpoint: "/mcp",
          port: transportConfig.http_port || 8000
        }
      });
    } else {
      // デフォルトはstdio
      await server.start({
        transportType: "stdio"
      });
    }
  } catch (error) {
    console.error("サーバー起動エラー:", error);
    process.exit(1);
  }
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { server };
```

## 🚀 ステップ3: サーバー起動

### STDIOモードで起動（デフォルト）
```bash
# TypeScriptを直接実行
npm run dev

# または tsx を直接使用
npx tsx server.ts
```

起動すると以下のような表示が出ます：
```
Starting FastMCP server 'Hello World Server'
Transport: stdio
Waiting for messages...
```

### ビルドして実行
```bash
# TypeScriptをビルド
npm run build

# ビルドしたJavaScriptを実行
npm start
```

### HTTPモードで起動

設定ファイル `config.json` を作成：
```json
{
  "server": {
    "name": "Hello World Server - TypeScript",
    "version": "1.0.0",
    "description": "初学者向けのMCPサーバーサンプル - TypeScript版",
    "author": "あなたの名前"
  },
  "transport": {
    "default": "http",
    "http_host": "127.0.0.1",
    "http_port": 8000
  }
}
```

HTTPモードで起動：
```bash
npm run dev
```

起動すると：
```
Starting FastMCP server 'Hello World Server - TypeScript'
Transport: httpStream
Server running on http://127.0.0.1:8000/mcp
```

## 🧪 ステップ4: テスト実行

### テストクライアント作成: `test-client.ts`
```typescript
/**
 * MCPサーバーのテストクライアント - TypeScript版
 */
import { spawn } from 'child_process';
import readline from 'readline';

interface MCPRequest {
  id: number;
  method: string;
  params?: any;
}

interface MCPResponse {
  id?: number;
  result?: any;
  error?: any;
}

class MCPTestClient {
  private process: any;
  private requestId = 1;
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('🚀 MCPサーバーテストクライアント - TypeScript版');
    console.log('================================');
    
    // MCPサーバーを起動
    this.process = spawn('npx', ['tsx', 'server.ts'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.process.stdout.on('data', (data: Buffer) => {
      try {
        const response: MCPResponse = JSON.parse(data.toString());
        console.log('📦 応答:', JSON.stringify(response, null, 2));
      } catch (error) {
        console.log('📄 出力:', data.toString());
      }
    });

    this.process.stderr.on('data', (data: Buffer) => {
      console.error('❌ エラー:', data.toString());
    });

    this.process.on('close', (code: number) => {
      console.log(`🏁 サーバープロセス終了 (コード: ${code})`);
    });

    // 初期化
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: {
          listChanged: true
        },
        sampling: {}
      },
      clientInfo: {
        name: 'test-client-ts',
        version: '1.0.0'
      }
    });

    await this.sendRequest('initialized', {});

    // インタラクティブモード開始
    this.startInteractiveMode();
  }

  private async sendRequest(method: string, params?: any): Promise<void> {
    const request: MCPRequest = {
      id: this.requestId++,
      method: method,
      params: params
    };

    console.log('📤 送信:', JSON.stringify(request, null, 2));
    this.process.stdin.write(JSON.stringify(request) + '\n');
  }

  private startInteractiveMode() {
    console.log('\n📋 利用可能なコマンド:');
    console.log('1. tools/list - ツール一覧を取得');
    console.log('2. hello <名前> - 挨拶ツールのテスト');
    console.log('3. add <数値1> <数値2> - 足し算ツールのテスト');
    console.log('4. info - サーバー情報取得');
    console.log('5. age <生年> - 年齢計算');
    console.log('6. format <テキスト> [スタイル] - テキストフォーマット');
    console.log('7. divide <被除数> <除数> - 安全な除算');
    console.log('8. quit - 終了');
    console.log('');

    this.rl.prompt();
    this.rl.on('line', async (input: string) => {
      const args = input.trim().split(' ');
      const command = args[0];

      try {
        switch (command) {
          case '1':
          case 'tools/list':
            await this.sendRequest('tools/list', {});
            break;
            
          case '2':
          case 'hello':
            if (args.length < 2) {
              console.log('❌ 使用法: hello <名前>');
            } else {
              await this.sendRequest('tools/call', {
                name: 'say_hello',
                arguments: { name: args[1] }
              });
            }
            break;
            
          case '3':
          case 'add':
            if (args.length < 3) {
              console.log('❌ 使用法: add <数値1> <数値2>');
            } else {
              const a = parseFloat(args[1]);
              const b = parseFloat(args[2]);
              if (isNaN(a) || isNaN(b)) {
                console.log('❌ 数値を入力してください');
              } else {
                await this.sendRequest('tools/call', {
                  name: 'add_numbers',
                  arguments: { a, b }
                });
              }
            }
            break;
            
          case '4':
          case 'info':
            await this.sendRequest('tools/call', {
              name: 'get_server_info',
              arguments: {}
            });
            break;
            
          case '5':
          case 'age':
            if (args.length < 2) {
              console.log('❌ 使用法: age <生年>');
            } else {
              const birthYear = parseInt(args[1]);
              if (isNaN(birthYear)) {
                console.log('❌ 有効な年を入力してください');
              } else {
                await this.sendRequest('tools/call', {
                  name: 'calculate_age',
                  arguments: { birth_year: birthYear }
                });
              }
            }
            break;
            
          case '6':
          case 'format':
            if (args.length < 2) {
              console.log('❌ 使用法: format <テキスト> [スタイル]');
            } else {
              const text = args[1];
              const style = args[2] || 'upper';
              await this.sendRequest('tools/call', {
                name: 'format_text',
                arguments: { text, style }
              });
            }
            break;
            
          case '7':
          case 'divide':
            if (args.length < 3) {
              console.log('❌ 使用法: divide <被除数> <除数>');
            } else {
              const dividend = parseFloat(args[1]);
              const divisor = parseFloat(args[2]);
              if (isNaN(dividend) || isNaN(divisor)) {
                console.log('❌ 数値を入力してください');
              } else {
                await this.sendRequest('tools/call', {
                  name: 'safe_divide',
                  arguments: { dividend, divisor }
                });
              }
            }
            break;
            
          case '8':
          case 'quit':
            console.log('👋 終了中...');
            this.cleanup();
            return;
            
          default:
            console.log('❌ 不明なコマンド:', command);
        }
      } catch (error) {
        console.error('❌ コマンドエラー:', error);
      }
      
      this.rl.prompt();
    });
  }

  private cleanup() {
    this.rl.close();
    if (this.process) {
      this.process.kill();
    }
    process.exit(0);
  }
}

// メイン実行
const client = new MCPTestClient();
client.start().catch(console.error);
```

### テスト実行:
```bash
npm run test
```

期待される出力：
```
🚀 MCPサーバーテストクライアント - TypeScript版
================================
📋 利用可能なコマンド:
1. tools/list - ツール一覧を取得
2. hello <名前> - 挨拶ツールのテスト
...
```

## 📊 TypeScriptの特徴

### 型安全性
```typescript
// Zodスキーマによる厳密な型検証
parameters: z.object({
  name: z.string().describe("挨拶する相手の名前"),
  age: z.number().int().min(0).max(150).describe("年齢")
})
```

### 非同期処理
```typescript
// async/awaitパターンの使用
execute: async (args) => {
  const result = await someAsyncOperation(args);
  return result;
}
```

### エラーハンドリング
```typescript
try {
  const result = await riskyOperation();
  return { success: true, result };
} catch (error) {
  return { 
    success: false, 
    error: error instanceof Error ? error.message : String(error)
  };
}
```

## ✅ チェックポイント

以下を確認してください：

- [ ] server.tsが正常に起動する
- [ ] TypeScriptのビルドが成功する
- [ ] テストクライアントでツールが実行できる
- [ ] HTTPモードでも動作する
- [ ] 型安全性が確保されている
- [ ] エラーハンドリングが機能する

## 🎉 完成！

おめでとうございます！TypeScript版のMCPサーバーが完成しました。

### 完成したプロジェクト構造
```
my-first-mcp-ts/
├── server.ts           # メインサーバー
├── test-client.ts      # テストクライアント
├── config.json         # 設定ファイル
├── package.json        # プロジェクト設定
├── tsconfig.json       # TypeScript設定
├── dist/              # ビルド出力
└── node_modules/      # 依存関係
```

## 🔧 トラブルシューティング

### よくあるエラー

**1. TypeScriptコンパイルエラー**
```bash
# 型エラーをチェック
npx tsc --noEmit
```

**2. モジュールエラー**
```bash
# package.jsonに"type": "module"が設定されているか確認
```

**3. FastMCPバージョンエラー**
```bash
# 最新版にアップデート
npm update fastmcp
```

### TypeScript vs Python の違い

| 項目 | TypeScript | Python |
|---|---|---|
| **型安全性** | コンパイル時チェック | ランタイム時チェック |
| **パフォーマンス** | Node.jsランタイム | Pythonインタープリター |
| **エコシステム** | npm | pip |
| **記述量** | やや多い | 簡潔 |
| **デバッグ** | TypeScript支援 | 動的デバッグ |

## 🔄 次のステップ

TypeScript版の基本的なツールが作れるようになったら、次はより複雑なデータ操作に挑戦してみましょう！


---

## 更新履歴

| バージョン | 更新日 | 更新者 | 更新内容 | 影響ドキュメント |
|---|-----|-----|----|---|
| 1.0 | 2025-06-28 | mcp starter | 初版作成（TypeScript版）、src/05-hello-world-tsベースで作成 | 02-hello-world.md |

---

💡 **ヒント**: TypeScriptの型安全性を活用して、より堅牢なMCPサーバーを構築できます。ぜひ実験してみてください！
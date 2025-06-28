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
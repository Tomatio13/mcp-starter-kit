/**
 * FastMCPを使用したタスク管理MCPサーバー - TypeScript版
 */
import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { TaskDatabase, Task, Category } from './database.js';
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
  database?: {
    path?: string;
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

// データベース初期化
const config = await loadConfig();
const db = new TaskDatabase(config.database?.path);
await db.initialize();

// サーバー初期化
const server = new FastMCP({
  name: config.server?.name || "Task Manager",
  version: (config.server?.version || "1.0.0") as `${number}.${number}.${number}`
});

// バリデーションスキーマ
const TaskStatusSchema = z.enum(['pending', 'completed', 'cancelled']);
const TaskPrioritySchema = z.number().int().min(1).max(5);

// ツール1: タスク作成
server.addTool({
  name: "create_task",
  description: "新しいタスクを作成する",
  parameters: z.object({
    title: z.string().min(1).describe("タスクのタイトル"),
    description: z.string().optional().describe("タスクの詳細説明"),
    priority: TaskPrioritySchema.default(1).describe("優先度（1-5、5が最高）")
  }),
  execute: async (args) => {
    try {
      const task = await db.createTask({
        title: args.title,
        description: args.description || "",
        status: 'pending',
        priority: args.priority
      });

      return JSON.stringify({
        success: true,
        task: task,
        message: `タスク '${args.title}' を作成しました`
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "タスクの作成に失敗しました"
      });
    }
  }
});

// ツール2: タスク一覧取得
server.addTool({
  name: "get_tasks",
  description: "タスク一覧を取得する",
  parameters: z.object({
    status: z.enum(['all', 'pending', 'completed', 'cancelled']).default('all').describe("フィルタするステータス"),
    limit: z.number().int().min(1).max(100).default(10).describe("取得する最大件数")
  }),
  execute: async (args) => {
    try {
      const tasks = await db.getTasks(args.status, args.limit);
      
      return JSON.stringify({
        success: true,
        tasks: tasks,
        count: tasks.length,
        filter: args.status
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        tasks: []
      });
    }
  }
});

// ツール3: タスクステータス更新
server.addTool({
  name: "update_task_status",
  description: "タスクのステータスを更新する",
  parameters: z.object({
    task_id: z.number().int().positive().describe("タスクID"),
    status: TaskStatusSchema.describe("新しいステータス")
  }),
  execute: async (args) => {
    try {
      const success = await db.updateTaskStatus(args.task_id, args.status);
      
      if (!success) {
        return JSON.stringify({
          success: false,
          error: `ID ${args.task_id} のタスクが見つかりません`
        });
      }

      return JSON.stringify({
        success: true,
        message: `タスク ID ${args.task_id} のステータスを '${args.status}' に更新しました`,
        task_id: args.task_id,
        new_status: args.status
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// ツール4: タスク削除
server.addTool({
  name: "delete_task",
  description: "タスクを削除する",
  parameters: z.object({
    task_id: z.number().int().positive().describe("削除するタスクのID")
  }),
  execute: async (args) => {
    try {
      const success = await db.deleteTask(args.task_id);
      
      if (!success) {
        return JSON.stringify({
          success: false,
          error: `ID ${args.task_id} のタスクが見つかりません`
        });
      }

      return JSON.stringify({
        success: true,
        message: `タスク ID ${args.task_id} を削除しました`,
        deleted_task_id: args.task_id
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// ツール5: タスク検索
server.addTool({
  name: "search_tasks",
  description: "タスクを検索する",
  parameters: z.object({
    keyword: z.string().min(1).describe("検索キーワード（タイトルまたは説明に含まれる）")
  }),
  execute: async (args) => {
    try {
      const tasks = await db.searchTasks(args.keyword);
      
      return JSON.stringify({
        success: true,
        tasks: tasks,
        count: tasks.length,
        keyword: args.keyword
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        tasks: []
      });
    }
  }
});

// ツール6: タスク統計
server.addTool({
  name: "get_task_statistics",
  description: "タスクの統計情報を取得する",
  parameters: z.object({}),
  execute: async () => {
    try {
      const statistics = await db.getTaskStatistics();
      
      return JSON.stringify({
        success: true,
        statistics: statistics
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// ツール7: カテゴリ作成
server.addTool({
  name: "create_category",
  description: "新しいカテゴリを作成する",
  parameters: z.object({
    name: z.string().min(1).describe("カテゴリ名"),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#007bff").describe("カテゴリの色（HEX形式）")
  }),
  execute: async (args) => {
    try {
      const category = await db.createCategory({
        name: args.name,
        color: args.color
      });

      return JSON.stringify({
        success: true,
        category: category,
        message: `カテゴリ '${args.name}' を作成しました`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('UNIQUE constraint failed')) {
        return JSON.stringify({
          success: false,
          error: `カテゴリ '${args.name}' は既に存在します`
        });
      }
      return JSON.stringify({
        success: false,
        error: errorMessage
      });
    }
  }
});

// ツール8: カテゴリ一覧取得
server.addTool({
  name: "get_categories",
  description: "カテゴリ一覧を取得する",
  parameters: z.object({}),
  execute: async () => {
    try {
      const categories = await db.getCategories();
      
      return JSON.stringify({
        success: true,
        categories: categories,
        count: categories.length
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        categories: []
      });
    }
  }
});

// ツール9: カテゴリ割り当て
server.addTool({
  name: "assign_category_to_task",
  description: "タスクにカテゴリを割り当てる",
  parameters: z.object({
    task_id: z.number().int().positive().describe("タスクID"),
    category_id: z.number().int().positive().describe("カテゴリID")
  }),
  execute: async (args) => {
    try {
      const success = await db.assignCategoryToTask(args.task_id, args.category_id);
      
      if (!success) {
        return JSON.stringify({
          success: false,
          error: `タスクID ${args.task_id} またはカテゴリID ${args.category_id} が見つかりません`
        });
      }

      return JSON.stringify({
        success: true,
        message: `タスク ID ${args.task_id} にカテゴリ ID ${args.category_id} を割り当てました`
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// ツール10: データベースバックアップ
server.addTool({
  name: "backup_database",
  description: "データベースをバックアップする",
  parameters: z.object({
    backup_path: z.string().optional().describe("バックアップファイルのパス（省略時は自動生成）")
  }),
  execute: async (args) => {
    try {
      const fs = await import('fs/promises');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = args.backup_path || `backup_tasks_${timestamp}.db`;
      
      await fs.copyFile(db.databasePath, backupPath);
      
      return JSON.stringify({
        success: true,
        message: `データベースを ${backupPath} にバックアップしました`,
        backup_path: backupPath
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// ツール11: JSONエクスポート
server.addTool({
  name: "export_tasks_to_json",
  description: "タスクをJSONファイルにエクスポートする",
  parameters: z.object({
    file_path: z.string().default("tasks_export.json").describe("エクスポート先ファイルパス")
  }),
  execute: async (args) => {
    try {
      const fs = await import('fs/promises');
      const tasks = await db.exportTasksToJson();
      await fs.writeFile(args.file_path, JSON.stringify(tasks, null, 2), 'utf-8');
      
      return JSON.stringify({
        success: true,
        message: `${tasks.length} 件のタスクを ${args.file_path} にエクスポートしました`,
        exported_count: tasks.length,
        file_path: args.file_path
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// ツール12: サーバー情報取得
server.addTool({
  name: "get_server_info",
  description: "サーバーの情報を取得する",
  parameters: z.object({}),
  execute: async () => {
    return JSON.stringify({
      server_name: config.server?.name || "Task Manager",
      version: config.server?.version || "1.0.0",
      description: config.server?.description || "SQLiteを使用したタスク管理MCPサーバー",
      author: config.server?.author || "Unknown",
      database_path: config.database?.path || "tasks.db",
      tools_count: 12,
      runtime: "Node.js",
      language: "TypeScript"
    });
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

// プロセス終了時のクリーンアップ
process.on('SIGINT', async () => {
  console.log('\n🔄 サーバーを終了中...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 サーバーを終了中...');
  await db.close();
  process.exit(0);
});

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { server, db };
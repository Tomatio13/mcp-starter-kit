---
title: "チュートリアル7: データ操作をマスターしよう（TypeScript版）"
version: "1.0"
last_updated: "2025-06-28"
author: "mcp starter"
reviewers: []
related_docs: ["03-data-handling.md", "06-hello-world-ts.md"]
status: "approved"
dependencies:
  upstream: ["06-hello-world-ts.md"]
  downstream: []
impact_level: "medium"
---

# チュートリアル7: データ操作をマスターしよう（TypeScript版） 📊

**所要時間: 35分**  
**前提知識: [チュートリアル6](06-hello-world-ts.md))を参考にしてください、TypeScriptの基本的な知識**

## 🎯 今回の目標

- TypeScriptでSQLiteデータベースを操作するツールを作成
- FastMCPでのデータ永続化を学習（TypeScript版）
- 実用的なCRUD操作を実装
- 型安全なデータベース操作をマスター

## 📚 SQLiteとTypeScriptの組み合わせ

SQLiteは軽量なデータベースで、TypeScriptと組み合わせることで型安全なデータ操作が実現できます。

### TypeScript + SQLiteの特徴
- ✅ **型安全性**: コンパイル時にデータ型エラーを検出
- ✅ **自動補完**: IDEで完全なコード補完
- ✅ **Promise/async-await**: 現代的な非同期処理
- ✅ **エラーハンドリング**: try-catch文による適切な例外処理

## 🏗️ ステップ1: プロジェクト設定

### プロジェクトディレクトリ作成
```bash
mkdir task-manager-ts
cd task-manager-ts
```

### package.jsonの設定
```bash
npm init -y
```

```json
{
  "name": "task-manager-ts",
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
    "zod": "^3.22.0",
    "sqlite": "^5.1.1",
    "sqlite3": "^5.1.6"
  },
  "devDependencies": {
    "@types/node": "^latest",
    "@types/sqlite3": "^3.1.11",
    "tsx": "^latest",
    "typescript": "^latest"
  }
}
```

### 依存関係インストール
```bash
npm install
```

### TypeScript設定: `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "resolveJsonModule": true,
    "declaration": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## 📝 ステップ2: データベース設計

### 設定ファイル: `config.json`
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

### データベース管理クラス: `database.ts`
```typescript
/**
 * SQLiteデータベース管理クラス - TypeScript版
 */
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// データベースの型定義
export interface Task {
  id?: number;
  title: string;
  description?: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id?: number;
  name: string;
  color: string;
  created_at?: string;
}

export interface TaskCategory {
  task_id: number;
  category_id: number;
}

export interface TaskStatistics {
  total_tasks: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
}

export class TaskDatabase {
  private db: Database<sqlite3.Database, sqlite3.Statement> | null = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'tasks.db');
  }

  async initialize(): Promise<void> {
    try {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });

      // 外部キー制約を有効化
      await this.db.exec('PRAGMA foreign_keys = ON');

      // テーブル作成
      await this.createTables();
    } catch (error) {
      throw new Error(`データベース初期化エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    // tasksテーブル作成
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // categoriesテーブル作成
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#007bff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // task_categoriesテーブル作成
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS task_categories (
        task_id INTEGER,
        category_id INTEGER,
        PRIMARY KEY (task_id, category_id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);
  }

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    const result = await this.db.run(
      'INSERT INTO tasks (title, description, status, priority) VALUES (?, ?, ?, ?)',
      [task.title, task.description || '', task.status || 'pending', task.priority || 1]
    );

    if (!result.lastID) {
      throw new Error('タスクの作成に失敗しました');
    }

    return await this.getTaskById(result.lastID);
  }

  async getTasks(status: string = 'all', limit: number = 10): Promise<Task[]> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    let query = 'SELECT * FROM tasks';
    let params: any[] = [];

    if (status !== 'all') {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY priority DESC, created_at DESC LIMIT ?';
    params.push(limit);

    const rows = await this.db.all(query, params);
    return rows as Task[];
  }

  async getTaskById(id: number): Promise<Task> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    const task = await this.db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    
    if (!task) {
      throw new Error(`ID ${id} のタスクが見つかりません`);
    }

    return task as Task;
  }

  async updateTaskStatus(id: number, status: Task['status']): Promise<Task> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    const validStatuses: Task['status'][] = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`無効なステータス: ${status}`);
    }

    // タスクの存在確認
    await this.getTaskById(id);

    // ステータス更新
    await this.db.run(
      'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    return await this.getTaskById(id);
  }

  async deleteTask(id: number): Promise<Task> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    // 削除前にタスクを取得
    const task = await this.getTaskById(id);

    // タスク削除（関連カテゴリも自動削除）
    await this.db.run('DELETE FROM tasks WHERE id = ?', [id]);

    return task;
  }

  async searchTasks(keyword: string): Promise<Task[]> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    const searchPattern = `%${keyword}%`;
    const rows = await this.db.all(
      'SELECT * FROM tasks WHERE title LIKE ? OR description LIKE ? ORDER BY priority DESC, created_at DESC',
      [searchPattern, searchPattern]
    );

    return rows as Task[];
  }

  async getTaskStatistics(): Promise<TaskStatistics> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    // 全体統計
    const totalResult = await this.db.get('SELECT COUNT(*) as total FROM tasks');
    const total = totalResult?.total || 0;

    // ステータス別統計
    const statusRows = await this.db.all(
      'SELECT status, COUNT(*) as count FROM tasks GROUP BY status'
    );
    const byStatus: Record<string, number> = {};
    statusRows.forEach(row => {
      byStatus[row.status] = row.count;
    });

    // 優先度別統計
    const priorityRows = await this.db.all(
      'SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority ORDER BY priority DESC'
    );
    const byPriority: Record<string, number> = {};
    priorityRows.forEach(row => {
      byPriority[`priority_${row.priority}`] = row.count;
    });

    return {
      total_tasks: total,
      by_status: byStatus,
      by_priority: byPriority
    };
  }

  async createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    try {
      const result = await this.db.run(
        'INSERT INTO categories (name, color) VALUES (?, ?)',
        [category.name, category.color || '#007bff']
      );

      if (!result.lastID) {
        throw new Error('カテゴリの作成に失敗しました');
      }

      return await this.getCategoryById(result.lastID);
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error(`カテゴリ '${category.name}' は既に存在します`);
      }
      throw error;
    }
  }

  async getCategoryById(id: number): Promise<Category> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    const category = await this.db.get('SELECT * FROM categories WHERE id = ?', [id]);
    
    if (!category) {
      throw new Error(`ID ${id} のカテゴリが見つかりません`);
    }

    return category as Category;
  }

  async getCategories(): Promise<Category[]> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    const rows = await this.db.all('SELECT * FROM categories ORDER BY name');
    return rows as Category[];
  }

  async assignCategoryToTask(taskId: number, categoryId: number): Promise<void> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    // タスクとカテゴリの存在確認
    await this.getTaskById(taskId);
    await this.getCategoryById(categoryId);

    // カテゴリ割り当て（重複無視）
    await this.db.run(
      'INSERT OR IGNORE INTO task_categories (task_id, category_id) VALUES (?, ?)',
      [taskId, categoryId]
    );
  }

  async backupDatabase(backupPath?: string): Promise<string> {
    if (!backupPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      backupPath = `backup_tasks_${timestamp}.db`;
    }

    // ファイルコピー（シンプルな方法）
    const fs = await import('fs/promises');
    await fs.copyFile(this.dbPath, backupPath);

    return backupPath;
  }

  async exportTasksToJson(filePath: string = 'tasks_export.json'): Promise<{ count: number; path: string }> {
    const tasks = await this.getTasks('all', 1000);
    
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, JSON.stringify(tasks, null, 2), 'utf-8');

    return {
      count: tasks.length,
      path: filePath
    };
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}
```

## 🔧 ステップ3: タスク管理サーバー作成

### メインサーバー: `server.ts`
```typescript
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
      const task = await db.updateTaskStatus(args.task_id, args.status);
      
      return JSON.stringify({
        success: true,
        message: `タスク '${task.title}' のステータスを '${args.status}' に更新しました`,
        task: task
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
      const task = await db.deleteTask(args.task_id);
      
      return JSON.stringify({
        success: true,
        message: `タスク '${task.title}' を削除しました`,
        deleted_task: task
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

// ツール6: 統計情報取得
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
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
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
      await db.assignCategoryToTask(args.task_id, args.category_id);
      
      const task = await db.getTaskById(args.task_id);
      const category = await db.getCategoryById(args.category_id);
      
      return JSON.stringify({
        success: true,
        message: `タスク '${task.title}' にカテゴリ '${category.name}' を割り当てました`
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
    backup_path: z.string().optional().describe("バックアップファイルのパス")
  }),
  execute: async (args) => {
    try {
      const backupPath = await db.backupDatabase(args.backup_path);
      
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
    file_path: z.string().default("tasks_export.json").describe("エクスポートファイルのパス")
  }),
  execute: async (args) => {
    try {
      const result = await db.exportTasksToJson(args.file_path);
      
      return JSON.stringify({
        success: true,
        message: `タスクを ${result.path} にエクスポートしました`,
        exported_count: result.count,
        file_path: result.path
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
    const serverConfig = config.server || {};
    
    const info = {
      server_name: serverConfig.name || "Task Manager - TypeScript",
      version: serverConfig.version || "1.0.0",
      description: serverConfig.description || "SQLiteを使用したタスク管理MCPサーバー - TypeScript版",
      author: serverConfig.author || "あなたの名前",
      database_path: config.database?.path || "tasks.db",
      tools_count: 12,
      runtime: "Node.js",
      language: "TypeScript"
    };
    
    return JSON.stringify(info, null, 2);
  }
});

// サーバー起動関数
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
  console.log('\n🛑 サーバーを終了しています...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 サーバーを終了しています...');
  await db.close();
  process.exit(0);
});

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { server, db };
```

## 🚀 ステップ4: サーバー起動とテスト

### 起動
```bash
# TypeScriptを直接実行
npm run dev

# またはビルドして実行
npm run build
npm start
```

### テストクライアント作成: `test-client.ts`
```typescript
/**
 * タスク管理サーバーをテストするクライアント - TypeScript版
 */
import { spawn, ChildProcess } from 'child_process';
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

class TaskManagerTestClient {
  private process: ChildProcess | null = null;
  private requestId = 1;
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('🚀 タスク管理サーバーテストクライアント - TypeScript版');
    console.log('===========================================');
    
    // MCPサーバーを起動
    this.process = spawn('npx', ['tsx', 'server.ts'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.process.stdout?.on('data', (data: Buffer) => {
      try {
        const response: MCPResponse = JSON.parse(data.toString());
        console.log('📦 応答:', JSON.stringify(response, null, 2));
      } catch (error) {
        console.log('📄 出力:', data.toString());
      }
    });

    this.process.stderr?.on('data', (data: Buffer) => {
      console.error('❌ エラー:', data.toString());
    });

    this.process.on('close', (code: number | null) => {
      console.log(`🏁 サーバープロセス終了 (コード: ${code})`);
    });

    // 初期化
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: { listChanged: true },
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
    if (!this.process?.stdin) {
      throw new Error('プロセスが初期化されていません');
    }

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
    console.log('=== 基本操作 ===');
    console.log('create <タイトル> [説明] [優先度] - タスク作成');
    console.log('list [ステータス] [件数] - タスク一覧');
    console.log('update <ID> <ステータス> - タスクステータス更新');
    console.log('delete <ID> - タスク削除');
    console.log('search <キーワード> - タスク検索');
    console.log('=== 統計・管理 ===');
    console.log('stats - 統計情報');
    console.log('backup [パス] - データベースバックアップ');
    console.log('export [パス] - JSONエクスポート');
    console.log('info - サーバー情報');
    console.log('=== カテゴリ管理 ===');
    console.log('category-create <名前> [色] - カテゴリ作成');
    console.log('categories - カテゴリ一覧');
    console.log('assign <タスクID> <カテゴリID> - カテゴリ割り当て');
    console.log('=== システム ===');
    console.log('tools - ツール一覧');
    console.log('quit - 終了');
    console.log('');

    this.rl.prompt();
    this.rl.on('line', async (input: string) => {
      const args = input.trim().split(' ');
      const command = args[0];

      try {
        switch (command) {
          case 'tools':
            await this.sendRequest('tools/list', {});
            break;

          case 'create':
            if (args.length < 2) {
              console.log('❌ 使用法: create <タイトル> [説明] [優先度]');
            } else {
              await this.sendRequest('tools/call', {
                name: 'create_task',
                arguments: {
                  title: args[1],
                  description: args[2] || '',
                  priority: parseInt(args[3]) || 1
                }
              });
            }
            break;

          case 'list':
            await this.sendRequest('tools/call', {
              name: 'get_tasks',
              arguments: {
                status: args[1] || 'all',
                limit: parseInt(args[2]) || 10
              }
            });
            break;

          case 'update':
            if (args.length < 3) {
              console.log('❌ 使用法: update <ID> <ステータス>');
            } else {
              await this.sendRequest('tools/call', {
                name: 'update_task_status',
                arguments: {
                  task_id: parseInt(args[1]),
                  status: args[2]
                }
              });
            }
            break;

          case 'delete':
            if (args.length < 2) {
              console.log('❌ 使用法: delete <ID>');
            } else {
              await this.sendRequest('tools/call', {
                name: 'delete_task',
                arguments: {
                  task_id: parseInt(args[1])
                }
              });
            }
            break;

          case 'search':
            if (args.length < 2) {
              console.log('❌ 使用法: search <キーワード>');
            } else {
              await this.sendRequest('tools/call', {
                name: 'search_tasks',
                arguments: {
                  keyword: args[1]
                }
              });
            }
            break;

          case 'stats':
            await this.sendRequest('tools/call', {
              name: 'get_task_statistics',
              arguments: {}
            });
            break;

          case 'backup':
            await this.sendRequest('tools/call', {
              name: 'backup_database',
              arguments: {
                backup_path: args[1]
              }
            });
            break;

          case 'export':
            await this.sendRequest('tools/call', {
              name: 'export_tasks_to_json',
              arguments: {
                file_path: args[1] || 'tasks_export.json'
              }
            });
            break;

          case 'category-create':
            if (args.length < 2) {
              console.log('❌ 使用法: category-create <名前> [色]');
            } else {
              await this.sendRequest('tools/call', {
                name: 'create_category',
                arguments: {
                  name: args[1],
                  color: args[2] || '#007bff'
                }
              });
            }
            break;

          case 'categories':
            await this.sendRequest('tools/call', {
              name: 'get_categories',
              arguments: {}
            });
            break;

          case 'assign':
            if (args.length < 3) {
              console.log('❌ 使用法: assign <タスクID> <カテゴリID>');
            } else {
              await this.sendRequest('tools/call', {
                name: 'assign_category_to_task',
                arguments: {
                  task_id: parseInt(args[1]),
                  category_id: parseInt(args[2])
                }
              });
            }
            break;

          case 'info':
            await this.sendRequest('tools/call', {
              name: 'get_server_info',
              arguments: {}
            });
            break;

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
const client = new TaskManagerTestClient();
client.start().catch(console.error);
```

### テスト実行
```bash
npm run test
```

## 📊 TypeScriptの特徴とメリット

### 型安全性
```typescript
// コンパイル時エラー検出
interface Task {
  id?: number;
  title: string;
  status: 'pending' | 'completed' | 'cancelled'; // リテラル型
  priority: number;
}

// 型チェックによる安全な操作
const updateStatus = (task: Task, newStatus: Task['status']) => {
  task.status = newStatus; // 型安全
};
```

### 厳密なバリデーション
```typescript
// Zodスキーマによる実行時検証
const TaskStatusSchema = z.enum(['pending', 'completed', 'cancelled']);
const TaskPrioritySchema = z.number().int().min(1).max(5);
```

### 非同期処理
```typescript
// Promise/async-awaitパターン
async function createTask(data: Omit<Task, 'id'>): Promise<Task> {
  try {
    const result = await db.run('INSERT INTO tasks...');
    return await db.get('SELECT * FROM tasks WHERE id = ?', [result.lastID]);
  } catch (error) {
    throw new Error(`タスク作成エラー: ${error.message}`);
  }
}
```

## ✅ チェックポイント

以下を確認してください：

- [ ] TypeScriptのコンパイルが成功する
- [ ] データベースファイル（tasks.db）が作成される
- [ ] タスクの作成・取得・更新・削除ができる
- [ ] カテゴリ機能が動作する
- [ ] 検索機能が動作する
- [ ] 統計情報が取得できる
- [ ] バックアップ・エクスポート機能が動作する
- [ ] 型安全性が確保されている
- [ ] エラーハンドリングが機能する

## 🔧 トラブルシューティング

### よくあるエラー

**1. TypeScriptコンパイルエラー**
```bash
# 型エラーの確認
npx tsc --noEmit

# 厳密な型チェック
npx tsc --strict
```

**2. SQLiteモジュールエラー**
```bash
# sqlite3の再ビルド
npm rebuild sqlite3

# 代替案：better-sqlite3を使用
npm install better-sqlite3
```

**3. ES Modulesエラー**
```json
// package.jsonの確認
{
  "type": "module"
}
```

### Python版 vs TypeScript版の比較

| 項目 | Python版 | TypeScript版 |
|---|---|---|
| **型安全性** | ランタイム | コンパイル時 |
| **記述量** | 簡潔 | やや多い |
| **エラー検出** | 実行時 | 開発時 |
| **IDE支援** | 基本的 | 高度 |
| **パフォーマンス** | やや遅い | 高速 |
| **学習コスト** | 低い | 中程度 |

## 🎉 学習成果

このチュートリアルで学んだこと：

- ✅ **TypeScriptでのSQLite操作**: 型安全なデータベース操作
- ✅ **Promise/async-await**: 現代的な非同期処理
- ✅ **Zodバリデーション**: 実行時の型安全性
- ✅ **エラーハンドリング**: try-catch文による適切な例外処理
- ✅ **リソース管理**: データベース接続のクリーンアップ
- ✅ **ES Modules**: モダンなJavaScript/TypeScript開発
- ✅ **型定義**: インターフェースによる構造化

## 🔄 次のステップ

TypeScript版のデータ操作をマスターしたら、次はより実用的なアプリケーションの構築に挑戦してみましょう！

**参考**: Python版の実践応用チュートリアル [チュートリアル4: 実践応用](04-practical-usage.md) を参考に、TypeScript版も実装してみてください。

---

## 更新履歴

| バージョン | 更新日 | 更新者 | 更新内容 | 影響ドキュメント |
|---|-----|-----|----|---|
| 1.0 | 2025-06-28 | mcp starter | 初版作成（TypeScript版）、src/06-task-manager-tsベースで作成 | 03-data-handling.md, 06-hello-world-ts.md |

---

💡 **ヒント**: TypeScriptの型安全性を活用することで、より堅牢で保守性の高いMCPサーバーを構築できます。コンパイル時エラー検出により、実行前に多くの問題を発見できるのが大きな利点です！
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

    if (!result.lastID) throw new Error('タスクの作成に失敗しました');

    const createdTask = await this.db.get<Task>(
      'SELECT * FROM tasks WHERE id = ?',
      [result.lastID]
    );

    if (!createdTask) throw new Error('作成されたタスクの取得に失敗しました');
    return createdTask;
  }

  async getTasks(status?: string, limit = 10): Promise<Task[]> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    let query = `
      SELECT * FROM tasks 
      ORDER BY priority DESC, created_at DESC 
      LIMIT ?
    `;
    let params: any[] = [limit];

    if (status && status !== 'all') {
      query = `
        SELECT * FROM tasks 
        WHERE status = ? 
        ORDER BY priority DESC, created_at DESC 
        LIMIT ?
      `;
      params = [status, limit];
    }

    return await this.db.all<Task[]>(query, params);
  }

  async updateTaskStatus(taskId: number, status: Task['status']): Promise<boolean> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    // タスクの存在確認
    const task = await this.db.get<Task>('SELECT id FROM tasks WHERE id = ?', [taskId]);
    if (!task) return false;

    const result = await this.db.run(
      'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, taskId]
    );

    return (result.changes || 0) > 0;
  }

  async deleteTask(taskId: number): Promise<boolean> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    // タスクの存在確認
    const task = await this.db.get<Task>('SELECT id FROM tasks WHERE id = ?', [taskId]);
    if (!task) return false;

    const result = await this.db.run('DELETE FROM tasks WHERE id = ?', [taskId]);
    return (result.changes || 0) > 0;
  }

  async searchTasks(keyword: string): Promise<Task[]> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    const searchPattern = `%${keyword}%`;
    return await this.db.all<Task[]>(
      `SELECT * FROM tasks 
       WHERE title LIKE ? OR description LIKE ?
       ORDER BY priority DESC, created_at DESC`,
      [searchPattern, searchPattern]
    );
  }

  async getTaskStatistics(): Promise<any> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    // 全体統計
    const totalResult = await this.db.get<{ total: number }>('SELECT COUNT(*) as total FROM tasks');
    const total = totalResult?.total || 0;

    // ステータス別統計
    const statusStats = await this.db.all<{ status: string; count: number }[]>(
      'SELECT status, COUNT(*) as count FROM tasks GROUP BY status'
    );

    // 優先度別統計
    const priorityStats = await this.db.all<{ priority: number; count: number }[]>(
      'SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority ORDER BY priority DESC'
    );

    return {
      total_tasks: total,
      by_status: Object.fromEntries(statusStats.map(s => [s.status, s.count])),
      by_priority: Object.fromEntries(priorityStats.map(p => [`priority_${p.priority}`, p.count]))
    };
  }

  async createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    const result = await this.db.run(
      'INSERT INTO categories (name, color) VALUES (?, ?)',
      [category.name, category.color || '#007bff']
    );

    if (!result.lastID) throw new Error('カテゴリの作成に失敗しました');

    const createdCategory = await this.db.get<Category>(
      'SELECT * FROM categories WHERE id = ?',
      [result.lastID]
    );

    if (!createdCategory) throw new Error('作成されたカテゴリの取得に失敗しました');
    return createdCategory;
  }

  async getCategories(): Promise<Category[]> {
    if (!this.db) throw new Error('データベースが初期化されていません');
    return await this.db.all<Category[]>('SELECT * FROM categories ORDER BY name');
  }

  async assignCategoryToTask(taskId: number, categoryId: number): Promise<boolean> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    // タスクとカテゴリの存在確認
    const task = await this.db.get<Task>('SELECT id FROM tasks WHERE id = ?', [taskId]);
    const category = await this.db.get<Category>('SELECT id FROM categories WHERE id = ?', [categoryId]);

    if (!task || !category) return false;

    const result = await this.db.run(
      'INSERT OR IGNORE INTO task_categories (task_id, category_id) VALUES (?, ?)',
      [taskId, categoryId]
    );

    return (result.changes || 0) > 0;
  }

  async exportTasksToJson(): Promise<Task[]> {
    if (!this.db) throw new Error('データベースが初期化されていません');
    
    return await this.db.all<Task[]>(
      'SELECT * FROM tasks ORDER BY priority DESC, created_at DESC LIMIT 1000'
    );
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  get databasePath(): string {
    return this.dbPath;
  }
}
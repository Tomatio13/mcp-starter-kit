/**
 * スマート分析システムのデータベース管理 - TypeScript版
 */
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs/promises';

// データベースの型定義
export interface UrlRecord {
  id?: number;
  url: string;
  title?: string;
  content?: string;
  scraped_at?: string;
  status?: 'pending' | 'scraped' | 'failed';
}

export interface AnalysisRecord {
  id?: number;
  url_id: number;
  sentiment_score: number;
  sentiment_label: string;
  keywords: string; // JSON文字列
  word_count: number;
  analyzed_at?: string;
}

export interface ReportRecord {
  id?: number;
  name: string;
  description?: string;
  data: string; // JSON文字列
  file_path?: string;
  created_at?: string;
}

export class AnalysisDatabase {
  private db: Database<sqlite3.Database, sqlite3.Statement> | null = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'data', 'analysis.db');
  }

  async initialize(): Promise<void> {
    try {
      // データディレクトリを作成
      const dataDir = path.dirname(this.dbPath);
      await fs.mkdir(dataDir, { recursive: true });

      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });

      await this.createTables();
    } catch (error) {
      throw new Error(`データベース初期化エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    // 分析対象URLテーブル
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT UNIQUE NOT NULL,
        title TEXT,
        content TEXT,
        scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending'
      )
    `);

    // 分析結果テーブル
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url_id INTEGER,
        sentiment_score REAL,
        sentiment_label TEXT,
        keywords TEXT,
        word_count INTEGER,
        analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (url_id) REFERENCES urls(id)
      )
    `);

    // レポートテーブル
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        data TEXT,
        file_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async insertUrl(urlData: Omit<UrlRecord, 'id' | 'scraped_at'>): Promise<number> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    const result = await this.db.run(
      'INSERT OR REPLACE INTO urls (url, title, content, status) VALUES (?, ?, ?, ?)',
      [urlData.url, urlData.title || '', urlData.content || '', urlData.status || 'pending']
    );

    if (!result.lastID) throw new Error('URL記録の挿入に失敗しました');
    return result.lastID;
  }

  async insertAnalysis(analysisData: Omit<AnalysisRecord, 'id' | 'analyzed_at'>): Promise<number> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    const result = await this.db.run(
      'INSERT INTO analyses (url_id, sentiment_score, sentiment_label, keywords, word_count) VALUES (?, ?, ?, ?, ?)',
      [
        analysisData.url_id,
        analysisData.sentiment_score,
        analysisData.sentiment_label,
        analysisData.keywords,
        analysisData.word_count
      ]
    );

    if (!result.lastID) throw new Error('分析記録の挿入に失敗しました');
    return result.lastID;
  }

  async insertReport(reportData: Omit<ReportRecord, 'id' | 'created_at'>): Promise<number> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    const result = await this.db.run(
      'INSERT INTO reports (name, description, data, file_path) VALUES (?, ?, ?, ?)',
      [reportData.name, reportData.description || '', reportData.data, reportData.file_path || '']
    );

    if (!result.lastID) throw new Error('レポート記録の挿入に失敗しました');
    return result.lastID;
  }

  async getAnalysisHistory(limit = 10): Promise<Array<UrlRecord & AnalysisRecord>> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    return await this.db.all(`
      SELECT u.url, u.title, a.sentiment_score, a.sentiment_label,
             a.word_count, a.analyzed_at
      FROM analyses a
      JOIN urls u ON a.url_id = u.id
      ORDER BY a.analyzed_at DESC
      LIMIT ?
    `, [limit]);
  }

  async searchBySentiment(sentimentLabel: string): Promise<Array<UrlRecord & AnalysisRecord>> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    return await this.db.all(`
      SELECT u.url, u.title, a.sentiment_score, a.sentiment_label,
             a.word_count, a.analyzed_at
      FROM analyses a
      JOIN urls u ON a.url_id = u.id
      WHERE a.sentiment_label = ?
      ORDER BY a.sentiment_score DESC
    `, [sentimentLabel]);
  }

  async getAllKeywords(): Promise<AnalysisRecord[]> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    return await this.db.all('SELECT keywords FROM analyses WHERE keywords IS NOT NULL');
  }

  async getAnalysisStatistics(): Promise<any> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    // 全体統計
    const totalResult = await this.db.get<{ total: number }>('SELECT COUNT(*) as total FROM analyses');
    const total = totalResult?.total || 0;

    // 感情分布
    const sentimentStats = await this.db.all<{ sentiment_label: string; count: number }[]>(
      'SELECT sentiment_label, COUNT(*) as count FROM analyses GROUP BY sentiment_label'
    );

    // 平均感情スコア
    const avgResult = await this.db.get<{ avg_score: number }>('SELECT AVG(sentiment_score) as avg_score FROM analyses');
    const avgSentiment = avgResult?.avg_score || 0;

    // 最近の分析
    const recentResult = await this.db.get<{ recent_count: number }>(`
      SELECT COUNT(*) as recent_count
      FROM analyses
      WHERE analyzed_at > datetime('now', '-7 days')
    `);
    const recentAnalyses = recentResult?.recent_count || 0;

    return {
      total_analyses: total,
      sentiment_distribution: Object.fromEntries(sentimentStats.map(s => [s.sentiment_label, s.count])),
      average_sentiment: avgSentiment,
      recent_analyses_7days: recentAnalyses
    };
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
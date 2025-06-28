---
title: "チュートリアル8: 実践応用（TypeScript版） 🚀"
version: "1.0"
last_updated: "2025-06-28"
author: "mcp starter"
reviewers: []
related_docs: ["04-practical-usage.md", "07-data-handling-ts.md"]
status: "approved"
dependencies:
  upstream: ["07-data-handling-ts.md"]
  downstream: []
impact_level: "high"
---

# チュートリアル8: 実践応用（TypeScript版） 🚀

**所要時間: 40分**  
**前提知識: [チュートリアル7](07-data-handling-ts.md)完了、Web API・非同期処理の基本知識**

## 🎯 今回の目標

- TypeScriptでWeb APIと連携するツールを作成
- 複数機能を組み合わせた複合ツールを実装
- 実用的なビジネスロジックを学習（TypeScript版）
- 型安全な非同期処理とエラー処理をマスター

## 🌐 プロジェクト概要

今回は**「スマート情報収集&分析システム（TypeScript版）」**を作ります。

### 主要機能
1. **Web情報収集**: CheerioとAxiosを使ったWebスクレイピング
2. **テキスト分析**: Sentiment.jsとNatural.jsによる感情分析・キーワード抽出  
3. **データ保存**: SQLiteによる型安全なデータ永続化
4. **レポート生成**: JSON形式での分析結果出力
5. **RSS対応**: フィード分析機能

## 📝 ステップ1: プロジェクト準備

### プロジェクトディレクトリ作成
```bash
mkdir smart-analyzer-ts
cd smart-analyzer-ts
```

### 依存関係のインストール
```bash
npm init -y
```

### package.jsonの設定
```json
{
  "name": "smart-analyzer-ts",
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
    "sqlite3": "^5.1.6",
    "cheerio": "^1.0.0-rc.12",
    "axios": "^1.6.0",
    "sentiment": "^5.0.2",
    "natural": "^6.6.0",
    "feedparser": "^2.2.10"
  },
  "devDependencies": {
    "@types/node": "^latest",
    "@types/sqlite3": "^3.1.11",
    "@types/sentiment": "^5.0.4",
    "@types/natural": "^5.1.5",
    "@types/feedparser": "^2.2.2",
    "tsx": "^latest",
    "typescript": "^latest"
  }
}
```

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

### プロジェクト構造
```
smart-analyzer-ts/
├── server.ts              # メインサーバー
├── database.ts             # データベース管理
├── web-scraper.ts          # Web情報収集
├── text-analyzer.ts        # テキスト分析
├── test-client.ts          # テストクライアント
├── config.json             # 設定ファイル
├── package.json            # プロジェクト設定
├── tsconfig.json           # TypeScript設定
└── data/                   # データファイル
    ├── analysis.db         # 分析結果DB
    └── reports/            # 生成レポート
```

## 🏗️ ステップ2: データベース設計

### ファイル作成: `database.ts`
```typescript
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
  status: 'pending' | 'scraped' | 'failed';
}

export interface AnalysisRecord {
  id?: number;
  url_id: number;
  sentiment_score: number;
  sentiment_label: string;
  keywords: string; // JSON形式
  word_count: number;
  analyzed_at?: string;
}

export interface ReportRecord {
  id?: number;
  name: string;
  description?: string;
  data: string; // JSON形式
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
        FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
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

  async insertUrl(record: Omit<UrlRecord, 'id' | 'scraped_at'>): Promise<number> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    const result = await this.db.run(
      'INSERT OR REPLACE INTO urls (url, title, content, status) VALUES (?, ?, ?, ?)',
      [record.url, record.title || '', record.content || '', record.status]
    );

    if (!result.lastID) {
      throw new Error('URL挿入に失敗しました');
    }

    return result.lastID;
  }

  async insertAnalysis(record: Omit<AnalysisRecord, 'id' | 'analyzed_at'>): Promise<number> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    const result = await this.db.run(
      'INSERT INTO analyses (url_id, sentiment_score, sentiment_label, keywords, word_count) VALUES (?, ?, ?, ?, ?)',
      [record.url_id, record.sentiment_score, record.sentiment_label, record.keywords, record.word_count]
    );

    if (!result.lastID) {
      throw new Error('分析結果挿入に失敗しました');
    }

    return result.lastID;
  }

  async insertReport(record: Omit<ReportRecord, 'id' | 'created_at'>): Promise<number> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    const result = await this.db.run(
      'INSERT INTO reports (name, description, data, file_path) VALUES (?, ?, ?, ?)',
      [record.name, record.description || '', record.data, record.file_path || '']
    );

    if (!result.lastID) {
      throw new Error('レポート挿入に失敗しました');
    }

    return result.lastID;
  }

  async getAnalysisHistory(limit: number = 10): Promise<any[]> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    const rows = await this.db.all(`
      SELECT u.url, u.title, a.sentiment_score, a.sentiment_label,
             a.word_count, a.analyzed_at
      FROM analyses a
      JOIN urls u ON a.url_id = u.id
      ORDER BY a.analyzed_at DESC
      LIMIT ?
    `, [limit]);

    return rows;
  }

  async searchBySentiment(sentimentLabel: string): Promise<any[]> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    const rows = await this.db.all(`
      SELECT u.url, u.title, a.sentiment_score, a.sentiment_label,
             a.word_count, a.analyzed_at
      FROM analyses a
      JOIN urls u ON a.url_id = u.id
      WHERE a.sentiment_label = ?
      ORDER BY a.sentiment_score DESC
    `, [sentimentLabel]);

    return rows;
  }

  async getKeywordAnalysis(minFrequency: number = 0.01): Promise<any[]> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    const rows = await this.db.all(
      'SELECT keywords FROM analyses WHERE keywords IS NOT NULL'
    );

    // キーワード集計ロジック（TypeScript）
    const allKeywords: { [word: string]: number } = {};
    
    for (const row of rows) {
      try {
        const keywords = JSON.parse(row.keywords);
        for (const kw of keywords) {
          if (kw.frequency >= minFrequency) {
            allKeywords[kw.word] = (allKeywords[kw.word] || 0) + kw.count;
          }
        }
      } catch (error) {
        // JSON パースエラーを無視
        continue;
      }
    }

    // 上位20件をソート
    const topKeywords = Object.entries(allKeywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, total_count: count }));

    return topKeywords;
  }

  async generateSummaryStats(): Promise<any> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    // 全体統計
    const totalResult = await this.db.get('SELECT COUNT(*) as total FROM analyses');
    const total = totalResult?.total || 0;

    // 感情分布
    const sentimentRows = await this.db.all(`
      SELECT sentiment_label, COUNT(*) as count
      FROM analyses
      GROUP BY sentiment_label
    `);
    const sentimentDist: { [key: string]: number } = {};
    sentimentRows.forEach(row => {
      sentimentDist[row.sentiment_label] = row.count;
    });

    // 平均感情スコア
    const avgResult = await this.db.get('SELECT AVG(sentiment_score) as avg_score FROM analyses');
    const avgSentiment = avgResult?.avg_score || 0;

    // 最近の分析
    const recentResult = await this.db.get(`
      SELECT COUNT(*) as recent_count
      FROM analyses
      WHERE analyzed_at > datetime('now', '-7 days')
    `);
    const recentAnalyses = recentResult?.recent_count || 0;

    return {
      total_analyses: total,
      sentiment_distribution: sentimentDist,
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
}
```

## 🕷️ ステップ3: Web情報収集モジュール

### ファイル作成: `web-scraper.ts`
```typescript
/**
 * Web情報収集モジュール - TypeScript版
 */
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

export interface ScrapeResult {
  success: boolean;
  url: string;
  title?: string;
  content?: string;
  content_length?: number;
  scraped_at: number;
  error?: string;
}

export interface LinkResult {
  url: string;
  links: string[];
  error?: string;
}

export class WebScraper {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
  }

  async scrapeUrl(url: string): Promise<ScrapeResult> {
    try {
      const response: AxiosResponse<string> = await this.axiosInstance.get(url);
      
      const $ = cheerio.load(response.data);

      // タイトル取得
      const title = $('title').text().trim() || "No Title";

      // 不要要素を削除
      $('script, style, nav, footer, header, aside, .advertisement, #sidebar').remove();

      // 本文取得（基本的なクリーニング）
      const content = $('body').text()
        .replace(/\s+/g, ' ')  // 余分な空白を削除
        .trim()
        .slice(0, 5000);  // 最初の5000文字

      return {
        success: true,
        url: url,
        title: title,
        content: content,
        content_length: content.length,
        scraped_at: Date.now()
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          url: url,
          error: `HTTP Error: ${error.message}`,
          scraped_at: Date.now()
        };
      } else {
        return {
          success: false,
          url: url,
          error: `Parse Error: ${error instanceof Error ? error.message : String(error)}`,
          scraped_at: Date.now()
        };
      }
    }
  }

  async extractLinks(url: string, baseUrl?: string): Promise<string[]> {
    try {
      const response = await this.axiosInstance.get(url);
      const $ = cheerio.load(response.data);
      const base = baseUrl || url;

      const links: string[] = [];
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          try {
            const fullUrl = new URL(href, base).href;
            if (this.isValidUrl(fullUrl)) {
              links.push(fullUrl);
            }
          } catch {
            // 無効なURL
          }
        }
      });

      return [...new Set(links)]; // 重複除去

    } catch (error) {
      return [];
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

// グローバルインスタンス
export const scraper = new WebScraper();
```

## 📊 ステップ4: テキスト分析モジュール

### ファイル作成: `text-analyzer.ts`
```typescript
/**
 * テキスト分析モジュール - TypeScript版
 */
import Sentiment from 'sentiment';
import natural from 'natural';

export interface SentimentResult {
  score: number;
  label: 'positive' | 'negative' | 'neutral';
  comparative?: number;
  method: string;
}

export interface KeywordResult {
  word: string;
  count: number;
  frequency: number;
}

export interface TextStatistics {
  word_count: number;
  sentence_count: number;
  character_count: number;
  average_word_length: number;
  average_sentence_length: number;
}

export interface AnalysisResult {
  sentiment: SentimentResult;
  keywords: KeywordResult[];
  statistics: TextStatistics;
  analyzed_at: number;
}

export class TextAnalyzer {
  private sentiment: Sentiment;
  private stemmer: typeof natural.PorterStemmer;
  private stopWords: Set<string>;

  constructor() {
    this.sentiment = new Sentiment();
    this.stemmer = natural.PorterStemmer;
    this.stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'this', 'but', 'they', 'have',
      'had', 'what', 'said', 'each', 'which', 'she', 'do', 'how', 'their',
      'if', 'up', 'out', 'many', 'then', 'them', 'these', 'so', 'some',
      'her', 'would', 'make', 'like', 'into', 'him', 'time', 'two', 'more',
      'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call',
      'who', 'oil', 'sit', 'now', 'find', 'down', 'day', 'did', 'get',
      'come', 'made', 'may', 'part'
    ]);
  }

  analyzeSentiment(text: string): SentimentResult {
    const result = this.sentiment.analyze(text);
    
    // ラベル判定
    let label: 'positive' | 'negative' | 'neutral';
    if (result.comparative > 0.1) {
      label = 'positive';
    } else if (result.comparative < -0.1) {
      label = 'negative';
    } else {
      label = 'neutral';
    }

    return {
      score: result.score,
      label: label,
      comparative: result.comparative,
      method: 'sentiment-js'
    };
  }

  extractKeywords(text: string, topN: number = 10): KeywordResult[] {
    // テキストクリーニング
    const cleanText = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = cleanText.split(' ');

    // ストップワード除去と語幹抽出
    const filteredWords = words
      .filter(word => word.length > 2 && !this.stopWords.has(word))
      .map(word => this.stemmer.stem(word));

    // 頻度カウント
    const wordCounts: { [word: string]: number } = {};
    filteredWords.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    // 上位キーワード取得
    const topKeywords = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, topN)
      .map(([word, count]) => ({
        word: word,
        count: count,
        frequency: count / filteredWords.length
      }));

    return topKeywords;
  }

  getTextStatistics(text: string): TextStatistics {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);

    const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);

    return {
      word_count: words.length,
      sentence_count: sentences.length,
      character_count: text.length,
      average_word_length: words.length > 0 ? totalWordLength / words.length : 0,
      average_sentence_length: sentences.length > 0 ? words.length / sentences.length : 0
    };
  }

  fullAnalysis(text: string): AnalysisResult {
    const sentiment = this.analyzeSentiment(text);
    const keywords = this.extractKeywords(text);
    const statistics = this.getTextStatistics(text);

    return {
      sentiment: sentiment,
      keywords: keywords,
      statistics: statistics,
      analyzed_at: Date.now()
    };
  }
}

// グローバルインスタンス
export const analyzer = new TextAnalyzer();
```

## 📈 ステップ5: メインMCPサーバー作成

### ファイル作成: `server.ts`
```typescript
/**
 * スマート情報収集&分析システム - TypeScript版
 * FastMCPサーバー
 */
import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { AnalysisDatabase } from './database.js';
import { scraper, ScrapeResult } from './web-scraper.js';
import { analyzer, AnalysisResult } from './text-analyzer.js';
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
const db = new AnalysisDatabase(config.database?.path);
await db.initialize();

// サーバー初期化
const server = new FastMCP({
  name: config.server?.name || "Smart Information Analyzer",
  version: (config.server?.version || "1.0.0") as `${number}.${number}.${number}`
});

// 内部用のスクレイピング＆分析関数
async function internalScrapeAndAnalyze(url: string): Promise<any> {
  try {
    // 1. Web情報収集
    const scrapeResult: ScrapeResult = await scraper.scrapeUrl(url);
    
    if (!scrapeResult.success) {
      return {
        success: false,
        error: scrapeResult.error,
        stage: "scraping"
      };
    }

    // 2. データベースに保存
    const urlId = await db.insertUrl({
      url: url,
      title: scrapeResult.title || '',
      content: scrapeResult.content || '',
      status: 'scraped'
    });

    // 3. テキスト分析
    const analysisResult: AnalysisResult = analyzer.fullAnalysis(scrapeResult.content || '');

    // 4. 分析結果を保存
    const analysisId = await db.insertAnalysis({
      url_id: urlId,
      sentiment_score: analysisResult.sentiment.score,
      sentiment_label: analysisResult.sentiment.label,
      keywords: JSON.stringify(analysisResult.keywords),
      word_count: analysisResult.statistics.word_count
    });

    return {
      success: true,
      url: url,
      title: scrapeResult.title,
      content_length: scrapeResult.content_length,
      sentiment: analysisResult.sentiment,
      top_keywords: analysisResult.keywords.slice(0, 5),
      statistics: analysisResult.statistics,
      url_id: urlId,
      analysis_id: analysisId
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stage: "processing"
    };
  }
}

// ツール1: URLを取得して分析する（統合処理）
server.addTool({
  name: "scrape_and_analyze",
  description: "URLを取得して分析する（統合処理）",
  parameters: z.object({
    url: z.string().url().describe("分析対象のURL")
  }),
  execute: async (args) => {
    const result = await internalScrapeAndAnalyze(args.url);
    return JSON.stringify(result);
  }
});

// ツール2: 複数URLを一括分析
server.addTool({
  name: "batch_analyze_urls",
  description: "複数URLを一括分析（最大10件）",
  parameters: z.object({
    urls: z.array(z.string().url()).max(10).describe("分析対象URLのリスト（最大10件）")
  }),
  execute: async (args) => {
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const url of args.urls) {
      const result = await internalScrapeAndAnalyze(url);
      results.push({
        url: url,
        success: result.success,
        result: result
      });

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // レート制限（1秒待機）
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return JSON.stringify({
      success: true,
      total_urls: args.urls.length,
      successful: successful,
      failed: failed,
      results: results
    });
  }
});

// ツール3: 分析履歴を取得
server.addTool({
  name: "get_analysis_history",
  description: "分析履歴を取得",
  parameters: z.object({
    limit: z.number().int().min(1).max(100).default(10).describe("取得する件数")
  }),
  execute: async (args) => {
    try {
      const history = await db.getAnalysisHistory(args.limit);
      
      return JSON.stringify({
        success: true,
        history: history,
        count: history.length
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// ツール4: 感情ラベルで検索
server.addTool({
  name: "search_by_sentiment",
  description: "感情ラベルで検索",
  parameters: z.object({
    sentiment_label: z.enum(['positive', 'negative', 'neutral']).describe("感情ラベル")
  }),
  execute: async (args) => {
    try {
      const results = await db.searchBySentiment(args.sentiment_label);
      
      return JSON.stringify({
        success: true,
        sentiment_label: args.sentiment_label,
        results: results,
        count: results.length
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// ツール5: キーワード分析
server.addTool({
  name: "get_keyword_analysis",
  description: "キーワード分析",
  parameters: z.object({
    min_frequency: z.number().min(0).max(1).default(0.01).describe("最小頻度閾値")
  }),
  execute: async (args) => {
    try {
      const topKeywords = await db.getKeywordAnalysis(args.min_frequency);
      
      return JSON.stringify({
        success: true,
        top_keywords: topKeywords,
        analyzed_documents: "N/A" // TODO: 実装可能
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// ツール6: サマリーレポート生成
server.addTool({
  name: "generate_summary_report",
  description: "サマリーレポート生成",
  parameters: z.object({}),
  execute: async () => {
    try {
      const statistics = await db.generateSummaryStats();
      
      const report = {
        success: true,
        summary: statistics,
        generated_at: Date.now()
      };

      // レポート保存
      await db.insertReport({
        name: "Summary Report",
        description: `Generated summary report for ${statistics.total_analyses} analyses`,
        data: JSON.stringify(report)
      });

      return JSON.stringify(report);
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// ツール7: RSSフィード分析（応用例）
server.addTool({
  name: "analyze_rss_feed",
  description: "RSSフィード分析",
  parameters: z.object({
    rss_url: z.string().url().describe("RSSフィードのURL"),
    max_items: z.number().int().min(1).max(20).default(10).describe("分析する記事数（最大20件）")
  }),
  execute: async (args) => {
    try {
      // 簡易RSS解析（実際のfeedparserライブラリを使用推奨）
      const feedContent = await scraper.scrapeUrl(args.rss_url);
      
      if (!feedContent.success) {
        return JSON.stringify({
          success: false,
          error: "RSS取得に失敗しました",
          stage: "feed_fetching"
        });
      }

      // NOTE: 本格的なRSS解析にはfeedparserなどの専用ライブラリを使用することを推奨
      // ここでは簡単な例として実装
      
      return JSON.stringify({
        success: true,
        message: "RSS分析機能は開発中です。feedparserライブラリとの統合を推奨します。",
        feed_url: args.rss_url,
        max_items: args.max_items
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// ツール8: サーバー情報取得
server.addTool({
  name: "get_server_info",
  description: "サーバーの情報を取得する",
  parameters: z.object({}),
  execute: async () => {
    const serverConfig = config.server || {};
    
    const info = {
      server_name: serverConfig.name || "Smart Information Analyzer - TypeScript",
      version: serverConfig.version || "1.0.0",
      description: serverConfig.description || "スマート情報収集&分析システム - TypeScript版",
      author: serverConfig.author || "あなたの名前",
      database_path: config.database?.path || "data/analysis.db",
      tools_count: 8,
      runtime: "Node.js",
      language: "TypeScript",
      libraries: {
        web_scraping: "Cheerio + Axios",
        text_analysis: "Sentiment.js + Natural.js",
        database: "SQLite3"
      }
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

## 🧪 ステップ6: テスト実行

### 設定ファイル: `config.json`
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

### テストクライアント作成: `test-client.ts`
```typescript
/**
 * スマート分析サーバーをテストするクライアント - TypeScript版
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

class SmartAnalyzerTestClient {
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
    console.log('🚀 スマート分析サーバーテストクライアント - TypeScript版');
    console.log('===============================================');
    
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
        name: 'smart-analyzer-test-client-ts',
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
    console.log('=== 基本分析 ===');
    console.log('analyze <URL> - 単一URL分析');
    console.log('batch <URL1> <URL2> ... - 複数URL一括分析（最大10件）');
    console.log('history [件数] - 分析履歴表示（デフォルト10件）');
    console.log('=== 検索・分析 ===');
    console.log('sentiment <positive|negative|neutral> - 感情別検索');
    console.log('keywords [最小頻度] - キーワード分析（デフォルト0.01）');
    console.log('report - サマリーレポート生成');
    console.log('=== 応用機能 ===');
    console.log('rss <RSS_URL> [記事数] - RSSフィード分析（最大20件）');
    console.log('info - サーバー情報表示');
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

          case 'analyze':
            if (args.length < 2) {
              console.log('❌ 使用法: analyze <URL>');
            } else {
              await this.sendRequest('tools/call', {
                name: 'scrape_and_analyze',
                arguments: { url: args[1] }
              });
            }
            break;

          case 'batch':
            if (args.length < 2) {
              console.log('❌ 使用法: batch <URL1> <URL2> ...');
            } else {
              const urls = args.slice(1, 11); // 最大10件
              await this.sendRequest('tools/call', {
                name: 'batch_analyze_urls',
                arguments: { urls: urls }
              });
            }
            break;

          case 'history':
            await this.sendRequest('tools/call', {
              name: 'get_analysis_history',
              arguments: {
                limit: parseInt(args[1]) || 10
              }
            });
            break;

          case 'sentiment':
            if (args.length < 2) {
              console.log('❌ 使用法: sentiment <positive|negative|neutral>');
            } else {
              await this.sendRequest('tools/call', {
                name: 'search_by_sentiment',
                arguments: { sentiment_label: args[1] }
              });
            }
            break;

          case 'keywords':
            await this.sendRequest('tools/call', {
              name: 'get_keyword_analysis',
              arguments: {
                min_frequency: parseFloat(args[1]) || 0.01
              }
            });
            break;

          case 'report':
            await this.sendRequest('tools/call', {
              name: 'generate_summary_report',
              arguments: {}
            });
            break;

          case 'rss':
            if (args.length < 2) {
              console.log('❌ 使用法: rss <RSS_URL> [記事数]');
            } else {
              await this.sendRequest('tools/call', {
                name: 'analyze_rss_feed',
                arguments: {
                  rss_url: args[1],
                  max_items: parseInt(args[2]) || 10
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
const client = new SmartAnalyzerTestClient();
client.start().catch(console.error);
```

### テスト実行
```bash
# サーバー起動
npm run dev

# 別ターミナルでテストクライアント
npm run test
```

### 基本テスト手順
```bash
# 1. サーバー情報確認
info

# 2. 単一URL分析
analyze https://example.com

# 3. 複数URL一括分析
batch https://news1.com https://news2.com

# 4. 分析履歴確認
history 5

# 5. ポジティブな記事検索
sentiment positive

# 6. キーワード分析
keywords 0.02

# 7. サマリーレポート生成
report
```

## 📊 TypeScriptの特徴とメリット

### 型安全性
```typescript
// 厳密な型定義
interface ScrapeResult {
  success: boolean;
  url: string;
  title?: string;
  content?: string;
  error?: string;
}

// コンパイル時エラー検出
const processResult = (result: ScrapeResult) => {
  if (result.success) {
    console.log(result.title); // 型安全
  }
};
```

### 非同期処理の型安全性
```typescript
// Promise の型指定
async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const scrapeResult = await scraper.scrapeUrl(url);
  return analyzer.fullAnalysis(scrapeResult.content || '');
}
```

### エラーハンドリング
```typescript
// 包括的なエラー処理
try {
  const result = await complexOperation();
  return { success: true, data: result };
} catch (error) {
  return { 
    success: false, 
    error: error instanceof Error ? error.message : String(error) 
  };
}
```

## ✅ 完成度チェック

以下を確認してください：

- [ ] TypeScriptのコンパイルが成功する
- [ ] URLスクレイピングが動作する
- [ ] 感情分析が実行される
- [ ] キーワード抽出が機能する
- [ ] データベース保存が正常に動作する
- [ ] 分析履歴が取得できる
- [ ] レポート生成が機能する
- [ ] 型安全性が確保されている
- [ ] エラーハンドリングが適切に動作する

## 🎯 応用課題

### チャレンジ問題
1. **RSS feed分析**: `feedparser`ライブラリとの統合
2. **画像分析**: OCR機能の追加（Tesseract.js等）
3. **多言語対応**: 日本語テキストの感情分析
4. **リアルタイム監視**: WebSocketを使ったライブ分析

### 実装例（多言語対応）
```typescript
// 日本語対応の感情分析
import kuromoji from 'kuromoji';

class JapaneseTextAnalyzer {
  private tokenizer: any;

  async initialize() {
    this.tokenizer = await new Promise((resolve, reject) => {
      kuromoji.builder({dicPath: "node_modules/kuromoji/dict"})
        .build((err: any, tokenizer: any) => {
          if (err) reject(err);
          else resolve(tokenizer);
        });
    });
  }

  analyzeJapanese(text: string): any[] {
    return this.tokenizer.tokenize(text);
  }
}
```

## 🎉 学習成果

このチュートリアルで習得したスキル：

- ✅ **TypeScriptでのWeb API連携**: Axios、Cheerioによる型安全なスクレイピング
- ✅ **高度な非同期処理**: Promise/async-awaitパターンの完全活用
- ✅ **包括的エラーハンドリング**: try-catch文とカスタムエラー型
- ✅ **モジュラー設計**: 機能別の独立したTypeScriptモジュール
- ✅ **型安全なデータベース操作**: SQLite3との統合
- ✅ **実用的なビジネスロジック**: 実世界で使える分析システム

### Python版 vs TypeScript版の比較

| 項目 | Python版 | TypeScript版 |
|---|---|---|
| **Web スクレイピング** | BeautifulSoup + requests | Cheerio + Axios |
| **感情分析** | TextBlob | Sentiment.js |
| **自然言語処理** | 基本的な処理 | Natural.js |
| **型安全性** | ランタイム | コンパイル時 |
| **エラー検出** | 実行時 | 開発時 |
| **IDE支援** | 基本的 | 高度（型推論・補完） |
| **パフォーマンス** | 中程度 | 高速 |
| **エコシステム** | 豊富 | 成長中 |

## 🔄 次のステップ

TypeScript版の実践応用をマスターしたら、次はデプロイについて学びましょう！

**参考**: Python版のデプロイチュートリアル [チュートリアル5: デプロイ](05-deployment.md) を参考に、TypeScript版のデプロイ戦略も検討してみてください。

---

## 更新履歴

| バージョン | 更新日 | 更新者 | 更新内容 | 影響ドキュメント |
|---|-----|-----|----|---|
| 1.0 | 2025-06-28 | mcp starter | 初版作成（TypeScript版）、src/07-smart-analyzer-tsベースで作成 | 04-practical-usage.md, 07-data-handling-ts.md |

---

💡 **ヒント**: TypeScriptの型システムを活用することで、大規模なシステムでも保守性の高い実装が可能です。特に複数の非同期処理を組み合わせる場合、型安全性が開発効率と品質向上に大きく貢献します！
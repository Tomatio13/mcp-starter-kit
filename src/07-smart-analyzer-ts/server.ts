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
  description: "複数URLを一括分析",
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
      const keywordRecords = await db.getAllKeywords();
      
      const allKeywords = new Map<string, number>();
      
      for (const record of keywordRecords) {
        try {
          const keywords = JSON.parse(record.keywords);
          for (const kw of keywords) {
            if (kw.frequency >= args.min_frequency) {
              allKeywords.set(kw.word, (allKeywords.get(kw.word) || 0) + kw.count);
            }
          }
        } catch {
          // JSON解析エラーは無視
        }
      }
      
      const topKeywords = Array.from(allKeywords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word, count]) => ({ word, total_count: count }));
      
      return JSON.stringify({
        success: true,
        top_keywords: topKeywords,
        analyzed_documents: keywordRecords.length
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
      const statistics = await db.getAnalysisStatistics();
      
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
  description: "RSSフィードを分析（応用例）",
  parameters: z.object({
    rss_url: z.string().url().describe("RSSフィードのURL"),
    max_items: z.number().int().min(1).max(20).default(10).describe("分析する最大記事数")
  }),
  execute: async (args) => {
    try {
      // RSSパーサーが必要な場合は別途実装
      // ここでは簡単な例として、RSSページ自体をスクレイピング
      const scrapeResult = await scraper.scrapeUrl(args.rss_url);
      
      if (!scrapeResult.success) {
        return JSON.stringify({
          success: false,
          error: "RSS feed scraping failed",
          details: scrapeResult.error
        });
      }
      
      // URLを抽出（簡易実装）
      const urls = await scraper.extractLinks(args.rss_url);
      const selectedUrls = urls.slice(0, args.max_items);
      
      const results = [];
      for (const url of selectedUrls) {
        const result = await internalScrapeAndAnalyze(url);
        results.push({
          url: url,
          result: result
        });
        
        // レート制限
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return JSON.stringify({
        success: true,
        feed_url: args.rss_url,
        analyzed_items: results.length,
        results: results
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
    
    return JSON.stringify({
      server_name: serverConfig.name || "Smart Information Analyzer",
      version: serverConfig.version || "1.0.0",
      description: serverConfig.description || "スマート情報収集&分析システム - TypeScript版",
      author: serverConfig.author || "あなたの名前",
      database_path: db.databasePath,
      tools_count: 8,
      runtime: "Node.js",
      language: "TypeScript",
      features: [
        "Web scraping",
        "Sentiment analysis",
        "Keyword extraction",
        "Text statistics",
        "Batch processing",
        "Data persistence"
      ]
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
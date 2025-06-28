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
      const response: AxiosResponse = await this.axiosInstance.get(url);
      
      const $ = cheerio.load(response.data);
      
      // タイトル取得
      const title = $('title').text().trim() || "No Title";
      
      // 不要な要素を削除
      $('script, style, nav, footer, header, .advertisement, .ads').remove();
      
      // 本文取得
      let content = $('body').text();
      content = content.replace(/\s+/g, ' ').trim(); // 余分な空白を削除
      
      return {
        success: true,
        url: url,
        title: title,
        content: content.substring(0, 5000), // 最初の5000文字
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
      const response: AxiosResponse = await this.axiosInstance.get(url);
      const $ = cheerio.load(response.data);
      
      const base = baseUrl || url;
      const links: string[] = [];
      
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          try {
            const fullUrl = new URL(href, base).toString();
            if (this.isValidUrl(fullUrl)) {
              links.push(fullUrl);
            }
          } catch {
            // 無効なURLは無視
          }
        }
      });
      
      // 重複除去
      return [...new Set(links)];
    } catch (error) {
      return [];
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

// エクスポート用のインスタンス
export const scraper = new WebScraper();
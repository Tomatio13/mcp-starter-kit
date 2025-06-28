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
  calculation?: any;
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
  private tokenizer: any;
  private stopWords: Set<string>;

  constructor() {
    this.sentiment = new Sentiment();
    this.tokenizer = new natural.WordTokenizer();
    this.stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'this', 'but', 'they', 'have',
      'had', 'what', 'said', 'each', 'which', 'she', 'do', 'how', 'their',
      'if', 'up', 'out', 'many', 'then', 'them', 'these', 'so', 'some',
      'her', 'would', 'make', 'like', 'into', 'him', 'time', 'two', 'more',
      'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call',
      'who', 'oil', 'sit', 'now', 'find', 'down', 'day', 'did', 'get',
      'come', 'made', 'may', 'part', 'or', 'not', 'can', 'one', 'all',
      'also', 'about', 'when', 'new', 'use', 'see', 'just', 'only',
      'other', 'over', 'after', 'work', 'through', 'very', 'back',
      'where', 'much', 'before', 'right', 'too', 'any', 'same', 'how'
    ]);
  }

  analyzeSentiment(text: string): SentimentResult {
    try {
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
        score: result.comparative,
        label: label,
        comparative: result.comparative,
        method: 'sentiment-js',
        calculation: {
          score: result.score,
          tokens: result.tokens,
          words: result.words,
          positive: result.positive,
          negative: result.negative
        }
      };
    } catch (error) {
      // エラー時は簡易分析にフォールバック
      return this.simpleSentimentAnalysis(text);
    }
  }

  private simpleSentimentAnalysis(text: string): SentimentResult {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 
                          'fantastic', 'awesome', 'perfect', 'best', 'love'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 
                          'hate', 'disgusting', 'disappointing', 'poor', 'fail'];
    
    const textLower = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
    
    const total = positiveCount + negativeCount;
    let score = 0;
    let label: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    if (total > 0) {
      score = (positiveCount - negativeCount) / total;
      if (score > 0.2) {
        label = 'positive';
      } else if (score < -0.2) {
        label = 'negative';
      }
    }
    
    return {
      score: score,
      label: label,
      method: 'simple',
      calculation: {
        positive_count: positiveCount,
        negative_count: negativeCount
      }
    };
  }

  extractKeywords(text: string, topN = 10): KeywordResult[] {
    // テキストクリーニング
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    const words = this.tokenizer.tokenize(cleanText) || [];
    
    // ストップワード除去と長さフィルタ
    const filteredWords = words.filter((word: string) => 
      !this.stopWords.has(word) && 
      word.length > 2 && 
      /^[a-zA-Z]+$/.test(word) // アルファベットのみ
    );
    
    // ステミング（語幹抽出）
    const stemmedWords = filteredWords.map((word: string) => natural.PorterStemmer.stem(word));
    
    // 頻度カウント
    const wordCounts = new Map<string, number>();
    stemmedWords.forEach((word: string) => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
    
    // 上位キーワード取得
    const sortedWords = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);
    
    return sortedWords.map(([word, count]) => ({
      word: word,
      count: count,
      frequency: count / filteredWords.length
    }));
  }

  getTextStatistics(text: string): TextStatistics {
    const words = this.tokenizer.tokenize(text) || [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const totalWordLength = words.reduce((sum: number, word: string) => sum + word.length, 0);
    
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

// エクスポート用のインスタンス
export const analyzer = new TextAnalyzer();
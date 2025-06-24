"""
スマート情報収集&分析システム
FastMCPサーバー
"""
from fastmcp import FastMCP
from database import db
from web_scraper import scraper
from text_analyzer import analyzer
import json
import time
from typing import Dict, List

app = FastMCP("Smart Information Analyzer")



def _internal_scrape_and_analyze(url: str) -> Dict:
    """内部用のスクレイピング＆分析関数（ツール間で共有）"""
    try:
        # 1. Web情報収集
        scrape_result = scraper.scrape_url(url)
        
        if not scrape_result["success"]:
            return {
                "success": False,
                "error": scrape_result["error"],
                "stage": "scraping"
            }
        
        # 2. データベースに保存
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO urls (url, title, content, status)
                VALUES (?, ?, ?, 'scraped')
            """, (url, scrape_result["title"], scrape_result["content"]))
            url_id = cursor.lastrowid
        
        # 3. テキスト分析
        analysis_result = analyzer.full_analysis(scrape_result["content"])
        
        # 4. 分析結果を保存
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO analyses (url_id, sentiment_score, sentiment_label, 
                                    keywords, word_count)
                VALUES (?, ?, ?, ?, ?)
            """, (
                url_id,
                analysis_result["sentiment"]["score"],
                analysis_result["sentiment"]["label"],
                json.dumps(analysis_result["keywords"]),
                analysis_result["statistics"]["word_count"]
            ))
            analysis_id = cursor.lastrowid
        
        return {
            "success": True,
            "url": url,
            "title": scrape_result["title"],
            "content_length": len(scrape_result["content"]),
            "sentiment": analysis_result["sentiment"],
            "top_keywords": analysis_result["keywords"][:5],
            "statistics": analysis_result["statistics"],
            "url_id": url_id,
            "analysis_id": analysis_id
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "stage": "processing"
        }

@app.tool
def scrape_and_analyze(url: str) -> Dict:
    """URLを取得して分析する（統合処理）
    
    Args:
        url: 分析対象のURL
        
    Returns:
        スクレイピングと分析の結果
    """
    return _internal_scrape_and_analyze(url)

@app.tool
def batch_analyze_urls(urls: List[str]) -> Dict:
    """複数URLを一括分析
    
    Args:
        urls: 分析対象URLのリスト
        
    Returns:
        一括分析の結果
    """
    results = []
    successful = 0
    failed = 0
    
    for url in urls:
        result = _internal_scrape_and_analyze(url)
        results.append({
            "url": url,
            "success": result["success"],
            "result": result
        })
        
        if result["success"]:
            successful += 1
        else:
            failed += 1
        
        # レート制限（1秒待機）
        time.sleep(1)
    
    return {
        "success": True,
        "total_urls": len(urls),
        "successful": successful,
        "failed": failed,
        "results": results
    }

@app.tool
def get_analysis_history(limit: int = 10) -> Dict:
    """分析履歴を取得
    
    Args:
        limit: 取得する件数
        
    Returns:
        分析履歴
    """
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT u.url, u.title, a.sentiment_score, a.sentiment_label,
                       a.word_count, a.analyzed_at
                FROM analyses a
                JOIN urls u ON a.url_id = u.id
                ORDER BY a.analyzed_at DESC
                LIMIT ?
            """, (limit,))
            
            history = [dict(row) for row in cursor.fetchall()]
            
            return {
                "success": True,
                "history": history,
                "count": len(history)
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.tool
def search_by_sentiment(sentiment_label: str) -> Dict:
    """感情ラベルで検索
    
    Args:
        sentiment_label: 感情ラベル（positive/negative/neutral）
        
    Returns:
        検索結果
    """
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT u.url, u.title, a.sentiment_score, a.sentiment_label,
                       a.word_count, a.analyzed_at
                FROM analyses a
                JOIN urls u ON a.url_id = u.id
                WHERE a.sentiment_label = ?
                ORDER BY a.sentiment_score DESC
            """, (sentiment_label,))
            
            results = [dict(row) for row in cursor.fetchall()]
            
            return {
                "success": True,
                "sentiment_label": sentiment_label,
                "results": results,
                "count": len(results)
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.tool
def get_keyword_analysis(min_frequency: float = 0.01) -> Dict:
    """キーワード分析
    
    Args:
        min_frequency: 最小頻度閾値
        
    Returns:
        キーワード分析結果
    """
    try:
        from collections import Counter
        
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT keywords FROM analyses WHERE keywords IS NOT NULL")
            
            all_keywords = Counter()
            for row in cursor.fetchall():
                keywords = json.loads(row["keywords"])
                for kw in keywords:
                    if kw["frequency"] >= min_frequency:
                        all_keywords[kw["word"]] += kw["count"]
            
            top_keywords = all_keywords.most_common(20)
            
            return {
                "success": True,
                "top_keywords": [
                    {"word": word, "total_count": count}
                    for word, count in top_keywords
                ],
                "analyzed_documents": cursor.rowcount
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.tool
def generate_summary_report() -> Dict:
    """サマリーレポート生成
    
    Returns:
        サマリーレポート
    """
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            # 全体統計
            cursor.execute("SELECT COUNT(*) as total FROM analyses")
            total_analyses = cursor.fetchone()["total"]
            
            # 感情分布
            cursor.execute("""
                SELECT sentiment_label, COUNT(*) as count
                FROM analyses
                GROUP BY sentiment_label
            """)
            sentiment_dist = {row["sentiment_label"]: row["count"] for row in cursor.fetchall()}
            
            # 平均感情スコア
            cursor.execute("SELECT AVG(sentiment_score) as avg_score FROM analyses")
            avg_sentiment = cursor.fetchone()["avg_score"] or 0
            
            # 最近の分析
            cursor.execute("""
                SELECT COUNT(*) as recent_count
                FROM analyses
                WHERE analyzed_at > datetime('now', '-7 days')
            """)
            recent_analyses = cursor.fetchone()["recent_count"]
            
            report = {
                "success": True,
                "summary": {
                    "total_analyses": total_analyses,
                    "sentiment_distribution": sentiment_dist,
                    "average_sentiment": avg_sentiment,
                    "recent_analyses_7days": recent_analyses
                },
                "generated_at": time.time()
            }
            
            # レポート保存
            cursor.execute("""
                INSERT INTO reports (name, description, data)
                VALUES (?, ?, ?)
            """, (
                "Summary Report",
                f"Generated summary report for {total_analyses} analyses",
                json.dumps(report)
            ))
            
            return report
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.tool
def analyze_rss_feed(rss_url: str, max_items: int = 10) -> Dict:
    """RSSフィードを分析（応用例）
    
    Args:
        rss_url: RSSフィードのURL
        max_items: 分析する最大記事数
        
    Returns:
        RSS分析結果
    """
    try:
        import feedparser
        
        feed = feedparser.parse(rss_url)
        
        if not hasattr(feed, 'entries'):
            return {
                "success": False,
                "error": "Invalid RSS feed or parsing error"
            }
        
        results = []
        
        for entry in feed.entries[:max_items]:
            if hasattr(entry, 'link'):
                result = _internal_scrape_and_analyze(entry.link)
                result['rss_title'] = getattr(entry, 'title', 'No Title')
                result['published'] = getattr(entry, 'published', None)
                results.append(result)
                
                # レート制限
                time.sleep(1)
        
        return {
            "success": True,
            "feed_title": getattr(feed.feed, 'title', 'Unknown Feed'),
            "analyzed_items": len(results),
            "results": results
        }
    
    except ImportError:
        return {
            "success": False,
            "error": "feedparser module not installed. Run: pip install feedparser"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    app.run() 
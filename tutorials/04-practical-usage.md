# チュートリアル4: 実践応用 🚀

**所要時間: 30分**  
**前提知識: [チュートリアル3](03-data-handling.md)完了**

## 🎯 今回の目標

- Web APIと連携するツールを作成
- 複数機能を組み合わせた複合ツールを実装
- 実用的なビジネスロジックを学習
- 非同期処理とエラー処理をマスター

## 🌐 プロジェクト概要

今回は**「スマート情報収集&分析システム」**を作ります。

### 主要機能
1. **Web情報収集**: URLからコンテンツを取得
2. **テキスト分析**: 感情分析・キーワード抽出
3. **データ保存**: 分析結果をデータベースに保存
4. **レポート生成**: 分析結果をレポート形式で出力

## 📝 ステップ1: プロジェクト準備

### 依存関係のインストール
```bash
pip install fastmcp requests beautifulsoup4 textblob matplotlib
```

### プロジェクト構造
```
smart-analyzer/
├── main.py              # メインサーバー
├── web_scraper.py       # Web情報収集
├── text_analyzer.py     # テキスト分析
├── database.py          # データベース管理
├── report_generator.py  # レポート生成
├── config.toml         # 設定ファイル
└── data/               # データファイル
    ├── analysis.db     # 分析結果DB
    └── reports/        # 生成レポート
```

## 🏗️ ステップ2: データベース設計

### ファイル作成: `database.py`
```python
"""
スマート分析システムのデータベース管理
"""
import sqlite3
import json
from datetime import datetime
from typing import Dict, List, Optional

class AnalysisDatabase:
    def __init__(self, db_path: str = "data/analysis.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """データベース初期化"""
        import os
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # 分析対象URLテーブル
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS urls (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    url TEXT UNIQUE NOT NULL,
                    title TEXT,
                    content TEXT,
                    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status TEXT DEFAULT 'pending'
                )
            """)
            
            # 分析結果テーブル
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS analyses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    url_id INTEGER,
                    sentiment_score REAL,
                    sentiment_label TEXT,
                    keywords TEXT,  -- JSON形式
                    word_count INTEGER,
                    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (url_id) REFERENCES urls(id)
                )
            """)
            
            # レポートテーブル
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    data TEXT,  -- JSON形式
                    file_path TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
    
    def get_connection(self):
        """データベース接続取得"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

# グローバルインスタンス
db = AnalysisDatabase()
```

## 🕷️ ステップ3: Web情報収集モジュール

### ファイル作成: `web_scraper.py`
```python
"""
Web情報収集モジュール
"""
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
from typing import Dict, Optional

class WebScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def scrape_url(self, url: str) -> Dict:
        """URLからコンテンツを取得"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # タイトル取得
            title = soup.find('title')
            title_text = title.get_text().strip() if title else "No Title"
            
            # 本文取得（基本的なクリーニング）
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
            
            content = soup.get_text()
            content = ' '.join(content.split())  # 余分な空白を削除
            
            return {
                "success": True,
                "url": url,
                "title": title_text,
                "content": content[:5000],  # 最初の5000文字
                "content_length": len(content),
                "scraped_at": time.time()
            }
        
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "url": url,
                "error": f"HTTP Error: {str(e)}",
                "scraped_at": time.time()
            }
        except Exception as e:
            return {
                "success": False,
                "url": url,
                "error": f"Parse Error: {str(e)}",
                "scraped_at": time.time()
            }
    
    def extract_links(self, url: str, base_url: str = None) -> List[str]:
        """ページ内のリンクを抽出"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            base_url = base_url or url
            
            links = []
            for link in soup.find_all('a', href=True):
                href = link['href']
                full_url = urljoin(base_url, href)
                if self._is_valid_url(full_url):
                    links.append(full_url)
            
            return list(set(links))  # 重複除去
        
        except Exception as e:
            return []
    
    def _is_valid_url(self, url: str) -> bool:
        """URLの妥当性チェック"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except:
            return False

# グローバルインスタンス
scraper = WebScraper()
```

## 📊 ステップ4: テキスト分析モジュール

### ファイル作成: `text_analyzer.py`
```python
"""
テキスト分析モジュール
"""
import re
from collections import Counter
from typing import Dict, List, Tuple
import json

try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except ImportError:
    TEXTBLOB_AVAILABLE = False

class TextAnalyzer:
    def __init__(self):
        self.stop_words = {
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
            'had', 'what', 'said', 'each', 'which', 'she', 'do', 'how', 'their',
            'if', 'up', 'out', 'many', 'then', 'them', 'these', 'so', 'some',
            'her', 'would', 'make', 'like', 'into', 'him', 'time', 'two', 'more',
            'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call',
            'who', 'oil', 'sit', 'now', 'find', 'down', 'day', 'did', 'get',
            'come', 'made', 'may', 'part'
        }
    
    def analyze_sentiment(self, text: str) -> Dict:
        """感情分析を実行"""
        if TEXTBLOB_AVAILABLE:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity
            subjectivity = blob.sentiment.subjectivity
            
            # ラベル判定
            if polarity > 0.1:
                label = "positive"
            elif polarity < -0.1:
                label = "negative"
            else:
                label = "neutral"
            
            return {
                "score": polarity,
                "label": label,
                "subjectivity": subjectivity,
                "method": "textblob"
            }
        else:
            # 簡易感情分析（TextBlobが使えない場合）
            return self._simple_sentiment_analysis(text)
    
    def _simple_sentiment_analysis(self, text: str) -> Dict:
        """簡易感情分析"""
        positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 
                         'fantastic', 'awesome', 'perfect', 'best', 'love']
        negative_words = ['bad', 'terrible', 'awful', 'horrible', 'worst', 
                         'hate', 'disgusting', 'disappointing', 'poor', 'fail']
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        total = positive_count + negative_count
        if total == 0:
            score = 0
            label = "neutral"
        else:
            score = (positive_count - negative_count) / total
            if score > 0.2:
                label = "positive"
            elif score < -0.2:
                label = "negative"
            else:
                label = "neutral"
        
        return {
            "score": score,
            "label": label,
            "subjectivity": 0.5,
            "method": "simple",
            "positive_count": positive_count,
            "negative_count": negative_count
        }
    
    def extract_keywords(self, text: str, top_n: int = 10) -> List[Dict]:
        """キーワード抽出"""
        # テキストクリーニング
        text = re.sub(r'[^\w\s]', ' ', text.lower())
        words = text.split()
        
        # ストップワード除去と長さフィルタ
        filtered_words = [
            word for word in words 
            if word not in self.stop_words and len(word) > 2
        ]
        
        # 頻度カウント
        word_counts = Counter(filtered_words)
        
        # 上位キーワード取得
        top_keywords = word_counts.most_common(top_n)
        
        return [
            {"word": word, "count": count, "frequency": count/len(filtered_words)}
            for word, count in top_keywords
        ]
    
    def get_text_statistics(self, text: str) -> Dict:
        """テキスト統計情報"""
        words = text.split()
        sentences = text.split('.')
        
        return {
            "word_count": len(words),
            "sentence_count": len(sentences),
            "character_count": len(text),
            "average_word_length": sum(len(word) for word in words) / len(words) if words else 0,
            "average_sentence_length": len(words) / len(sentences) if sentences else 0
        }
    
    def full_analysis(self, text: str) -> Dict:
        """完全分析"""
        sentiment = self.analyze_sentiment(text)
        keywords = self.extract_keywords(text)
        statistics = self.get_text_statistics(text)
        
        return {
            "sentiment": sentiment,
            "keywords": keywords,
            "statistics": statistics,
            "analyzed_at": time.time()
        }

# グローバルインスタンス
analyzer = TextAnalyzer()
```

## 📈 ステップ5: メインMCPサーバー作成

### ファイル作成: `main.py`
```python
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

@app.tool()
def scrape_and_analyze(url: str) -> Dict:
    """URLを取得して分析する（統合処理）
    
    Args:
        url: 分析対象のURL
        
    Returns:
        スクレイピングと分析の結果
    """
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

@app.tool()
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
        result = scrape_and_analyze(url)
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

@app.tool()
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

@app.tool()
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

@app.tool()
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

@app.tool()
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

if __name__ == "__main__":
    app.run()
```

## 🧪 ステップ6: テスト実行

### 基本テスト
```bash
# サーバー起動
python main.py

# 単一URL分析
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "scrape_and_analyze", "arguments": {"url": "https://example.com"}}}' | python main.py

# 分析履歴取得
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "get_analysis_history", "arguments": {}}}' | python main.py

# サマリーレポート生成
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "generate_summary_report", "arguments": {}}}' | python main.py
```

## 📊 ステップ7: 設定ファイルの活用

### `config.toml`
```toml
[server]
name = "Smart Information Analyzer"
version = "1.0.0"
description = "Web情報収集と分析を行うMCPサーバー"

[scraping]
timeout = 10
user_agent = "SmartAnalyzer/1.0"
rate_limit = 1.0  # seconds between requests
max_content_length = 10000

[analysis]
enable_sentiment = true
enable_keywords = true
max_keywords = 20
min_keyword_frequency = 0.01

[database]
path = "data/analysis.db"
backup_interval = 86400  # seconds (daily)

[reports]
output_dir = "data/reports"
formats = ["json", "html"]
```

## ✅ 完成度チェック

以下を確認してください：

- [ ] URLスクレイピングが動作する
- [ ] 感情分析が実行される
- [ ] キーワード抽出が機能する
- [ ] データベース保存が正常に動作する
- [ ] 分析履歴が取得できる
- [ ] レポート生成が機能する

## 🎯 応用課題

### チャレンジ問題
1. **RSS feed分析**: RSSフィードを読み込んで自動分析
2. **画像分析**: ページ内の画像をOCRで分析
3. **競合分析**: 複数サイトの比較分析
4. **トレンド分析**: 時系列での感情変化追跡

### 実装例（RSS分析）
```python
@app.tool()
def analyze_rss_feed(rss_url: str, max_items: int = 10) -> Dict:
    """RSSフィードを分析"""
    import feedparser
    
    feed = feedparser.parse(rss_url)
    results = []
    
    for entry in feed.entries[:max_items]:
        if hasattr(entry, 'link'):
            result = scrape_and_analyze(entry.link)
            result['rss_title'] = entry.title
            result['published'] = getattr(entry, 'published', None)
            results.append(result)
    
    return {
        "success": True,
        "feed_title": feed.feed.title,
        "analyzed_items": len(results),
        "results": results
    }
```

## 🎉 学習成果

このチュートリアルで習得したスキル：

- ✅ Web API連携
- ✅ 非同期処理
- ✅ エラーハンドリング
- ✅ 複合ツール設計
- ✅ 実用的なビジネスロジック
- ✅ データの可視化とレポート生成

## 🔄 次のステップ

実践応用をマスターしたら、最後にデプロイについて学びましょう！

**[→ チュートリアル5: デプロイ](05-deployment.md)**

---

💡 **ヒント**: このシステムは実際のマーケティング調査や競合分析に活用できます！ 
"""
テキスト分析モジュール
"""
import re
from collections import Counter
from typing import Dict, List, Tuple
import json
import time

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
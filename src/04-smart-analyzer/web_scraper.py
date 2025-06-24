"""
Web情報収集モジュール
"""
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
from typing import Dict, List, Optional

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
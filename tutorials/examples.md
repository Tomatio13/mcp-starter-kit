# サンプルプロジェクト集 📂

FastMCPで作成できる実用的なプロジェクト例を紹介します。各プロジェクトには完全なソースコードとセットアップ手順が含まれています。

## 🎯 プロジェクト難易度レベル

| レベル | 所要時間 | 対象者 | 内容 |
|--------|----------|--------|------|
| 🔰 **初級** | 30分-1時間 | プログラミング初心者 | 基本的なツール作成 |
| 📚 **中級** | 2-4時間 | Python経験者 | 実用的なアプリケーション |
| 🚀 **上級** | 1-2日 | 開発経験者 | 複雑なシステム・API連携 |

---

## 🔰 初級プロジェクト

### 1. 計算機ツール 🧮

**概要:** 基本的な計算機能を提供するMCPツール

**学習内容:**
- 基本的なツール作成
- 型ヒントの使用
- エラーハンドリング

**コード例:**
```python
from fastmcp import FastMCP

app = FastMCP("Calculator")

@app.tool()
def add(a: float, b: float) -> float:
    """2つの数値を足し算"""
    return a + b

@app.tool()
def multiply(a: float, b: float) -> float:
    """2つの数値を掛け算"""
    return a * b

@app.tool()
def calculate_percentage(value: float, percentage: float) -> dict:
    """パーセンテージ計算"""
    result = value * (percentage / 100)
    return {
        "original_value": value,
        "percentage": percentage,
        "result": result,
        "formatted": f"{value}の{percentage}%は{result}です"
    }

if __name__ == "__main__":
    app.run()
```

**使用例:**
```bash
# Claude Desktopで
"100の25%を計算してください"
"50と30を足してください"
```

---

### 2. テキスト処理ツール 📝

**概要:** 文字列操作とテキスト分析

**学習内容:**
- 文字列処理
- JSON形式のレスポンス
- 複数の機能組み合わせ

**コード例:**
```python
from fastmcp import FastMCP
import re
from collections import Counter

app = FastMCP("Text Processor")

@app.tool()
def count_words(text: str) -> dict:
    """単語数をカウント"""
    words = text.split()
    return {
        "text": text,
        "word_count": len(words),
        "character_count": len(text),
        "line_count": len(text.split('\n'))
    }

@app.tool()
def find_and_replace(text: str, find: str, replace: str) -> dict:
    """文字列を検索・置換"""
    new_text = text.replace(find, replace)
    count = text.count(find)
    return {
        "original": text,
        "modified": new_text,
        "replacements_made": count
    }

@app.tool()
def extract_emails(text: str) -> dict:
    """テキストからメールアドレスを抽出"""
    pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(pattern, text)
    return {
        "text": text,
        "emails_found": emails,
        "count": len(emails)
    }

if __name__ == "__main__":
    app.run()
```

---

### 3. ファイル操作ツール 📁

**概要:** ファイルの読み書きと基本操作

**コード例:**
```python
from fastmcp import FastMCP
import os
from pathlib import Path

app = FastMCP("File Manager")

@app.tool()
def read_file(file_path: str) -> dict:
    """ファイル内容を読み取り"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return {
            "success": True,
            "file_path": file_path,
            "content": content,
            "size": len(content)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.tool()
def list_files(directory: str = ".") -> dict:
    """ディレクトリ内のファイル一覧"""
    try:
        path = Path(directory)
        files = []
        
        for item in path.iterdir():
            files.append({
                "name": item.name,
                "type": "directory" if item.is_dir() else "file",
                "size": item.stat().st_size if item.is_file() else 0
            })
        
        return {
            "success": True,
            "directory": str(path.absolute()),
            "files": files,
            "count": len(files)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    app.run()
```

---

## 📚 中級プロジェクト

### 4. CSV データ分析ツール 📊

**概要:** CSVファイルの読み込み・分析・可視化

**学習内容:**
- pandas ライブラリの使用
- データ分析の基礎
- グラフ作成

**必要なライブラリ:**
```bash
pip install pandas matplotlib seaborn
```

**コード例:**
```python
from fastmcp import FastMCP
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from io import StringIO
import base64

app = FastMCP("CSV Analyzer")

@app.tool()
def load_csv(file_path: str) -> dict:
    """CSVファイルを読み込み"""
    try:
        df = pd.read_csv(file_path)
        return {
            "success": True,
            "file_path": file_path,
            "shape": df.shape,
            "columns": df.columns.tolist(),
            "preview": df.head().to_dict('records'),
            "info": {
                "rows": len(df),
                "columns": len(df.columns),
                "memory_usage": f"{df.memory_usage(deep=True).sum()} bytes"
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.tool()
def analyze_column(file_path: str, column_name: str) -> dict:
    """特定の列を分析"""
    try:
        df = pd.read_csv(file_path)
        
        if column_name not in df.columns:
            return {"success": False, "error": f"Column '{column_name}' not found"}
        
        col = df[column_name]
        
        analysis = {
            "column_name": column_name,
            "data_type": str(col.dtype),
            "non_null_count": col.count(),
            "null_count": col.isnull().sum(),
            "unique_values": col.nunique()
        }
        
        # 数値データの場合
        if col.dtype in ['int64', 'float64']:
            analysis.update({
                "mean": col.mean(),
                "median": col.median(),
                "std": col.std(),
                "min": col.min(),
                "max": col.max()
            })
        
        # カテゴリデータの場合
        elif col.dtype == 'object':
            analysis.update({
                "most_common": col.value_counts().head().to_dict()
            })
        
        return {"success": True, "analysis": analysis}
    
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.tool()
def create_visualization(file_path: str, x_column: str, y_column: str = None, chart_type: str = "histogram") -> dict:
    """データの可視化"""
    try:
        df = pd.read_csv(file_path)
        
        plt.figure(figsize=(10, 6))
        
        if chart_type == "histogram" and x_column in df.columns:
            plt.hist(df[x_column].dropna(), bins=30)
            plt.xlabel(x_column)
            plt.ylabel('Frequency')
            plt.title(f'Histogram of {x_column}')
        
        elif chart_type == "scatter" and x_column in df.columns and y_column in df.columns:
            plt.scatter(df[x_column], df[y_column])
            plt.xlabel(x_column)
            plt.ylabel(y_column)
            plt.title(f'{x_column} vs {y_column}')
        
        # 画像をbase64エンコード
        buffer = StringIO()
        plt.savefig(buffer, format='png', bbox_inches='tight')
        buffer.seek(0)
        
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()
        
        return {
            "success": True,
            "chart_type": chart_type,
            "columns_used": [x_column, y_column] if y_column else [x_column],
            "image_base64": img_base64
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    app.run()
```

---

### 5. 天気情報ツール 🌤️

**概要:** 外部APIから天気情報を取得

**学習内容:**
- Web API連携
- JSON データ処理
- エラーハンドリング

**API設定:**
```python
# .env ファイル
WEATHER_API_KEY=your_api_key_here
```

**コード例:**
```python
from fastmcp import FastMCP
import requests
import os
from datetime import datetime

app = FastMCP("Weather Service")

API_KEY = os.getenv("WEATHER_API_KEY", "demo_key")
BASE_URL = "http://api.openweathermap.org/data/2.5"

@app.tool()
def get_current_weather(city: str, country: str = "") -> dict:
    """現在の天気を取得"""
    try:
        # APIパラメータ
        location = f"{city},{country}" if country else city
        params = {
            "q": location,
            "appid": API_KEY,
            "units": "metric",  # 摂氏温度
            "lang": "ja"       # 日本語
        }
        
        response = requests.get(f"{BASE_URL}/weather", params=params)
        response.raise_for_status()
        
        data = response.json()
        
        return {
            "success": True,
            "location": data["name"],
            "country": data["sys"]["country"],
            "weather": {
                "description": data["weather"][0]["description"],
                "temperature": data["main"]["temp"],
                "feels_like": data["main"]["feels_like"],
                "humidity": data["main"]["humidity"],
                "pressure": data["main"]["pressure"]
            },
            "wind": {
                "speed": data["wind"]["speed"],
                "direction": data["wind"].get("deg", 0)
            },
            "timestamp": datetime.now().isoformat()
        }
    
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"API Error: {e}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.tool()
def get_weather_forecast(city: str, days: int = 3) -> dict:
    """天気予報を取得"""
    try:
        params = {
            "q": city,
            "appid": API_KEY,
            "units": "metric",
            "lang": "ja",
            "cnt": days * 8  # 3時間ごとのデータ
        }
        
        response = requests.get(f"{BASE_URL}/forecast", params=params)
        response.raise_for_status()
        
        data = response.json()
        
        forecast = []
        for item in data["list"]:
            forecast.append({
                "datetime": item["dt_txt"],
                "temperature": item["main"]["temp"],
                "description": item["weather"][0]["description"],
                "humidity": item["main"]["humidity"]
            })
        
        return {
            "success": True,
            "location": data["city"]["name"],
            "forecast": forecast
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    app.run()
```

---

## 🚀 上級プロジェクト

### 6. Webスクレイピング & 分析システム 🕷️

**概要:** Webサイトから情報収集し、分析・レポート作成

**学習内容:**
- Beautiful Soup
- 非同期処理
- データベース連携
- レポート生成

**必要なライブラリ:**
```bash
pip install beautifulsoup4 requests sqlite3 jinja2
```

**メインコード（抜粋）:**
```python
from fastmcp import FastMCP
import requests
from bs4 import BeautifulSoup
import sqlite3
from datetime import datetime
import asyncio
from concurrent.futures import ThreadPoolExecutor

app = FastMCP("Web Scraper & Analyzer")

class WebScraper:
    def __init__(self, db_path="scraped_data.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS scraped_data (
                    id INTEGER PRIMARY KEY,
                    url TEXT,
                    title TEXT,
                    content TEXT,
                    word_count INTEGER,
                    scraped_at TIMESTAMP
                )
            """)

@app.tool()
def scrape_url(url: str) -> dict:
    """単一URLをスクレイピング"""
    scraper = WebScraper()
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # タイトル取得
        title = soup.find('title')
        title_text = title.get_text().strip() if title else "No Title"
        
        # 本文取得
        for script in soup(["script", "style"]):
            script.decompose()
        content = soup.get_text()
        content = ' '.join(content.split())
        
        # データベースに保存
        with sqlite3.connect(scraper.db_path) as conn:
            conn.execute("""
                INSERT INTO scraped_data (url, title, content, word_count, scraped_at)
                VALUES (?, ?, ?, ?, ?)
            """, (url, title_text, content, len(content.split()), datetime.now()))
        
        return {
            "success": True,
            "url": url,
            "title": title_text,
            "word_count": len(content.split()),
            "content_preview": content[:200]
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.tool()
def analyze_scraped_data() -> dict:
    """スクレイピングしたデータを分析"""
    scraper = WebScraper()
    
    try:
        with sqlite3.connect(scraper.db_path) as conn:
            # 基本統計
            cursor = conn.execute("SELECT COUNT(*), AVG(word_count), MAX(word_count) FROM scraped_data")
            total, avg_words, max_words = cursor.fetchone()
            
            # 最新のデータ
            cursor = conn.execute("""
                SELECT title, url, word_count 
                FROM scraped_data 
                ORDER BY scraped_at DESC LIMIT 5
            """)
            recent_data = cursor.fetchall()
        
        return {
            "success": True,
            "statistics": {
                "total_pages": total,
                "average_word_count": avg_words,
                "max_word_count": max_words
            },
            "recent_pages": [
                {"title": row[0], "url": row[1], "word_count": row[2]}
                for row in recent_data
            ]
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    app.run()
```

---

### 7. AI画像分析ツール 🖼️

**概要:** 画像を分析し、内容を説明するツール

**学習内容:**
- 画像処理
- AI API連携
- ファイルアップロード処理

**必要なライブラリ:**
```bash
pip install pillow openai requests
```

**コード例:**
```python
from fastmcp import FastMCP
from PIL import Image
import base64
import io
import openai
import os

app = FastMCP("AI Image Analyzer")

openai.api_key = os.getenv("OPENAI_API_KEY")

@app.tool()
def analyze_image(image_path: str, analysis_type: str = "general") -> dict:
    """画像を分析して説明を生成"""
    try:
        # 画像を読み込み
        with Image.open(image_path) as img:
            # リサイズ（API制限に対応）
            if img.width > 1024 or img.height > 1024:
                img.thumbnail((1024, 1024))
            
            # Base64エンコード
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        # プロンプト作成
        prompts = {
            "general": "この画像について詳しく説明してください。",
            "objects": "この画像に写っている物体を全て列挙してください。",
            "colors": "この画像の色合いや雰囲気について説明してください。",
            "text": "この画像に含まれるテキストを読み取ってください。"
        }
        
        prompt = prompts.get(analysis_type, prompts["general"])
        
        # OpenAI API呼び出し
        response = openai.ChatCompletion.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{img_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500
        )
        
        analysis_result = response.choices[0].message.content
        
        return {
            "success": True,
            "image_path": image_path,
            "analysis_type": analysis_type,
            "result": analysis_result,
            "token_usage": response.usage.total_tokens
        }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.tool()
def extract_image_metadata(image_path: str) -> dict:
    """画像のメタデータを抽出"""
    try:
        with Image.open(image_path) as img:
            metadata = {
                "filename": os.path.basename(image_path),
                "format": img.format,
                "mode": img.mode,
                "size": img.size,
                "width": img.width,
                "height": img.height
            }
            
            # EXIF データ（あれば）
            exif_data = {}
            if hasattr(img, '_getexif') and img._getexif():
                exif_data = dict(img._getexif())
            
            return {
                "success": True,
                "metadata": metadata,
                "exif": exif_data
            }
    
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    app.run()
```

---

## 📋 プロジェクトテンプレート

### 新規プロジェクト作成用テンプレート

**ディレクトリ構造:**
```
my-mcp-project/
├── main.py              # メインサーバー
├── config.toml          # 設定ファイル
├── requirements.txt     # 依存関係
├── README.md           # プロジェクト説明
├── tests/              # テストファイル
│   └── test_main.py
├── data/              # データファイル
└── logs/              # ログファイル
```

**テンプレートコード:**
```python
"""
FastMCPプロジェクトテンプレート
プロジェクト名: [YOUR_PROJECT_NAME]
作成者: [YOUR_NAME]
作成日: [DATE]
"""

from fastmcp import FastMCP
import logging
from pathlib import Path

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# データディレクトリ作成
Path("data").mkdir(exist_ok=True)
Path("logs").mkdir(exist_ok=True)

app = FastMCP("My MCP Project")

@app.tool()
def hello_world(name: str = "World") -> str:
    """初回テスト用のHello Worldツール"""
    logger.info(f"Hello World called with name: {name}")
    return f"Hello, {name}! FastMCPプロジェクトへようこそ！"

@app.tool()
def project_info() -> dict:
    """プロジェクト情報を返す"""
    return {
        "project_name": "My MCP Project",
        "version": "1.0.0",
        "description": "FastMCPを使用したプロジェクト",
        "author": "[YOUR_NAME]",
        "tools_count": len(app.tools)
    }

# ここに新しいツールを追加

if __name__ == "__main__":
    logger.info("Starting MCP Server...")
    app.run()
```

---

## 🎯 次のステップ

### サンプルプロジェクトの活用方法

1. **興味のあるプロジェクトを選択**
2. **コードをダウンロード・実行**
3. **機能を拡張・カスタマイズ**
4. **独自のアイデアで新しいプロジェクト作成**

### 学習の進め方

1. **🔰 初級** → **📚 中級** → **🚀 上級** の順で挑戦
2. **各プロジェクトの核となる概念**を理解
3. **実際の業務や趣味**に応用
4. **コミュニティで知識共有**

---

**💡 これらのサンプルプロジェクトを参考に、あなただけのオリジナルツールを作ってみてください！** 
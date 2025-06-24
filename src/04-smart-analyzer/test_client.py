"""
スマート情報収集&分析システムをテストするクライアント
"""
import asyncio
import json
from fastmcp import Client

async def test_smart_analyzer():
    # STDIOモードでテスト
    client = Client("main.py")
    
    async with client:
        print("🚀 スマート情報収集&分析システムのテストを開始します\n")
        
        # 利用可能なツール一覧を取得
        tools = await client.list_tools()
        print(f"📋 利用可能なツール: {[tool.name for tool in tools]}\n")
        
        # 1. 単一URL分析テスト
        print("=== 単一URL分析テスト ===")
        test_url = "https://example.com"
        result1 = await client.call_tool("scrape_and_analyze", {"url": test_url})
        print(f"🔍 分析結果: {result1[0].text}\n")
        
        # 2. 分析履歴取得
        print("=== 分析履歴取得テスト ===")
        history_result = await client.call_tool("get_analysis_history", {"limit": 5})
        print(f"📊 履歴: {history_result[0].text}\n")
        
        # 3. 感情分析検索テスト
        print("=== 感情分析検索テスト ===")
        sentiment_result = await client.call_tool("search_by_sentiment", {"sentiment_label": "neutral"})
        print(f"😐 中立的な分析結果: {sentiment_result[0].text}\n")
        
        # 4. キーワード分析テスト
        print("=== キーワード分析テスト ===")
        keyword_result = await client.call_tool("get_keyword_analysis", {"min_frequency": 0.01})
        print(f"🔤 キーワード分析: {keyword_result[0].text}\n")
        
        # 5. サマリーレポート生成
        print("=== サマリーレポート生成テスト ===")
        report_result = await client.call_tool("generate_summary_report")
        print(f"📈 レポート: {report_result[0].text}\n")
        
        # 6. 複数URL分析テスト（小規模）
        print("=== 複数URL分析テスト ===")
        test_urls = ["https://httpbin.org/html", "https://httpbin.org/json"]
        batch_result = await client.call_tool("batch_analyze_urls", {"urls": test_urls})
        print(f"📋 一括分析結果: {batch_result[0].text}\n")
        
        print("✅ すべてのテストが完了しました！")

async def test_rss_analysis():
    """RSS分析の個別テスト"""
    client = Client("main.py")
    
    async with client:
        print("📡 RSS分析テストを開始します\n")
        
        # RSS分析テスト（例: BBC News RSS）
        rss_url = "http://feeds.bbci.co.uk/news/rss.xml"
        rss_result = await client.call_tool("analyze_rss_feed", {
            "rss_url": rss_url,
            "max_items": 3
        })
        print(f"📰 RSS分析結果: {rss_result[0].text}")

if __name__ == "__main__":
    print("=== 基本機能テスト ===")
    asyncio.run(test_smart_analyzer())
    
    print("\n=== RSS分析テスト ===")
    try:
        asyncio.run(test_rss_analysis())
    except Exception as e:
        print(f"RSS分析テストでエラーが発生しました: {e}")
        print("feedparserがインストールされていない可能性があります。") 
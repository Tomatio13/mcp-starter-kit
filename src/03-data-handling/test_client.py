"""
タスク管理サーバーをテストするクライアント
"""
import asyncio
from fastmcp import Client

async def test_task_manager():
    # STDIOモードでテスト
    client = Client("tutorial03_task_manager.py")
    
    async with client:
        print("🔗 タスク管理サーバーに接続しました")
        
        # サーバー情報取得
        info = await client.call_tool("get_server_info")
        print(f"ℹ️  サーバー情報: {info[0].text}")
        
        # カテゴリ作成
        cat_result = await client.call_tool("create_category", {
            "name": "学習", 
            "color": "#28a745"
        })
        print(f"📂 カテゴリ作成: {cat_result[0].text}")
        
        # タスク作成
        task_result = await client.call_tool("create_task", {
            "title": "FastMCPマスター",
            "description": "データ操作チュートリアルを完了する",
            "priority": 5
        })
        print(f"✅ タスク作成: {task_result[0].text}")
        
        # タスク一覧取得
        tasks = await client.call_tool("get_tasks")
        print(f"📋 タスク一覧: {tasks[0].text}")
        
        # 統計情報取得
        stats = await client.call_tool("get_task_statistics")
        print(f"📊 統計情報: {stats[0].text}")

if __name__ == "__main__":
    asyncio.run(test_task_manager()) 
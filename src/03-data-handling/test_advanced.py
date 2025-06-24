"""
タスク管理サーバーの拡張機能テストクライアント
"""
import asyncio
import json
from fastmcp import Client

async def test_advanced_features():
    # STDIOモードでテスト
    client = Client("tutorial03_task_manager.py")
    
    async with client:
        print("🚀 拡張機能テストを開始します\n")
        
        # 1. 複数のカテゴリ作成
        print("=== カテゴリ作成テスト ===")
        categories = [
            {"name": "開発", "color": "#007bff"},
            {"name": "レビュー", "color": "#dc3545"},
            {"name": "ドキュメント", "color": "#ffc107"}
        ]
        
        for cat in categories:
            result = await client.call_tool("create_category", cat)
            print(f"📂 {result[0].text}")
        
        # 2. 複数のタスク作成
        print("\n=== タスク作成テスト ===")
        tasks = [
            {"title": "コードレビュー", "description": "プルリクエストのレビューを行う", "priority": 3},
            {"title": "ドキュメント更新", "description": "READMEファイルを更新する", "priority": 2},
            {"title": "バグ修正", "description": "重要なバグを修正する", "priority": 5},
        ]
        
        task_ids = []
        for task in tasks:
            result = await client.call_tool("create_task", task)
            data = json.loads(result[0].text)  # JSONパース
            task_ids.append(data["task"]["id"])
            print(f"✅ {result[0].text}")
        
        # 3. カテゴリとタスクの関連付け
        print("\n=== カテゴリ割り当てテスト ===")
        # タスクID 1 (FastMCPマスター) に学習カテゴリ(ID:1)を割り当て
        result = await client.call_tool("assign_category_to_task", {"task_id": 1, "category_id": 1})
        print(f"🏷️  {result[0].text}")
        
        # タスクID 2 (コードレビュー) にレビューカテゴリ(ID:3)を割り当て
        result = await client.call_tool("assign_category_to_task", {"task_id": 2, "category_id": 3})
        print(f"🏷️  {result[0].text}")
        
        # 4. 検索機能テスト
        print("\n=== 検索機能テスト ===")
        search_result = await client.call_tool("search_tasks", {"keyword": "レビュー"})
        print(f"🔍 検索結果: {search_result[0].text}")
        
        # 5. ステータス更新テスト
        print("\n=== ステータス更新テスト ===")
        update_result = await client.call_tool("update_task_status", {"task_id": 2, "status": "completed"})
        print(f"🔄 {update_result[0].text}")
        
        # 6. フィルタ機能テスト
        print("\n=== フィルタ機能テスト ===")
        pending_tasks = await client.call_tool("get_tasks", {"status": "pending"})
        print(f"📋 保留中タスク: {pending_tasks[0].text}")
        
        completed_tasks = await client.call_tool("get_tasks", {"status": "completed"})
        print(f"📋 完了タスク: {completed_tasks[0].text}")
        
        # 7. カテゴリ一覧取得
        print("\n=== カテゴリ一覧テスト ===")
        categories_list = await client.call_tool("get_categories")
        print(f"📂 カテゴリ一覧: {categories_list[0].text}")
        
        # 8. バックアップ機能テスト
        print("\n=== バックアップ機能テスト ===")
        backup_result = await client.call_tool("backup_database")
        print(f"💾 {backup_result[0].text}")
        
        # 9. エクスポート機能テスト
        print("\n=== エクスポート機能テスト ===")
        export_result = await client.call_tool("export_tasks_to_json")
        print(f"📤 {export_result[0].text}")
        
        # 10. 統計情報（最終）
        print("\n=== 最終統計情報 ===")
        final_stats = await client.call_tool("get_task_statistics")
        print(f"📊 {final_stats[0].text}")

if __name__ == "__main__":
    asyncio.run(test_advanced_features()) 
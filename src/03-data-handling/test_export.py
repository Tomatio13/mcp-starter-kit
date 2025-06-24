"""
エクスポート機能の単体テスト
"""
import asyncio
import json
import os
from fastmcp import Client

async def test_export_function():
    # STDIOモードでテスト
    client = Client("tutorial03_task_manager.py")
    
    async with client:
        print("📤 エクスポート機能テストを開始します\n")
        
        # エクスポート機能テスト
        export_result = await client.call_tool("export_tasks_to_json", {"file_path": "test_export.json"})
        print(f"エクスポート結果: {export_result[0].text}")
        
        # エクスポートファイルが作成されたか確認
        if os.path.exists("test_export.json"):
            print("✅ エクスポートファイルが作成されました")
            
            # ファイルの内容を確認
            with open("test_export.json", "r", encoding="utf-8") as f:
                exported_data = json.load(f)
            
            print(f"📊 エクスポートされたタスク数: {len(exported_data)}")
            
            if exported_data:
                print("📋 最初のタスク:")
                print(json.dumps(exported_data[0], ensure_ascii=False, indent=2))
            
            # テスト後にファイルを削除
            os.remove("test_export.json")
            print("🧹 テストファイルを削除しました")
        else:
            print("❌ エクスポートファイルが作成されませんでした")

if __name__ == "__main__":
    asyncio.run(test_export_function()) 
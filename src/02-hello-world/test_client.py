"""
Hello Worldサーバーをテストするクライアント
"""
import asyncio
from fastmcp import Client

async def test_hello_world_server():
    # サーバーファイルを指定してクライアント作成
    client = Client("hello_world.py")
    
    async with client:
        print("🔗 サーバーに接続しました")
        
        # 利用可能なツール一覧を取得
        tools = await client.list_tools()
        print(f"📋 利用可能なツール: {[tool.name for tool in tools]}")
        
        # say_helloツールを実行
        result1 = await client.call_tool("say_hello", {"name": "太郎"})
        print(f"✅ say_hello結果: {result1[0].text}")
        
        # add_numbersツールを実行
        result2 = await client.call_tool("add_numbers", {"a": 10, "b": 25})
        print(f"🔢 add_numbers結果: {result2[0].text}")
        
        # get_server_infoツールを実行
        result3 = await client.call_tool("get_server_info")
        print(f"ℹ️  server_info結果: {result3[0].text}")
        
        # calculate_ageツールを実行
        result4 = await client.call_tool("calculate_age", {"birth_year": 1990})
        print(f"🎂 calculate_age結果: {result4[0].text}")
        
        # format_textツールを実行
        result5 = await client.call_tool("format_text", {"text": "Hello World", "style": "title"})
        print(f"📝 format_text結果: {result5[0].text}")
        
        # safe_divideツールを実行
        result6 = await client.call_tool("safe_divide", {"dividend": 10, "divisor": 3})
        print(f"➗ safe_divide結果: {result6[0].text}")

async def test_http_server():
    """HTTPモードでのテスト"""
    # HTTPサーバーのURLを指定
    client = Client("http://127.0.0.1:8000/mcp")
    
    async with client:
        tools = await client.list_tools()
        print(f"利用可能なツール: {[tool.name for tool in tools]}")
        
        result = await client.call_tool("say_hello", {"name": "HTTP太郎"})
        print(f"結果: {result[0].text}")

async def test_sse_server():
    """SSEモードでのテスト（非推奨）"""
    from fastmcp.client import SSETransport
    
    # SSEトランスポートを明示的に指定
    transport = SSETransport(
        url="http://127.0.0.1:8000/sse"
    )
    client = Client(transport)
    
    async with client:
        tools = await client.list_tools()
        print(f"利用可能なツール: {[tool.name for tool in tools]}")
        
        result = await client.call_tool("say_hello", {"name": "SSE太郎"})
        print(f"結果: {result[0].text}")

if __name__ == "__main__":
    print("=== STDIOモードでのテスト ===")
    asyncio.run(test_hello_world_server())
    
    print("\n=== HTTPモードでのテスト（サーバーが起動している場合） ===")
    try:
        asyncio.run(test_http_server())
    except Exception as e:
        print(f"HTTPサーバーに接続できませんでした: {e}")
        print("HTTPモードでサーバーを起動してからお試しください。")
    
    print("\n=== SSEモードでのテスト（サーバーが起動している場合・非推奨） ===")
    try:
        asyncio.run(test_sse_server())
    except Exception as e:
        print(f"SSEサーバーに接続できませんでした: {e}")
        print("SSEモードでサーバーを起動してからお試しください。") 
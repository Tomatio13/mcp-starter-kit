"""
私の初めてのMCPサーバー
FastMCPを使ったHello Worldの例
"""
from fastmcp import FastMCP

# MCPサーバーを作成
app = FastMCP("Hello World Server")

@app.tool()
def say_hello(name: str) -> str:
    """指定された名前に挨拶する
    
    Args:
        name: 挨拶する相手の名前
        
    Returns:
        挨拶メッセージ
    """
    return f"こんにちは、{name}さん！FastMCPへようこそ 🎉"

@app.tool()
def add_numbers(a: float, b: float) -> float:
    """2つの数値を足し算する
    
    Args:
        a: 1つ目の数値
        b: 2つ目の数値
        
    Returns:
        計算結果
    """
    result = a + b
    return result

@app.tool()
def get_server_info() -> dict:
    """サーバーの情報を取得する
    
    Returns:
        サーバー情報の辞書
    """
    return {
        "server_name": "Hello World Server",
        "version": "1.0.0",
        "description": "初学者向けのMCPサーバーサンプル",
        "author": "あなたの名前",
        "tools_count": 3
    }

if __name__ == "__main__":
    # サーバーを起動
    app.run() 
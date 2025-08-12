"""
私の初めてのMCPサーバー
FastMCPを使ったHello Worldの例
"""
import tomllib
from pathlib import Path
from fastmcp import FastMCP

# contextディレクトリのパスを取得
context_dir = Path(__file__).parent / "context"

# 設定読み込み
config_path = Path("config.toml")
if config_path.exists():
    with open(config_path, "rb") as f:
        config = tomllib.load(f)
else:
    config = {}

# 設定を使用してサーバー作成
mcp = FastMCP(
    name=config.get("server", {}).get("name", "Hello World Server")
)

@mcp.tool
def get_server_info() -> dict:
    """サーバーの情報を取得する
    
    Returns:
        サーバー情報の辞書
    """
    server_config = config.get("server", {})
    return {
        "server_name": server_config.get("name", "Hello World Server"),
        "version": server_config.get("version", "1.0.0"),
        "description": server_config.get("description", "初学者向けのMCPサーバーサンプル"),
        "author": server_config.get("author", "あなたの名前"),
        "tools_count": 6  # 現在のツール数に更新
    }

@mcp.tool
def calculate_age(birth_year: int) -> dict:
    """生年から年齢を計算する
    
    Args:
        birth_year: 生年（西暦）
        
    Returns:
        年齢情報
    """
    from datetime import datetime
    
    current_year = datetime.now().year
    age = current_year - birth_year
    
    return {
        "birth_year": birth_year,
        "current_year": current_year,
        "age": age,
        "message": f"{birth_year}年生まれの方は{age}歳です"
    }

@mcp.tool
def format_text(text: str, style: str = "upper") -> str:
    """テキストを様々な形式でフォーマットする
    
    Args:
        text: フォーマットするテキスト
        style: フォーマットスタイル（upper, lower, title, reverse）
        
    Returns:
        フォーマットされたテキスト
    """
    if style == "upper":
        return text.upper()
    elif style == "lower":
        return text.lower()
    elif style == "title":
        return text.title()
    elif style == "reverse":
        return text[::-1]
    else:
        return f"未対応のスタイル: {style}"

@mcp.tool
def safe_divide(dividend: float, divisor: float) -> dict:
    """安全な除算を行う
    
    Args:
        dividend: 被除数
        divisor: 除数
        
    Returns:
        計算結果またはエラー情報
    """
    try:
        if divisor == 0:
            return {
                "success": False,
                "error": "ゼロで割ることはできません",
                "result": None
            }
        
        result = dividend / divisor
        return {
            "success": True,
            "error": None,
            "result": result,
            "calculation": f"{dividend} ÷ {divisor} = {result}"
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": f"計算エラー: {str(e)}",
            "result": None
        }

@mcp.tool()
def get_participant_guide() -> str:
    """MCPハッカソンの参加者ガイドを取得します。チーム編成、開発の進め方、発表について等の包括的な情報が含まれています。"""
    return (context_dir / "MCPハッカソン参加者ガイド.md").read_text(encoding="utf-8")


@mcp.tool()
def get_presentation_template() -> str:
    """MCPハッカソンの発表用Marpテンプレートを取得します。5分間の発表構成とスタイルが定義されています。"""
    return (context_dir / "MCPハッカソン発表テンプレート.md").read_text(encoding="utf-8")


@mcp.tool()
def get_evaluation_prompt() -> str:
    """MCPハッカソンの評価プロンプトを取得します。審査員向けと自己評価用の詳細な評価基準が含まれています。"""
    return (context_dir / "MCPハッカソン評価プロンプト.md").read_text(encoding="utf-8")


@mcp.tool()
def get_readme_template() -> str:
    """MCPプロジェクト用のREADMEテンプレートを取得します。プロジェクトドキュメントの標準的な構成が定義されています。"""
    return (context_dir / "MCPプロジェクト_READMEテンプレート.md").read_text(encoding="utf-8")
    
    
    
    
if __name__ == "__main__":
    # 設定からデフォルトトランスポートを取得
    transport_config = config.get("transport", {})
    print("transport_config:"+transport_config)
    default_transport = transport_config.get("default", "stdio")
    print("defual:" + default_transport)    
    # サーバーを起動
    if default_transport == "stdio":
        mcp.run()
    elif default_transport == "http":
        mcp.run(
            transport="streamable-http",
            host=transport_config.get("http_host", "127.0.0.1"),
            port=transport_config.get("http_port", 8000)
        )
    else:
        mcp.run() 

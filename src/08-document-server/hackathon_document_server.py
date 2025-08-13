"""
Hackathon MCPサーバー
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
    name=config.get("server", {}).get("name", "Hackathon Document Server")
)

@mcp.tool
def get_server_info() -> dict:
    """サーバーの情報を取得する
    
    Returns:
        サーバー情報の辞書
    """
    server_config = config.get("server", {})
    return {
        "server_name": server_config.get("name", "Hackathon Document Server"),
        "version": server_config.get("version", "1.0.0"),
        "description": server_config.get("description", "初学者向けのMCPサーバーサンプル"),
        "author": server_config.get("author", "あなたの名前"),
        "tools_count": 4
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
    default_transport = transport_config.get("default", "stdio")
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

---
title: "開発標準"
version: "1.0"
last_updated: "2025-06-23"
author: "mcp starter"
reviewers: []
related_docs: ["01_system_architecture.md", "02_application_design.md", "03_functional_requirements.md"]
status: "approved"
dependencies:
  upstream: ["02_design/01_system_architecture.md", "02_design/02_application_design.md", "01_requirements/03_functional_requirements.md"]
  downstream: ["02_test_specifications.md", "03_deployment_guide.md"]
impact_level: "high"
---

# 開発標準

## 1. 概要

### 1.1 目的
本ドキュメントは、FastMCPスターターキットプロジェクトの開発において遵守すべき標準と指針を定義します。初学者がMCPサーバ開発を効率的に学習・実践できる環境を提供することを最優先とします。

### 1.2 適用範囲
- FastMCPフレームワークを使用したMCPサーバ開発
- SSE（Server-Sent Events）およびSTDIO通信方式の両方対応
- Python 3.8以上の開発環境
- チュートリアル、サンプル、テンプレートプロジェクト

### 1.3 開発原則
1. **学習者第一**：初学者でも理解しやすいコード・構造
2. **実用性重視**：実際のプロジェクトで使える品質
3. **段階的学習**：基礎から応用まで段階的に学べる設計
4. **ベストプラクティス**：業界標準に準拠した開発手法
5. **保守性**：長期的な維持・更新が容易な設計

## 2. 技術スタック標準

### 2.1 必須技術スタック
```yaml
# 必須技術スタック
Programming Language: Python 3.8+
Framework: FastMCP (latest stable)
Communication: SSE + STDIO
Database: SQLite 3.36+
Configuration: TOML
Testing: pytest, unittest
Documentation: Markdown, docstring
Version Control: Git
Package Management: pip, requirements.txt
```

### 2.2 推奨ライブラリ
```python
# requirements.txt テンプレート
fastmcp>=1.0.0
uvicorn>=0.24.0
pydantic>=2.0.0
aiofiles>=23.0.0
toml>=0.10.2
pytest>=7.0.0
pytest-asyncio>=0.21.0
black>=23.0.0
flake8>=6.0.0
mypy>=1.0.0
```

### 2.3 開発環境標準
```bash
# 推奨開発環境
OS: Linux/macOS/Windows (Cross-platform)
Python: 3.8+ (3.11推奨)
IDE: VS Code/Cursor/PyCharm
Terminal: zsh/bash
Package Manager: pip + venv
```

## 3. プロジェクト構造標準

### 3.1 ディレクトリ構造
```
fastmcp-starter/
├── README.md                    # プロジェクト概要
├── requirements.txt             # 依存関係
├── setup.py                     # パッケージ設定
├── config.toml                  # 設定ファイル
├── src/                         # ソースコード
│   ├── __init__.py
│   ├── core/                    # コア機能
│   │   ├── __init__.py
│   │   ├── server.py           # MCPサーバメイン
│   │   ├── transport.py        # SSE/STDIO抽象化
│   │   └── protocol.py         # MCPプロトコル実装
│   ├── features/               # 機能モジュール
│   │   ├── __init__.py
│   │   ├── tools/              # MCP Tools
│   │   ├── resources/          # MCP Resources
│   │   └── prompts/            # MCP Prompts
│   ├── learning/               # 学習システム
│   │   ├── __init__.py
│   │   ├── tutorials/          # チュートリアル
│   │   └── examples/           # サンプル集
│   └── utils/                  # ユーティリティ
│       ├── __init__.py
│       ├── config.py
│       ├── logging.py
│       └── helpers.py
├── tests/                      # テストコード
│   ├── __init__.py
│   ├── unit/                   # ユニットテスト
│   ├── integration/            # 統合テスト
│   └── e2e/                    # E2Eテスト
├── docs/                       # ドキュメント
│   ├── tutorials/              # チュートリアル
│   ├── examples/               # 使用例
│   └── api/                    # API仕様
├── templates/                  # プロジェクトテンプレート
│   ├── basic/                  # 基本テンプレート
│   ├── web/                    # Web APIテンプレート
│   ├── cli/                    # CLIツールテンプレート
│   └── ai/                     # AI機能テンプレート
└── scripts/                    # 開発スクリプト
    ├── setup.sh                # 環境構築
    ├── test.sh                 # テスト実行
    └── deploy.sh               # デプロイ
```

### 3.2 ファイル命名規則
```python
# Python ファイル命名規則
# モジュール: snake_case
user_manager.py
tutorial_service.py

# クラス: PascalCase
class UserManager:
class TutorialService:

# 関数・変数: snake_case
def create_user():
user_name = "example"

# 定数: UPPER_SNAKE_CASE
MAX_USERS = 100
DEFAULT_CONFIG = "config.toml"

# プライベート: アンダースコア接頭辞
_internal_function()
_private_variable = None
```

## 4. コーディング標準

### 4.1 Python コーディング規約
```python
# PEP 8準拠 + プロジェクト固有ルール

# 1. インポート順序
import os
import sys
from typing import Dict, List, Optional

import fastmcp
import uvicorn
from pydantic import BaseModel

from src.core.server import MCPServer
from src.utils.config import load_config

# 2. 型ヒント必須
def create_user(name: str, email: str) -> Dict[str, Any]:
    """ユーザーを作成する
    
    Args:
        name: ユーザー名
        email: メールアドレス
    
    Returns:
        作成されたユーザー情報
    
    Raises:
        ValueError: 無効な入力値の場合
    """
    pass

# 3. 非同期処理
async def process_request(request: MCPRequest) -> MCPResponse:
    """非同期でリクエストを処理"""
    try:
        result = await handle_request(request)
        return MCPResponse(success=True, data=result)
    except Exception as e:
        logger.error(f"Request processing failed: {e}")
        return MCPResponse(success=False, error=str(e))

# 4. エラーハンドリング
class MCPError(Exception):
    """MCP関連エラーの基底クラス"""
    pass

class TransportError(MCPError):
    """通信エラー"""
    pass

# 5. 設定管理
@dataclass
class ServerConfig:
    """サーバー設定"""
    host: str = "localhost"
    port: int = 8000
    transport: str = "sse"  # sse or stdio
    debug: bool = False
```

### 4.2 FastMCP特有の標準
```python
# 1. MCPサーバー実装パターン
from fastmcp import FastMCP

app = FastMCP("learning-mcp-server")

@app.tool()
async def learn_python(topic: str) -> str:
    """Python学習支援ツール
    
    Args:
        topic: 学習したいトピック
    
    Returns:
        学習ガイド
    """
    # 実装...
    pass

@app.resource("tutorials/{tutorial_id}")
async def get_tutorial(tutorial_id: str) -> str:
    """チュートリアル取得
    
    Args:
        tutorial_id: チュートリアルID
    
    Returns:
        チュートリアル内容
    """
    # 実装...
    pass

@app.prompt()
async def code_review_prompt() -> str:
    """コードレビュー用プロンプト"""
    return """
    以下のコードをレビューしてください：
    
    観点：
    - 可読性
    - パフォーマンス
    - セキュリティ
    - ベストプラクティス
    """

# 2. SSE/STDIO対応パターン
class TransportFactory:
    """通信方式ファクトリー"""
    
    @staticmethod
    def create_transport(transport_type: str):
        if transport_type == "sse":
            return SSETransport()
        elif transport_type == "stdio":
            return STDIOTransport()
        else:
            raise ValueError(f"Unsupported transport: {transport_type}")

# 3. 初学者向けヘルパー
class LearningHelper:
    """学習支援ユーティリティ"""
    
    @staticmethod
    def explain_code(code: str) -> str:
        """コードの説明を生成"""
        # AI/LLMを使った説明生成
        pass
    
    @staticmethod
    def suggest_improvements(code: str) -> List[str]:
        """改善提案を生成"""
        # 静的解析結果を基にした提案
        pass
```

### 4.3 ドキュメント標準
```python
# 1. モジュールレベル docstring
"""FastMCP学習システム

このモジュールは初学者向けのMCPサーバ開発学習機能を提供します。

主な機能：
- チュートリアル管理
- プログレス追跡
- コード解説
- 実習環境

使用例：
    >>> from src.learning import TutorialManager
    >>> manager = TutorialManager()
    >>> tutorial = await manager.get_tutorial("basic-mcp")
"""

# 2. クラス docstring
class TutorialManager:
    """チュートリアル管理クラス
    
    初学者向けの段階的学習プログラムを管理し、
    学習者の進捗に応じた適切なガイダンスを提供します。
    
    Attributes:
        db: データベース接続
        current_user: 現在の学習者
        
    Examples:
        >>> manager = TutorialManager()
        >>> await manager.start_tutorial("basic-mcp", user_id="user1")
        >>> progress = await manager.get_progress("user1")
    """

# 3. 関数 docstring
async def create_mcp_tool(
    name: str,
    description: str,
    parameters: Dict[str, Any],
    implementation: Callable
) -> MCPTool:
    """MCPツールを動的に作成
    
    指定されたパラメータに基づいてMCPツールを作成し、
    サーバーに登録します。初学者の学習進度に応じて
    利用可能なツールを段階的に増やすことができます。
    
    Args:
        name: ツール名（英数字とアンダースコアのみ）
        description: ツールの説明（日本語可）
        parameters: ツールパラメータの定義
        implementation: ツールの実装関数
        
    Returns:
        作成されたMCPツール
        
    Raises:
        ValueError: 無効な名前やパラメータの場合
        MCPError: ツール登録に失敗した場合
        
    Examples:
        >>> tool = await create_mcp_tool(
        ...     name="calculator",
        ...     description="四則演算を行う",
        ...     parameters={"a": "int", "b": "int", "op": "str"},
        ...     implementation=calculate
        ... )
    """
```

## 5. 品質管理標準

### 5.1 コード品質指標
```yaml
# 品質メトリクス
Code Coverage: ≥ 90%
Cyclomatic Complexity: ≤ 10
Maintainability Index: ≥ 80
Type Coverage: ≥ 95%
Documentation Coverage: 100%

# 静的解析ツール
Linter: flake8, pylint
Formatter: black
Type Checker: mypy
Security: bandit
```

### 5.2 品質チェック自動化
```bash
# pre-commit フック設定
#!/bin/bash
echo "Running quality checks..."

# フォーマット
black src/ tests/

# リント
flake8 src/ tests/

# 型チェック
mypy src/

# テスト
pytest tests/ --cov=src --cov-report=term-missing

# セキュリティ
bandit -r src/

echo "Quality checks completed!"
```

### 5.3 初学者向け品質チェック
```python
# 学習者コード品質チェッカー
class LearningCodeChecker:
    """初学者向けコード品質チェッカー"""
    
    def check_code(self, code: str) -> Dict[str, List[str]]:
        """コードの品質をチェックし、学習者向けのフィードバックを提供"""
        feedback = {
            "good_practices": [],
            "improvements": [],
            "learning_tips": []
        }
        
        # 基本的なPythonベストプラクティスチェック
        if self._has_type_hints(code):
            feedback["good_practices"].append("型ヒントが使われています！")
        else:
            feedback["improvements"].append("型ヒントを追加すると、コードがより明確になります")
            feedback["learning_tips"].append("型ヒントについて: https://docs.python.org/3/library/typing.html")
            
        # MCPベストプラクティスチェック
        if self._uses_async_properly(code):
            feedback["good_practices"].append("非同期処理が適切に使われています！")
        
        return feedback
```

## 6. 開発ワークフロー

### 6.1 Git ワークフロー
```bash
# ブランチ戦略
main              # 本番コード
├── develop       # 開発統合
├── feature/*     # 機能開発
├── tutorial/*    # チュートリアル追加
├── hotfix/*      # 緊急修正
└── release/*     # リリース準備

# コミットメッセージ規約
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードフォーマット
refactor: リファクタリング
test: テスト追加・修正
tutorial: チュートリアル関連

# 例
feat: Add SSE transport implementation
fix: Handle STDIO connection errors properly
docs: Update MCP protocol documentation
tutorial: Add basic tool creation tutorial
```

### 6.2 開発サイクル
```yaml
# 開発サイクル
1. Issue作成:
   - 要件定義
   - 受け入れ条件設定
   - 学習目標明確化

2. 設計・実装:
   - TDD (Test-Driven Development)
   - コードレビュー
   - ドキュメント更新

3. テスト:
   - ユニットテスト
   - 統合テスト
   - 初学者テスト

4. リリース:
   - 品質チェック
   - チュートリアル検証
   - ドキュメント最終確認
```

### 6.3 初学者向け開発支援
```python
# 開発支援ツール
class DevelopmentHelper:
    """開発支援ユーティリティ"""
    
    def generate_boilerplate(self, template_type: str) -> str:
        """ボイラープレートコード生成"""
        templates = {
            "basic_tool": """
@app.tool()
async def your_tool_name(parameter: str) -> str:
    '''ツールの説明を書いてください
    
    Args:
        parameter: パラメータの説明
        
    Returns:
        結果の説明
    '''
    # ここに実装を書いてください
    return f"Result: {parameter}"
            """,
            "resource": """
@app.resource("your-resource/{resource_id}")
async def get_your_resource(resource_id: str) -> str:
    '''リソースの説明を書いてください
    
    Args:
        resource_id: リソースID
        
    Returns:
        リソース内容
    '''
    # ここに実装を書いてください
    return f"Resource {resource_id} content"
            """
        }
        return templates.get(template_type, "")
    
    def explain_error(self, error: Exception) -> str:
        """エラーを初学者向けに説明"""
        explanations = {
            "TypeError": "型が一致しません。変数の型を確認してください。",
            "AttributeError": "存在しない属性やメソッドを呼び出しています。",
            "ImportError": "モジュールが見つかりません。pip installが必要かもしれません。"
        }
        error_type = type(error).__name__
        return explanations.get(error_type, f"エラーが発生しました: {error}")
```

## 7. セキュリティ標準

### 7.1 基本セキュリティ原則
```python
# 1. 入力検証
from pydantic import BaseModel, validator

class UserInput(BaseModel):
    """ユーザー入力の検証"""
    name: str
    email: str
    
    @validator('name')
    def validate_name(cls, v):
        if len(v) < 2:
            raise ValueError('名前は2文字以上である必要があります')
        return v
    
    @validator('email')
    def validate_email(cls, v):
        if '@' not in v:
            raise ValueError('有効なメールアドレスを入力してください')
        return v

# 2. ログ管理
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def secure_log(message: str, level: str = "info", sensitive_data: bool = False):
    """セキュアなログ出力"""
    if sensitive_data:
        message = "***SENSITIVE DATA MASKED***"
    
    timestamp = datetime.now().isoformat()
    log_entry = f"[{timestamp}] {message}"
    
    if level == "error":
        logger.error(log_entry)
    else:
        logger.info(log_entry)
```

### 7.2 MCP固有セキュリティ
```python
# MCPセキュリティガイドライン
class SecureMCPServer:
    """セキュアなMCPサーバー実装"""
    
    def __init__(self):
        self.rate_limiter = RateLimiter()
        self.input_validator = InputValidator()
    
    async def handle_request(self, request: MCPRequest) -> MCPResponse:
        """セキュアなリクエスト処理"""
        try:
            # 1. レート制限チェック
            if not await self.rate_limiter.check(request.client_id):
                raise SecurityError("Rate limit exceeded")
            
            # 2. 入力検証
            if not self.input_validator.validate(request.data):
                raise SecurityError("Invalid input data")
            
            # 3. 権限チェック
            if not self.check_permissions(request):
                raise SecurityError("Insufficient permissions")
            
            # 4. 処理実行
            result = await self.process_request(request)
            
            # 5. 出力サニタイズ
            sanitized_result = self.sanitize_output(result)
            
            return MCPResponse(success=True, data=sanitized_result)
            
        except SecurityError as e:
            logger.warning(f"Security violation: {e}")
            return MCPResponse(success=False, error="Security violation")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return MCPResponse(success=False, error="Internal error")
```

## 8. パフォーマンス標準

### 8.1 パフォーマンス目標
```yaml
# パフォーマンス指標
Response Time:
  Tool Execution: < 2秒
  Resource Access: < 1秒
  Prompt Generation: < 500ms
  
Throughput:
  Concurrent Users: 10-50
  Requests/second: 100-500
  
Resource Usage:
  Memory: < 256MB
  CPU: < 50%
  Disk I/O: Minimal
```

### 8.2 最適化技法
```python
# 1. 非同期処理最適化
import asyncio
from asyncio import Semaphore

class OptimizedMCPServer:
    """最適化されたMCPサーバー"""
    
    def __init__(self):
        self.semaphore = Semaphore(10)  # 同時実行数制限
        self.cache = {}  # 結果キャッシュ
    
    async def process_requests(self, requests: List[MCPRequest]) -> List[MCPResponse]:
        """バッチ処理で効率化"""
        async with self.semaphore:
            tasks = [self.process_single_request(req) for req in requests]
            return await asyncio.gather(*tasks)
    
    async def cached_resource_access(self, resource_id: str) -> str:
        """キャッシュを使ったリソースアクセス"""
        if resource_id in self.cache:
            return self.cache[resource_id]
        
        result = await self.fetch_resource(resource_id)
        self.cache[resource_id] = result
        return result

# 2. データベース最適化
class OptimizedDatabase:
    """最適化されたデータベースアクセス"""
    
    async def batch_insert(self, records: List[Dict]) -> None:
        """バッチ挿入で効率化"""
        query = "INSERT INTO table VALUES " + ",".join(["(?, ?, ?)"] * len(records))
        flat_values = [item for record in records for item in record.values()]
        await self.execute(query, flat_values)
    
    async def prepare_statements(self):
        """プリペアドステートメント使用"""
        self.insert_stmt = await self.prepare("INSERT INTO users VALUES (?, ?)")
        self.select_stmt = await self.prepare("SELECT * FROM users WHERE id = ?")
```

## 9. テスト標準

### 9.1 テスト戦略
```python
# テストピラミッド
# ユニットテスト (70%)
class TestMCPTool:
    """MCPツールのユニットテスト"""
    
    @pytest.mark.asyncio
    async def test_tool_execution(self):
        """ツール実行のテスト"""
        tool = CalculatorTool()
        result = await tool.execute({"a": 5, "b": 3, "op": "add"})
        assert result == 8
    
    @pytest.mark.asyncio
    async def test_tool_error_handling(self):
        """エラーハンドリングのテスト"""
        tool = CalculatorTool()
        with pytest.raises(ValueError):
            await tool.execute({"a": 5, "b": 0, "op": "div"})

# 統合テスト (20%)
class TestMCPIntegration:
    """MCP統合テスト"""
    
    @pytest.mark.asyncio
    async def test_sse_communication(self):
        """SSE通信のテスト"""
        server = MCPServer(transport="sse")
        client = TestClient()
        
        await server.start()
        response = await client.call_tool("calculator", {"a": 5, "b": 3})
        assert response.success is True

# E2Eテスト (10%)
class TestE2E:
    """エンドツーエンドテスト"""
    
    @pytest.mark.asyncio
    async def test_learning_workflow(self):
        """学習ワークフローのテスト"""
        # 学習者が初回ログインから基本チュートリアル完了まで
        user = await create_test_user()
        tutorial = await start_tutorial(user, "basic-mcp")
        
        for step in tutorial.steps:
            result = await execute_step(step)
            assert result.success is True
        
        progress = await get_progress(user)
        assert progress.completed is True
```

### 9.2 初学者向けテスト
```python
# 学習者コードのテスト支援
class LearningTestHelper:
    """学習者向けテストヘルパー"""
    
    def create_test_template(self, function_name: str) -> str:
        """テストテンプレート生成"""
        return f"""
import pytest
from your_module import {function_name}

class Test{function_name.title()}:
    \"\"\"
    {function_name}関数のテストクラス
    
    テストの書き方：
    1. 正常なケースをテストする
    2. エラーケースをテストする
    3. 境界値をテストする
    \"\"\"
    
    def test_{function_name}_normal_case(self):
        \"\"\"正常ケースのテスト\"\"\"
        # Given (準備)
        input_data = "test_input"
        expected = "expected_output"
        
        # When (実行)
        result = {function_name}(input_data)
        
        # Then (検証)
        assert result == expected
    
    def test_{function_name}_error_case(self):
        \"\"\"エラーケースのテスト\"\"\"
        # Given
        invalid_input = None
        
        # When & Then
        with pytest.raises(ValueError):
            {function_name}(invalid_input)
"""
    
    def explain_test_result(self, test_result) -> str:
        """テスト結果の説明"""
        if test_result.passed:
            return "✅ テストが成功しました！コードが正しく動作しています。"
        else:
            return f"""
❌ テストが失敗しました。

エラー内容: {test_result.error}

修正のヒント:
- 期待値と実際の値を比較してください
- 関数の実装を見直してください
- 入力データが正しいか確認してください
"""
```

## 10. デプロイメント標準

### 10.1 環境別設定
```toml
# config.toml テンプレート
[development]
debug = true
log_level = "DEBUG"
host = "localhost"
port = 8000
transport = "sse"
database_url = "sqlite:///dev.db"

[production]
debug = false
log_level = "INFO"
host = "0.0.0.0"
port = 8000
transport = "sse"
database_url = "sqlite:///prod.db"

[testing]
debug = true
log_level = "DEBUG"
host = "localhost"
port = 8001
transport = "stdio"
database_url = "sqlite:///:memory:"
```

### 10.2 デプロイスクリプト
```bash
#!/bin/bash
# deploy.sh - FastMCPアプリケーションデプロイ

set -e

echo "FastMCP Application Deployment Starting..."

# 1. 環境チェック
check_requirements() {
    echo "Checking requirements..."
    python --version
    pip --version
    
    if ! command -v python &> /dev/null; then
        echo "Error: Python is not installed"
        exit 1
    fi
}

# 2. 依存関係インストール
install_dependencies() {
    echo "Installing dependencies..."
    pip install -r requirements.txt
}

# 3. データベース初期化
init_database() {
    echo "Initializing database..."
    python scripts/init_db.py
}

# 4. 設定検証
validate_config() {
    echo "Validating configuration..."
    python scripts/validate_config.py
}

# 5. テスト実行
run_tests() {
    echo "Running tests..."
    pytest tests/ --cov=src
}

# 6. アプリケーション起動
start_application() {
    echo "Starting application..."
    if [ "$1" = "sse" ]; then
        uvicorn src.main:app --host 0.0.0.0 --port 8000
    else
        python src/main.py --transport stdio
    fi
}

# メイン実行
main() {
    check_requirements
    install_dependencies
    init_database
    validate_config
    run_tests
    start_application $1
}

main $@
```

## 11. 更新履歴

| バージョン | 更新日 | 更新者 | 更新内容 | 影響ドキュメント |
|---|-----|-----|----|----|
| 1.0 | 2025-06-23 | mcp starter | 初版作成（FastMCP対応開発標準の策定） | 02_test_specifications.md, 03_deployment_guide.md | 
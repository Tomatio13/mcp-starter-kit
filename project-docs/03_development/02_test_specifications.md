---
title: "テスト仕様"
version: "1.0"
last_updated: "2025-06-23"
author: "mcp starter"
reviewers: []
related_docs: ["01_development_standards.md", "02_application_design.md", "03_functional_requirements.md"]
status: "approved"
dependencies:
  upstream: ["01_development_standards.md", "02_design/02_application_design.md", "01_requirements/03_functional_requirements.md"]
  downstream: ["03_deployment_guide.md"]
impact_level: "high"
---

# テスト仕様

## 1. 概要

### 1.1 目的
本ドキュメントは、FastMCPスターターキットプロジェクトにおけるテスト戦略、テスト設計、テスト実装の指針を定義します。初学者がMCPサーバ開発において品質の高いコードを作成し、テスト駆動開発（TDD）を学習できる環境を提供します。

### 1.2 適用範囲
- FastMCPフレームワークを使用したMCPサーバのテスト
- SSE（Server-Sent Events）およびSTDIO通信方式の両方のテスト
- 初学者向け学習システムのテスト
- チュートリアル、サンプル、テンプレートプロジェクトのテスト

### 1.3 テスト目標
```yaml
品質目標:
  Code Coverage: ≥ 90%
  Bug Detection Rate: ≥ 95%
  Performance Regression: 0%
  Security Vulnerability: 0件

学習目標:
  TDD手法の習得: 基本→応用
  テスト設計スキル: 基礎→実践
  品質意識の向上: 概念→実装
  自動化理解: 手動→自動
```

## 2. テスト戦略

### 2.1 テストピラミッド
```
        E2Eテスト (10%)
       ┌─────────────────┐
      │  統合テスト (20%)  │
     └─────────────────────┘
    ┌─── ユニットテスト (70%) ────┐
   └─────────────────────────────┘

レベル別特徴:
- ユニットテスト: 高速・安定・開発者向け
- 統合テスト: 中速・機能検証・QA向け  
- E2Eテスト: 低速・ユーザー体験・受入れ向け
```

### 2.2 テスト分類
```yaml
機能別テスト:
  MCP Protocol: 
    - Tools実行テスト
    - Resources取得テスト
    - Prompts生成テスト
    - 通信プロトコルテスト
  
  Transport Layer:
    - SSE通信テスト
    - STDIO通信テスト
    - 接続管理テスト
    - エラーハンドリングテスト
  
  Learning System:
    - チュートリアル実行テスト
    - プログレス追跡テスト
    - 学習コンテンツテスト
    - 初学者支援機能テスト

品質別テスト:
  Performance: レスポンス時間・スループット
  Security: 認証・認可・入力検証
  Usability: 初学者体験・操作性
  Reliability: 障害回復・安定性
  Compatibility: 環境・ブラウザ対応
```

### 2.3 テスト環境戦略
```python
# テスト環境設定
class TestEnvironments:
    """テスト環境管理"""
    
    UNIT = {
        "database": "sqlite:///:memory:",
        "transport": "mock",
        "external_apis": "mock",
        "isolation": True
    }
    
    INTEGRATION = {
        "database": "sqlite:///test_integration.db",
        "transport": "sse",  # 実際の通信をテスト
        "external_apis": "stub",
        "isolation": False
    }
    
    E2E = {
        "database": "sqlite:///test_e2e.db", 
        "transport": "both",  # SSE + STDIO
        "external_apis": "sandbox",
        "isolation": False
    }
```

## 3. ユニットテスト仕様

### 3.1 MCPツールテスト
```python
import pytest
from unittest.mock import AsyncMock, patch
from src.features.tools.calculator import CalculatorTool
from src.core.protocol import MCPRequest, MCPResponse

class TestCalculatorTool:
    """計算ツールのユニットテスト
    
    初学者向けの基本的なMCPツール実装をテストし、
    ツール開発のベストプラクティスを学習できます。
    """
    
    @pytest.fixture
    def calculator_tool(self):
        """テスト用計算ツールのセットアップ"""
        return CalculatorTool()
    
    @pytest.mark.asyncio
    async def test_addition_success(self, calculator_tool):
        """正常な加算処理のテスト"""
        # Given: 入力パラメータの準備
        params = {"a": 5, "b": 3, "operation": "add"}
        
        # When: ツールの実行
        result = await calculator_tool.execute(params)
        
        # Then: 結果の検証
        assert result["success"] is True
        assert result["value"] == 8
        assert "計算結果" in result["message"]
    
    @pytest.mark.asyncio
    async def test_division_by_zero_error(self, calculator_tool):
        """ゼロ除算エラーのテスト"""
        # Given: ゼロ除算のパラメータ
        params = {"a": 10, "b": 0, "operation": "divide"}
        
        # When & Then: 例外発生の確認
        with pytest.raises(ValueError) as exc_info:
            await calculator_tool.execute(params)
        
        assert "ゼロで割ることはできません" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_invalid_operation_error(self, calculator_tool):
        """無効な演算子エラーのテスト"""
        # Given: 無効な演算子
        params = {"a": 5, "b": 3, "operation": "invalid"}
        
        # When & Then: エラーハンドリングの確認
        result = await calculator_tool.execute(params)
        
        assert result["success"] is False
        assert "無効な演算子" in result["error"]
    
    @pytest.mark.parametrize("a,b,op,expected", [
        (10, 5, "add", 15),
        (10, 5, "subtract", 5),
        (10, 5, "multiply", 50),
        (10, 5, "divide", 2.0),
    ])
    async def test_all_operations(self, calculator_tool, a, b, op, expected):
        """パラメータ化テストによる全演算の検証"""
        params = {"a": a, "b": b, "operation": op}
        result = await calculator_tool.execute(params)
        
        assert result["success"] is True
        assert result["value"] == expected

# 初学者向けテストヘルパー
class LearningTestHelper:
    """学習者向けテスト支援クラス"""
    
    @staticmethod
    def create_basic_test_template(tool_name: str) -> str:
        """基本的なテストテンプレートを生成
        
        Args:
            tool_name: テスト対象のツール名
            
        Returns:
            テストコードのテンプレート
        """
        return f'''
import pytest
from src.features.tools.{tool_name.lower()} import {tool_name}Tool

class Test{tool_name}Tool:
    """
    {tool_name}ツールのテストクラス
    
    学習ポイント：
    1. @pytest.fixture でテストデータを準備
    2. @pytest.mark.asyncio で非同期テスト
    3. Given-When-Then パターンでテスト構造を明確化
    """
    
    @pytest.fixture
    def {tool_name.lower()}_tool(self):
        """テスト用{tool_name}ツールのセットアップ"""
        return {tool_name}Tool()
    
    @pytest.mark.asyncio
    async def test_{tool_name.lower()}_success(self, {tool_name.lower()}_tool):
        """正常ケースのテスト"""
        # Given: テストデータの準備
        params = {{"input": "test_value"}}
        
        # When: ツールの実行
        result = await {tool_name.lower()}_tool.execute(params)
        
        # Then: 結果の検証
        assert result["success"] is True
        # さらに詳細な検証を追加してください
    
    @pytest.mark.asyncio
    async def test_{tool_name.lower()}_error(self, {tool_name.lower()}_tool):
        """エラーケースのテスト"""
        # Given: 無効なテストデータ
        params = {{"input": None}}
        
        # When & Then: エラーハンドリングの確認
        with pytest.raises(ValueError):
            await {tool_name.lower()}_tool.execute(params)
'''
```

### 3.2 MCPリソーステスト
```python
class TestTutorialResource:
    """チュートリアルリソースのユニットテスト"""
    
    @pytest.fixture
    def tutorial_resource(self):
        """テスト用チュートリアルリソースのセットアップ"""
        return TutorialResource()
    
    @pytest.fixture
    def mock_database(self):
        """モックデータベースのセットアップ"""
        with patch('src.utils.database.Database') as mock_db:
            mock_db.get_tutorial.return_value = {
                "id": "basic-mcp",
                "title": "MCP基礎チュートリアル",
                "content": "# MCP入門\n\nMCPサーバの基本的な作り方...",
                "difficulty": "beginner",
                "estimated_time": 30
            }
            yield mock_db
    
    @pytest.mark.asyncio
    async def test_get_tutorial_success(self, tutorial_resource, mock_database):
        """チュートリアル取得成功のテスト"""
        # Given: 有効なチュートリアルID
        tutorial_id = "basic-mcp"
        
        # When: リソースの取得
        result = await tutorial_resource.get(tutorial_id)
        
        # Then: 結果の検証
        assert result["success"] is True
        assert result["data"]["id"] == tutorial_id
        assert "title" in result["data"]
        assert "content" in result["data"]
        mock_database.get_tutorial.assert_called_once_with(tutorial_id)
    
    @pytest.mark.asyncio
    async def test_get_tutorial_not_found(self, tutorial_resource, mock_database):
        """存在しないチュートリアルのテスト"""
        # Given: 存在しないチュートリアルID
        mock_database.get_tutorial.return_value = None
        tutorial_id = "non-existent"
        
        # When: リソースの取得
        result = await tutorial_resource.get(tutorial_id)
        
        # Then: エラーレスポンスの確認
        assert result["success"] is False
        assert "見つかりません" in result["error"]
```

### 3.3 通信レイヤーテスト
```python
class TestTransportLayer:
    """通信レイヤーのユニットテスト"""
    
    @pytest.mark.asyncio
    async def test_sse_transport_connection(self):
        """SSE通信の接続テスト"""
        # Given: SSEトランスポートの設定
        transport = SSETransport(host="localhost", port=8000)
        
        # When: 接続の確立
        with patch('uvicorn.run') as mock_uvicorn:
            await transport.start()
            
        # Then: 正しいパラメータでサーバー起動確認
        mock_uvicorn.assert_called_once()
        args, kwargs = mock_uvicorn.call_args
        assert kwargs["host"] == "localhost"
        assert kwargs["port"] == 8000
    
    @pytest.mark.asyncio  
    async def test_stdio_transport_message_handling(self):
        """STDIO通信のメッセージ処理テスト"""
        # Given: STDIOトランスポートとモック入出力
        transport = STDIOTransport()
        
        with patch('sys.stdin') as mock_stdin, \
             patch('sys.stdout') as mock_stdout:
            
            # JSONRPCメッセージをモック
            mock_stdin.readline.return_value = json.dumps({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "tools/call",
                "params": {"name": "calculator", "arguments": {"a": 5, "b": 3}}
            })
            
            # When: メッセージの処理
            await transport.handle_message()
            
            # Then: 適切なレスポンスの確認
            mock_stdout.write.assert_called()
            response = json.loads(mock_stdout.write.call_args[0][0])
            assert response["jsonrpc"] == "2.0"
            assert response["id"] == 1
```

## 4. 統合テスト仕様

### 4.1 MCP通信統合テスト
```python
class TestMCPIntegration:
    """MCP通信の統合テスト"""
    
    @pytest.fixture
    async def mcp_server(self):
        """テスト用MCPサーバーの起動"""
        server = MCPServer(
            transport="sse",
            host="localhost", 
            port=8001,
            database_url="sqlite:///test_integration.db"
        )
        await server.start()
        yield server
        await server.stop()
    
    @pytest.fixture
    def mcp_client(self):
        """テスト用MCPクライアント"""
        return MCPClient(base_url="http://localhost:8001")
    
    @pytest.mark.asyncio
    async def test_tool_execution_via_sse(self, mcp_server, mcp_client):
        """SSE経由でのツール実行統合テスト"""
        # Given: サーバーが起動済み、クライアントが接続
        await mcp_client.connect()
        
        # When: ツールの実行要求
        response = await mcp_client.call_tool(
            name="calculator",
            arguments={"a": 10, "b": 5, "operation": "multiply"}
        )
        
        # Then: 正しい結果の受信確認
        assert response.success is True
        assert response.result == 50
        
        # 接続のクリーンアップ
        await mcp_client.disconnect()
    
    @pytest.mark.asyncio
    async def test_resource_access_via_sse(self, mcp_server, mcp_client):
        """SSE経由でのリソースアクセス統合テスト"""
        # Given: 接続済みクライアント
        await mcp_client.connect()
        
        # When: リソースの取得要求
        response = await mcp_client.get_resource("tutorials/basic-mcp")
        
        # Then: リソース内容の確認
        assert response.success is True
        assert "content" in response.data
        assert "title" in response.data
        
        await mcp_client.disconnect()
```

### 4.2 学習システム統合テスト
```python
class TestLearningSystemIntegration:
    """学習システムの統合テスト"""
    
    @pytest.fixture
    async def learning_system(self):
        """学習システムのセットアップ"""
        system = LearningSystem(database_url="sqlite:///test_learning.db")
        await system.initialize()
        yield system
        await system.cleanup()
    
    @pytest.mark.asyncio
    async def test_tutorial_completion_workflow(self, learning_system):
        """チュートリアル完了ワークフローの統合テスト"""
        # Given: 新規学習者の登録
        user_id = "test_user_001"
        await learning_system.register_user(user_id, "初学者太郎")
        
        # When: チュートリアルの開始
        tutorial = await learning_system.start_tutorial(user_id, "basic-mcp")
        assert tutorial.status == "in_progress"
        
        # ステップごとの実行と進捗確認
        for step_id in tutorial.steps:
            # ステップの実行
            result = await learning_system.execute_step(user_id, step_id)
            assert result.success is True
            
            # 進捗の確認
            progress = await learning_system.get_progress(user_id)
            assert step_id in progress.completed_steps
        
        # Then: チュートリアル完了確認
        final_status = await learning_system.get_tutorial_status(user_id, "basic-mcp")
        assert final_status == "completed"
        
        # 修了証明書の発行確認
        certificate = await learning_system.get_certificate(user_id, "basic-mcp")
        assert certificate is not None
        assert certificate.user_id == user_id
```

## 5. テスト自動化

### 5.1 CI/CDパイプライン
```yaml
# .github/workflows/test.yml
name: FastMCP Starter Test Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: [3.8, 3.9, 3.10, 3.11]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v3
      with:
        python-version: ${{ matrix.python-version }}
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install -r requirements-test.txt
    
    - name: Run unit tests
      run: |
        pytest tests/unit/ \
          --cov=src \
          --cov-report=xml \
          --cov-report=html \
          --junit-xml=test-results.xml
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python 3.11
      uses: actions/setup-python@v3
      with:
        python-version: 3.11
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install -r requirements-test.txt
    
    - name: Run integration tests
      run: |
        pytest tests/integration/ \
          --junit-xml=integration-test-results.xml

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python 3.11
      uses: actions/setup-python@v3
      with:
        python-version: 3.11
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install -r requirements-test.txt
    
    - name: Run E2E tests
      run: |
        pytest tests/e2e/ \
          --junit-xml=e2e-test-results.xml \
          --timeout=300
```

### 5.2 テスト実行スクリプト
```bash
#!/bin/bash
# scripts/test.sh - テスト実行スクリプト

set -e

echo "FastMCP Starter Test Runner"
echo "=========================="

# 環境変数の設定
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"
export TEST_DATABASE_URL="sqlite:///:memory:"

# テスト種別の選択
test_type=${1:-"all"}

case $test_type in
    "unit")
        echo "Running unit tests..."
        pytest tests/unit/ \
            --cov=src \
            --cov-report=term-missing \
            --cov-report=html:htmlcov \
            -v
        ;;
    "integration") 
        echo "Running integration tests..."
        pytest tests/integration/ \
            --tb=short \
            -v
        ;;
    "e2e")
        echo "Running E2E tests..."
        pytest tests/e2e/ \
            --tb=short \
            --timeout=300 \
            -v
        ;;
    "performance")
        echo "Running performance tests..."
        pytest tests/performance/ \
            --benchmark-only \
            --benchmark-save=performance \
            -v
        ;;
    "all")
        echo "Running all tests..."
        
        # ユニットテスト
        echo "1. Unit Tests"
        pytest tests/unit/ --cov=src --cov-report=term-missing -x
        
        # 統合テスト
        echo "2. Integration Tests"
        pytest tests/integration/ -x
        
        # E2Eテスト
        echo "3. E2E Tests"
        pytest tests/e2e/ --timeout=300 -x
        
        echo "All tests completed successfully!"
        ;;
    *)
        echo "Usage: $0 [unit|integration|e2e|performance|all]"
        exit 1
        ;;
esac

echo "Test execution completed!"
```

## 6. 品質保証

### 6.1 テストカバレッジ目標
```python
# coverage配置 (.coveragerc)
[run]
source = src/
omit = 
    */tests/*
    */venv/*
    */migrations/*
    */scripts/*

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError
    if __name__ == .__main__.:

precision = 2
show_missing = True

[html]
directory = htmlcov
```

### 6.2 初学者向けテスト支援
```python
class LearnerTestSupport:
    """初学者向けテスト支援システム"""
    
    def __init__(self):
        self.test_templates = {}
        self.explanation_db = {}
    
    def generate_test_explanation(self, test_code: str) -> str:
        """テストコードの解説を生成"""
        explanations = []
        
        if "@pytest.fixture" in test_code:
            explanations.append("""
            🔧 @pytest.fixture について:
            テストで使用する共通のデータやオブジェクトを準備する仕組みです。
            複数のテストで同じセットアップを再利用できます。
            """)
        
        if "@pytest.mark.asyncio" in test_code:
            explanations.append("""
            ⚡ @pytest.mark.asyncio について:
            非同期関数（async/await）をテストするために必要なマーカーです。
            MCPサーバーは非同期処理を多用するため重要です。
            """)
        
        if "assert" in test_code:
            explanations.append("""
            ✅ assert文について:
            テストの検証を行う文です。条件が偽の場合、テストが失敗します。
            assert result == expected  # resultとexpectedが等しいことを確認
            """)
        
        return "\n".join(explanations)
    
    def suggest_test_improvements(self, test_code: str) -> List[str]:
        """テストコードの改善提案"""
        suggestions = []
        
        if "# Given" not in test_code:
            suggestions.append("Given-When-Then パターンを使用して、テストの構造を明確にしましょう")
        
        if not re.search(r'async def test_.*_error', test_code):
            suggestions.append("エラーケースのテストも追加して、エラーハンドリングを確認しましょう")
        
        if "@pytest.parametrize" not in test_code:
            suggestions.append("複数のテストケースがある場合は、パラメータ化テストを検討しましょう")
        
        return suggestions
```

## 7. 更新履歴

| バージョン | 更新日 | 更新者 | 更新内容 | 影響ドキュメント |
|---|-----|-----|----|----|
| 1.0 | 2025-06-23 | mcp starter | 初版作成（FastMCP対応テスト仕様の策定） | 01_development_standards.md, 03_deployment_guide.md |
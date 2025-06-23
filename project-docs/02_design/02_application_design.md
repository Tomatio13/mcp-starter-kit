---
title: "アプリケーション設計書"
version: "1.0"
last_updated: "2025-06-23"
author: "mcp starter"
reviewers: []
related_docs:
  - "01_system_architecture.md"
  - "../01_requirements/03_functional_requirements.md"
  - "03_database_design.md"
  - "04_interface_design.md"
  - "../03_development/01_development_standards.md"
status: "draft"
dependencies:
  upstream:
    - "01_system_architecture.md"
    - "../01_requirements/03_functional_requirements.md"
  downstream:
    - "03_database_design.md"
    - "04_interface_design.md"
    - "../03_development/01_development_standards.md"
---

# アプリケーション設計書

## 1. 概要
FastMCPスターターキットのアプリケーション設計は、MCPサーバ開発初心者が段階的に学習できる構造を採用し、SSE/STDIO両方の通信方式に対応した統一的なAPIを提供します。モジュラー設計により、各機能が独立して動作し、学習者が理解しやすい明確な責任分離を実現します。

### 1.1 設計原則
- **学習容易性**: 初学者でも理解しやすいシンプルな構造
- **段階的開示**: 複雑な機能を段階的に学習できる構成
- **実用性**: 学習だけでなく実際の開発でも使える品質
- **拡張性**: カスタマイズ・機能追加が容易

## 2. アプリケーション構成
### 2.1 アプリケーション全体構成
```
FastMCP Starter Kit Application Architecture

┌─────────────────────────────────────────────────────────┐
│                   Application Layer                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Transport Layer                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │ │
│  │  │     SSE     │  │    STDIO    │  │   WebSocket  │ │ │
│  │  │  Transport  │  │  Transport  │  │  Transport   │ │ │
│  │  │             │  │             │  │  (Future)    │ │ │
│  │  └─────────────┘  └─────────────┘  └──────────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
│                          │                               │
│                          ▼                               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                 MCP Protocol Engine                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │ │
│  │  │   Message   │  │   Request   │  │  Response   │ │ │
│  │  │   Parser    │  │  Handler    │  │  Generator  │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
│                          │                               │
│                          ▼                               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │               Feature Management                    │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │ │
│  │  │  Resource   │  │    Tool     │  │   Prompt    │ │ │
│  │  │  Registry   │  │  Registry   │  │  Registry   │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
│                          │                               │
│                          ▼                               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │               Learning System                       │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │ │
│  │  │  Tutorial   │  │  Progress   │  │   Sample    │ │ │
│  │  │   Manager   │  │   Tracker   │  │  Generator  │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
│                          │                               │
│                          ▼                               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Development Tools                      │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │ │
│  │  │  Template   │  │   Testing   │  │   Deploy    │ │ │
│  │  │   Engine    │  │   Runner    │  │   Manager   │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
│                          │                               │
│                          ▼                               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                Storage Layer                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │ │
│  │  │  Database   │  │    File     │  │    Cache    │ │ │
│  │  │   Access    │  │   Manager   │  │   Manager   │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 レイヤー構成
| レイヤー | 役割 | 主要コンポーネント |
|----------|------|-------------------|
| Transport Layer | 通信プロトコル抽象化 | SSETransport, STDIOTransport, WebSocketTransport |
| MCP Protocol Engine | MCPプロトコル処理 | MessageParser, RequestHandler, ResponseGenerator |
| Feature Management | MCP機能管理 | ResourceRegistry, ToolRegistry, PromptRegistry |
| Learning System | 学習支援システム | TutorialManager, ProgressTracker, SampleGenerator |
| Development Tools | 開発支援ツール | TemplateEngine, TestingRunner, DeployManager |
| Storage Layer | データ永続化 | DatabaseAccess, FileManager, CacheManager |

## 3. モジュール設計
### 3.1 Core Modules（コアモジュール）
| モジュール名 | 機能概要 | 依存関係 |
|--------------|----------|----------|
| `fastmcp_starter.core.server` | MCPサーバメインエンジン | fastmcp, asyncio |
| `fastmcp_starter.core.transport` | 通信層抽象化 | fastmcp, uvicorn |
| `fastmcp_starter.core.protocol` | MCPプロトコル処理 | pydantic, json |
| `fastmcp_starter.core.registry` | 機能レジストリ管理 | typing, inspect |

### 3.2 Feature Modules（機能モジュール）
| モジュール名 | 機能概要 | 依存関係 |
|--------------|----------|----------|
| `fastmcp_starter.features.resources` | リソース管理機能 | aiofiles, pathlib |
| `fastmcp_starter.features.tools` | ツール管理機能 | subprocess, json |
| `fastmcp_starter.features.prompts` | プロンプト管理機能 | jinja2, yaml |

### 3.3 Learning Modules（学習モジュール）
| モジュール名 | 機能概要 | 依存関係 |
|--------------|----------|----------|
| `fastmcp_starter.learning.tutorial` | チュートリアル管理 | sqlite3, yaml |
| `fastmcp_starter.learning.progress` | 進捗追跡 | sqlite3, datetime |
| `fastmcp_starter.learning.samples` | サンプル生成 | jinja2, shutil |

### 3.4 Development Modules（開発支援モジュール）
| モジュール名 | 機能概要 | 依存関係 |
|--------------|----------|----------|
| `fastmcp_starter.dev.templates` | プロジェクトテンプレート | cookiecutter, git |
| `fastmcp_starter.dev.testing` | テスト実行支援 | pytest, coverage |
| `fastmcp_starter.dev.deploy` | デプロイ支援 | docker, subprocess |

### 3.5 Utility Modules（ユーティリティモジュール）
| モジュール名 | 機能概要 | 依存関係 |
|--------------|----------|----------|
| `fastmcp_starter.utils.config` | 設定管理 | pydantic, toml |
| `fastmcp_starter.utils.logging` | ログ管理 | logging, colorama |
| `fastmcp_starter.utils.validation` | バリデーション | pydantic, typing |

## 4. API設計
### 4.1 Transport Layer API
| API名 | エンドポイント | HTTPメソッド | 概要 |
|-------|----------------|--------------|------|
| SSE Endpoint | `/mcp/sse` | GET | SSE通信開始 |
| Health Check | `/health` | GET | サーバ状態確認 |
| Metrics | `/metrics` | GET | パフォーマンス情報 |

### 4.2 Internal API（Python API）
```python
# Transport Factory API
class TransportFactory:
    @staticmethod
    def create_transport(transport_type: str) -> BaseTransport
    
# MCP Server API  
class MCPServer:
    async def start(self, transport_type: str, **kwargs)
    async def stop(self)
    def register_resource(self, resource: Resource)
    def register_tool(self, tool: Tool)
    def register_prompt(self, prompt: Prompt)

# Learning System API
class TutorialManager:
    def get_tutorials(self) -> List[Tutorial]
    def start_tutorial(self, tutorial_id: str) -> TutorialSession
    def track_progress(self, session_id: str, step_id: str)

# Development Tools API
class TemplateEngine:
    def create_project(self, template_name: str, project_name: str)
    def list_templates(self) -> List[Template]
```

## 5. データフロー設計
### 5.1 主要データフロー
```
Request Flow (SSE):
Claude → HTTP/SSE → SSETransport → MCPProtocolEngine → FeatureRegistry → Business Logic

Request Flow (STDIO):
IDE → STDIN → STDIOTransport → MCPProtocolEngine → FeatureRegistry → Business Logic

Response Flow:
Business Logic → MCPProtocolEngine → Transport Layer → Client

Learning Flow:
User Action → TutorialManager → ProgressTracker → Database → UI Update
```

### 5.2 データ処理パターン
- **同期処理**: 設定読み込み、バリデーション、簡単なツール実行
- **非同期処理**: ファイルI/O、ネットワーク通信、長時間実行ツール
- **バッチ処理**: ログローテーション、プログレスレポート生成、テンプレート一括更新

## 6. 主要機能設計
### 6.1 環境自動構築機能（F001）
```python
class EnvironmentManager:
    async def setup_environment(self, config: SetupConfig) -> SetupResult:
        """
        1. Python環境検証
        2. 依存関係インストール  
        3. 設定ファイル生成
        4. 初回起動確認
        """
        
    async def validate_environment(self) -> ValidationResult:
        """環境状態検証"""
        
    async def reset_environment(self) -> ResetResult:
        """環境初期化"""
```

### 6.2 チュートリアルシステム（F002）
```python
class TutorialManager:
    def get_tutorial_tree(self) -> TutorialTree:
        """
        階層構造のチュートリアル一覧:
        - 基礎編 (10分)
          - MCPとは
          - 基本的なツール作成
        - 実践編 (30分)  
          - ファイル操作ツール
          - API連携ツール
        - 応用編 (60分)
          - 非同期処理
          - カスタムリソース
        """
        
    async def start_tutorial(self, tutorial_id: str) -> TutorialSession:
        """チュートリアル開始"""
        
    async def track_progress(self, session_id: str, step_id: str):
        """進捗追跡"""
```

### 6.3 サンプルプロジェクト機能（F003）
```python
class SampleProjectManager:
    def get_sample_projects(self) -> List[SampleProject]:
        """
        サンプルプロジェクト一覧:
        1. シンプルファイル管理 (基礎)
        2. Web API連携ツール (実用)  
        3. データ分析支援 (実用)
        4. コード生成支援 (高度)
        5. 開発環境管理 (高度)
        """
        
    async def deploy_sample(self, project_id: str, target_dir: str):
        """サンプルプロジェクト展開"""
        
    async def customize_sample(self, project_id: str, customization: Dict):
        """サンプルカスタマイズ"""
```

### 6.4 プロジェクトテンプレート機能（F004）
```python
class TemplateEngine:
    def get_templates(self) -> List[ProjectTemplate]:
        """
        テンプレート一覧:
        - basic: 基本的なMCPサーバ
        - file-tools: ファイル操作特化
        - api-client: API連携特化  
        - data-analysis: データ分析特化
        """
        
    async def create_from_template(self, template_id: str, config: ProjectConfig):
        """テンプレートからプロジェクト生成"""
        
    async def update_template(self, template_id: str, updates: Dict):
        """テンプレート更新"""
```

### 6.5 統合テスト環境（F005）
```python
class TestingFramework:
    async def run_unit_tests(self) -> TestResult:
        """ユニットテスト実行"""
        
    async def run_integration_tests(self) -> TestResult:
        """統合テスト実行"""
        
    async def run_mcp_protocol_tests(self) -> TestResult:
        """MCPプロトコル適合性テスト"""
        
    async def generate_coverage_report(self) -> CoverageReport:
        """カバレッジレポート生成"""
```

### 6.6 デプロイ支援ツール（F006）
```python
class DeploymentManager:
    async def package_for_local(self) -> PackageResult:
        """ローカル配布用パッケージ作成"""
        
    async def package_for_docker(self) -> DockerResult:
        """Docker配布用パッケージ作成"""
        
    async def deploy_to_pypi(self, credentials: PyPICredentials) -> DeployResult:
        """PyPIデプロイ"""
        
    async def create_github_release(self, release_config: ReleaseConfig):
        """GitHubリリース作成"""
```

## 7. エラー処理設計
### 7.1 エラー分類
| エラー種別 | 対応方法 | 表示内容 |
|------------|----------|----------|
| システムエラー | ログ記録+詳細情報表示 | 技術的エラーメッセージ+復旧手順 |
| ビジネスエラー | ユーザフレンドリー表示 | 理解しやすいエラーメッセージ+対処法 |
| バリデーションエラー | 入力値修正提案 | 具体的な修正内容+例示 |
| 通信エラー | 自動リトライ+フォールバック | 通信状態+代替手段提示 |

### 7.2 エラーハンドリング戦略
```python
class ErrorHandler:
    async def handle_transport_error(self, error: TransportError):
        """通信エラー: 自動リトライ+ログ記録"""
        
    async def handle_protocol_error(self, error: ProtocolError):
        """プロトコルエラー: エラーレスポンス返却"""
        
    async def handle_business_error(self, error: BusinessError):
        """ビジネスエラー: ユーザフレンドリーメッセージ"""
        
    async def handle_system_error(self, error: SystemError):
        """システムエラー: 詳細ログ+復旧提案"""
```

## 8. セキュリティ設計
### 8.1 入力検証
```python
class InputValidator:
    def validate_mcp_request(self, request: MCPRequest) -> ValidationResult:
        """MCPリクエストバリデーション"""
        
    def sanitize_file_path(self, path: str) -> str:
        """ファイルパスサニタイズ"""
        
    def validate_tool_parameters(self, params: Dict) -> ValidationResult:
        """ツールパラメータバリデーション"""
```

### 8.2 アクセス制御
```python
class AccessController:
    def check_file_access(self, path: str) -> bool:
        """ファイルアクセス権限チェック"""
        
    def check_command_execution(self, command: str) -> bool:
        """コマンド実行権限チェック"""
        
    def check_network_access(self, url: str) -> bool:
        """ネットワークアクセス権限チェック"""
```

## 9. パフォーマンス設計
### 9.1 非同期処理設計
```python
# 非同期処理パターン
class AsyncPatterns:
    async def concurrent_tool_execution(self, tools: List[Tool]):
        """並列ツール実行"""
        
    async def streaming_file_processing(self, file_path: str):
        """ストリーミングファイル処理"""
        
    async def batched_database_operations(self, operations: List[Operation]):
        """バッチDB操作"""
```

### 9.2 キャッシュ戦略
```python
class CacheManager:
    def cache_tutorial_content(self, tutorial_id: str, content: str):
        """チュートリアルコンテンツキャッシュ"""
        
    def cache_template_data(self, template_id: str, data: Dict):
        """テンプレートデータキャッシュ"""
        
    def invalidate_cache(self, cache_key: str):
        """キャッシュ無効化"""
```

## 10. 設定管理設計
### 10.1 設定ファイル構造
```toml
# fastmcp_starter.toml
[server]
host = "127.0.0.1"
port = 8000
log_level = "INFO"

[transport]
default = "sse"
sse_enabled = true
stdio_enabled = true
websocket_enabled = false

[learning]
tutorial_auto_save = true
progress_tracking = true
beginner_mode = true

[development]
auto_reload = true
debug_mode = false
test_on_change = true

[security]
allow_file_access = true
allow_network_access = false
allow_command_execution = false
```

### 10.2 設定管理API
```python
class ConfigManager:
    def load_config(self, config_path: str) -> AppConfig:
        """設定ファイル読み込み"""
        
    def save_config(self, config: AppConfig, config_path: str):
        """設定ファイル保存"""
        
    def get_setting(self, key: str) -> Any:
        """設定値取得"""
        
    def update_setting(self, key: str, value: Any):
        """設定値更新"""
```

## 11. ライフサイクル管理
### 11.1 アプリケーション起動フロー
```python
async def application_startup():
    """
    1. 設定ファイル読み込み
    2. ログシステム初期化  
    3. データベース接続
    4. プラグイン読み込み
    5. Transport Layer初期化
    6. ヘルスチェック実行
    7. サーバ開始
    """
```

### 11.2 アプリケーション終了フロー
```python
async def application_shutdown():
    """
    1. 新規リクエスト受付停止
    2. 実行中処理完了待機
    3. データベース切断
    4. ログフラッシュ
    5. リソース解放
    """
```

## 12. 承認
| 項目 | 氏名 | 承認日 |
|------|------|--------|
| 作成者 | mcp starter | 2025-06-23 |
| 承認者 | - | - |

## 更新履歴
| バージョン | 更新日 | 更新者 | 更新内容 | 影響ドキュメント |
|---|---|---|---|---|
| 1.0 | 2025-06-23 | mcp starter | FastMCPスターターキット向けアプリケーション設計初版作成 | 03_database_design.md, 04_interface_design.md | 
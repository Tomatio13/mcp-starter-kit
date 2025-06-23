---
title: "システムアーキテクチャ設計書"
version: "1.0"
last_updated: "2025-06-23"
author: "mcp starter"
reviewers: []
related_docs:
  - "../01_requirements/01_project_overview.md"
  - "../01_requirements/02_business_requirements.md"
  - "../01_requirements/03_functional_requirements.md"
  - "../01_requirements/04_non_functional_requirements.md"
  - "../01_requirements/05_constraints.md"
  - "02_application_design.md"
  - "03_database_design.md"
  - "04_interface_design.md"
  - "../03_development/01_development_standards.md"
  - "../04_operations/01_operations_manual.md"
  - "../04_operations/02_monitoring_backup.md"
status: "draft"
dependencies:
  upstream:
    - "../01_requirements/01_project_overview.md"
    - "../01_requirements/02_business_requirements.md"
    - "../01_requirements/03_functional_requirements.md"
    - "../01_requirements/04_non_functional_requirements.md"
    - "../01_requirements/05_constraints.md"
  downstream:
    - "02_application_design.md"
    - "03_database_design.md"
    - "04_interface_design.md"
    - "../03_development/01_development_standards.md"
    - "../04_operations/01_operations_manual.md"
    - "../04_operations/02_monitoring_backup.md"
---

# システムアーキテクチャ設計書

## 1. 概要
FastMCPスターターキットは、MCPサーバ開発初心者が簡単に学習・開発を開始できるオールインワンパッケージです。本設計書では、SSE（Server-Sent Events）とSTDIO（標準入出力）両方の通信方式に対応したMCPサーバ環境のシステムアーキテクチャを定義します。

### 1.1 アーキテクチャ原則
- **シンプルさ優先**: 初学者でも理解しやすい構成
- **モジュラー設計**: 各機能が独立して動作可能
- **プロトコル透過性**: SSE/STDIO両方に同一のAPIで対応
- **ゼロコンフィグ**: 最小限の設定で動作開始可能

## 2. システム全体構成
### 2.1 システム構成図
```
┌─────────────────────────────────────────────────────────┐
│                FastMCP Starter Kit                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │   MCP Client    │  │   MCP Client    │             │
│  │  (Claude/etc)   │  │   (Local IDE)   │             │
│  └─────────────────┘  └─────────────────┘             │
│           │                      │                     │
│           │ SSE                  │ STDIO               │
│           ▼                      ▼                     │
│  ┌─────────────────────────────────────────────────────┤
│  │          FastMCP Communication Layer               │
│  │  ┌─────────────┐    ┌─────────────────────────────┐│
│  │  │   SSE       │    │        STDIO                ││
│  │  │ Transport   │    │      Transport              ││
│  │  └─────────────┘    └─────────────────────────────┘│
│  └─────────────────────────────────────────────────────┤
│           │                                             │
│           ▼                                             │
│  ┌─────────────────────────────────────────────────────┤
│  │            MCP Server Core Engine                   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  │  Resource   │  │    Tool     │  │   Prompt    │ │
│  │  │  Manager    │  │   Manager   │  │   Manager   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │
│  └─────────────────────────────────────────────────────┤
│           │                                             │
│           ▼                                             │
│  ┌─────────────────────────────────────────────────────┤
│  │          Tutorial & Learning System                 │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  │  Tutorial   │  │  Progress   │  │   Sample    │ │
│  │  │   Engine    │  │  Tracker    │  │  Projects   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │
│  └─────────────────────────────────────────────────────┤
│           │                                             │
│           ▼                                             │
│  ┌─────────────────────────────────────────────────────┤
│  │              Developer Tools                        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  │  Template   │  │   Testing   │  │   Deploy    │ │
│  │  │  Generator  │  │    Suite    │  │   Helper    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │
│  └─────────────────────────────────────────────────────┤
│           │                                             │
│           ▼                                             │
│  ┌─────────────────────────────────────────────────────┤
│  │               Storage Layer                         │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  │  SQLite     │  │    File     │  │    Cache    │ │
│  │  │    DB       │  │   Storage   │  │   Storage   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │
│  └─────────────────────────────────────────────────────┘
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 主要コンポーネント
| コンポーネント | 役割 | 技術/製品 | 備考 |
|----------------|------|-----------|------|
| FastMCP Communication Layer | SSE/STDIO双方向通信管理 | FastMCP | プロトコル抽象化 |
| MCP Server Core Engine | MCPプロトコル実装・リソース管理 | Python + FastMCP | Tools/Resources/Prompts管理 |
| Tutorial & Learning System | 段階的学習プログラム提供 | Python + SQLite | プログレス追跡機能 |
| Developer Tools | 開発支援ツール群 | Python Scripts | テンプレート生成、テスト、デプロイ |
| Storage Layer | データ永続化 | SQLite + File System | 軽量・ポータブル |

### 2.3 アーキテクチャパターン
- **アーキテクチャスタイル**: レイヤードアーキテクチャ + プラグインアーキテクチャ
- **設計パターン**: Strategy Pattern（通信方式選択）、Factory Pattern（プロジェクト生成）
- **アーキテクチャ原則**: 関心の分離、依存性注入、設定より規約

## 3. 物理構成設計
### 3.1 ハードウェア構成
| サーバー種別 | 台数 | スペック | 用途 | 配置場所 |
|--------------|------|----------|------|----------|
| 開発マシン | 1 | CPU: 2コア以上、メモリ: 4GB以上、ストレージ: 2GB以上 | MCPサーバ実行・開発環境 | ローカル |
| 学習者PC | N | CPU: 1コア以上、メモリ: 2GB以上、ストレージ: 1GB以上 | スターターキット利用 | ローカル |

### 3.2 ネットワーク構成
#### 3.2.1 ネットワーク構成図
```
開発者ローカル環境
┌─────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  │
│  │   Claude    │  │   VS Code   │  │
│  │   (SSE)     │  │  (STDIO)    │  │
│  └─────────────┘  └─────────────┘  │
│         │                │         │
│    localhost:8000   stdin/stdout    │
│         │                │         │
│  ┌─────────────────────────────────┐ │
│  │     FastMCP Server              │ │
│  │   (127.0.0.1:8000)              │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 3.2.2 ネットワークセグメント
| セグメント名 | IPアドレス帯 | 用途 | セキュリティレベル |
|--------------|--------------|------|-------------------|
| ローカルホスト | 127.0.0.1/8 | MCP通信 | 高（ローカルのみ） |
| プライベートLAN | 192.168.x.x/24 | LAN内開発共有 | 中（LAN内制限） |

#### 3.2.3 通信要件
| 通信経路 | プロトコル | ポート | 暗号化 | 備考 |
|----------|------------|--------|--------|------|
| Claude → MCPServer | HTTP/SSE | 8000 | HTTPS | Server-Sent Events |
| IDEClient → MCPServer | STDIO | - | なし | 標準入出力パイプ |
| WebUI → MCPServer | HTTP/WebSocket | 8001 | HTTPS | 管理画面（オプション） |

## 4. ソフトウェア構成設計
### 4.1 ソフトウェア構成
| 層 | ソフトウェア | バージョン | 役割 |
|----|--------------|------------|------|
| 通信層 | FastMCP | latest | SSE/STDIO通信抽象化 |
| アプリケーション層 | Python | 3.8+ | MCPサーバロジック実装 |
| データ層 | SQLite | 3.35+ | 学習プログレス・設定管理 |
| インフラ層 | Docker (Optional) | 20+ | 環境構築支援 |

### 4.2 ミドルウェア構成
| ミドルウェア | バージョン | 用途 | 設定要件 |
|--------------|------------|------|----------|
| uvicorn | latest | ASGI Webサーバ（SSE用） | host=127.0.0.1, port=8000 |
| aiofiles | latest | 非同期ファイルI/O | デフォルト設定 |
| Jinja2 | 3.0+ | テンプレートエンジン | デフォルト設定 |

## 5. セキュリティアーキテクチャ
### 5.1 セキュリティ層構成
| セキュリティ層 | 実装技術 | 対策内容 |
|----------------|----------|----------|
| ネットワーク層 | ローカルバインド | 127.0.0.1のみリッスン |
| アプリケーション層 | 入力検証 | パラメータサニタイズ |
| データ層 | ファイルシステム権限 | ユーザーディレクトリ内制限 |

### 5.2 認証・認可アーキテクチャ
- **認証方式**: なし（ローカル実行前提）
- **認可方式**: ファイルシステムレベル権限
- **セッション管理**: インメモリ状態管理

### 5.3 データ保護
- **暗号化方式**: HTTPS（SSE通信時）
- **鍵管理**: OSレベル証明書ストア利用
- **アクセス制御**: ファイルシステム権限

## 6. 可用性設計
### 6.1 冗長化構成
| コンポーネント | 冗長化方式 | フェイルオーバー方式 |
|----------------|------------|---------------------|
| MCPサーバ | 単一インスタンス | プロセス再起動 |
| データベース | ファイルバックアップ | 手動復旧 |
| 設定ファイル | Gitバージョン管理 | 手動復元 |

### 6.2 バックアップ設計
| データ種別 | バックアップ方式 | 頻度 | 保存期間 |
|------------|-------------------|------|----------|
| 学習プログレス | SQLiteダンプ | 手動 | 無期限 |
| プロジェクトファイル | Git管理 | コミット時 | 無期限 |
| 設定ファイル | Git管理 | 変更時 | 無期限 |

### 6.3 災害復旧設計
- **RTO**: 5分以内（再インストール）
- **RPO**: 最終保存時点
- **復旧手順**: Gitクローン → 環境セットアップ → 設定復元

## 7. 性能設計
### 7.1 性能要件対応
| 性能要件 | 設計対応 | 実装技術 |
|----------|----------|----------|
| 起動時間: 10秒以内 | 軽量フレームワーク使用 | FastMCP + 最小依存関係 |
| 応答時間: 1秒以内 | 非同期処理 | asyncio + aiofiles |
| メモリ使用量: 256MB以下 | 効率的なデータ構造 | Generator + SQLite |

### 7.2 スケーラビリティ設計
- **水平スケーリング**: 対象外（ローカル実行）
- **垂直スケーリング**: マルチコア対応（async処理）
- **負荷分散**: 対象外（単一ユーザ）

## 8. 運用・監視設計
### 8.1 監視アーキテクチャ
| 監視対象 | 監視方式 | 監視ツール | アラート |
|----------|----------|------------|----------|
| プロセス健全性 | プロセス監視 | psutil | ログ出力 |
| メモリ使用量 | リソース監視 | psutil | ログ出力 |
| ディスク使用量 | ファイルシステム監視 | os.statvfs | ログ出力 |

### 8.2 ログ設計
| ログ種別 | 出力先 | 保存期間 | ローテーション |
|----------|--------|----------|----------------|
| アプリケーションログ | ./logs/app.log | 30日 | 日次（10MB） |
| エラーログ | ./logs/error.log | 90日 | 日次（10MB） |
| アクセスログ | ./logs/access.log | 7日 | 日次（10MB） |

## 9. 開発・デプロイメント設計
### 9.1 環境構成
| 環境 | 用途 | 構成 | デプロイ方式 |
|------|------|------|--------------|
| 開発環境 | 機能開発・テスト | Python仮想環境 | Gitクローン |
| ユーザ環境 | 学習・プロトタイピング | Python仮想環境 | pip install |
| サンプル環境 | デモ・検証 | Docker環境 | docker-compose |

### 9.2 CI/CD設計
- **バージョン管理**: Git + GitHub
- **ビルド**: setup.py + requirements.txt
- **テスト自動化**: pytest + GitHub Actions
- **デプロイ自動化**: PyPI + GitHub Releases

## 10. 技術的な設計判断
### 10.1 技術選定理由
| 技術領域 | 選定技術 | 選定理由 | 代替案 |
|----------|----------|----------|--------|
| MCPフレームワーク | FastMCP | SSE/STDIO両対応、シンプル | mcp-python（複雑） |
| データベース | SQLite | 軽量、設定不要、ポータブル | PostgreSQL（重量） |
| Webサーバ | uvicorn | ASGI対応、高性能 | gunicorn（WSGI） |
| テンプレートエンジン | Jinja2 | 豊富な機能、実績 | Mako（学習コスト） |

### 10.2 アーキテクチャ上の課題と対応
| 課題 | 影響 | 対応策 | 備考 |
|------|------|--------|------|
| SSE/STDIO切り替え複雑性 | 開発効率低下 | Transport Layer抽象化 | Factory Pattern適用 |
| 初学者の学習コスト | 採用率低下 | 段階的チュートリアル | Progressive Disclosure |
| デバッグの困難さ | 開発効率低下 | 詳細ログ・デバッグモード | Verbose Option提供 |

## 11. 通信アーキテクチャ詳細
### 11.1 SSE通信設計
```python
# SSE Transport Layer
class SSETransport:
    async def start_server(self, host="127.0.0.1", port=8000):
        # FastAPI + SSE implementation
        
    async def handle_request(self, request):
        # MCP Protocol handling
```

### 11.2 STDIO通信設計
```python
# STDIO Transport Layer  
class STDIOTransport:
    async def start_stdio(self):
        # stdin/stdout communication
        
    async def handle_message(self, message):
        # MCP Protocol handling
```

### 11.3 統合通信インターフェース
```python
# Unified Transport Interface
class MCPTransportFactory:
    @staticmethod
    def create_transport(mode: str):
        if mode == "sse":
            return SSETransport()
        elif mode == "stdio":
            return STDIOTransport()
```

## 12. 承認
| 項目 | 氏名 | 承認日 | 署名 |
|------|------|--------|------|
| 作成者 | mcp starter | 2025-06-23 | |
| 承認者 | - | - | |

## 更新履歴
| バージョン | 更新日 | 更新者 | 更新内容 | 影響ドキュメント |
|---|---|---|---|---|
| 1.0 | 2025-06-23 | mcp starter | FastMCPスターターキット向けシステムアーキテクチャ初版作成 | 02_application_design.md, 03_database_design.md, 04_interface_design.md | 
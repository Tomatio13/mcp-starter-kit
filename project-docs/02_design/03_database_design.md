---
title: "データベース設計書"
version: "1.0"
last_updated: "2025-06-23"
author: "mcp starter"
reviewers: []
related_docs:
  - "01_system_architecture.md"
  - "02_application_design.md"
  - "../01_requirements/03_functional_requirements.md"
  - "../03_development/01_development_standards.md"
  - "../04_operations/02_monitoring_backup.md"
status: "draft"
dependencies:
  upstream:
    - "01_system_architecture.md"
    - "02_application_design.md"
    - "../01_requirements/03_functional_requirements.md"
  downstream:
    - "../03_development/01_development_standards.md"
    - "../04_operations/02_monitoring_backup.md"
---

# データベース設計書

## 1. 概要
FastMCPスターターキットのデータベース設計は、軽量・ポータブルなSQLiteを採用し、学習者の進捗追跡、プロジェクト管理、設定情報の永続化を担います。初学者でも理解しやすいシンプルなスキーマ構造を維持しながら、実用的な機能を提供します。

### 1.1 設計原則
- **軽量性**: SQLiteによる設定不要・ファイルベース
- **シンプル性**: 必要最小限のテーブル構成
- **ポータブル性**: ファイル単体での移植可能性
- **拡張性**: 将来的な機能追加に対応可能な構造

## 2. データベース構成
### 2.1 データベース全体構成
- **データベース種別**: SQLite 3
- **バージョン**: 3.35+
- **文字コード**: UTF-8
- **ファイル名**: `fastmcp_starter.db`
- **配置場所**: `~/.fastmcp_starter/data/`

### 2.2 論理設計
#### 2.2.1 ER図
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Users       │    │   Tutorials     │    │   Tutorial_     │
│                 │    │                 │    │   Steps         │
│ • user_id (PK)  │    │ • tutorial_id   │    │                 │
│ • username      │◄───┤   (PK)          │◄───┤ • step_id (PK)  │
│ • created_at    │    │ • title         │    │ • tutorial_id   │
│ • last_login    │    │ • description   │    │ • step_order    │
│ • preferences   │    │ • difficulty    │    │ • title         │
└─────────────────┘    │ • duration      │    │ • content       │
          │            │ • created_at    │    │ • completed     │
          │            └─────────────────┘    └─────────────────┘
          │                      │                      │
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ User_Progress   │    │   Projects      │    │ Project_Files   │
│                 │    │                 │    │                 │
│ • progress_id   │    │ • project_id    │    │ • file_id (PK)  │
│   (PK)          │    │   (PK)          │    │ • project_id    │
│ • user_id (FK)  │    │ • user_id (FK)  │    │ • file_path     │
│ • tutorial_id   │    │ • name          │    │ • file_type     │
│   (FK)          │    │ • template_type │    │ • created_at    │
│ • step_id (FK)  │    │ • created_at    │    │ • updated_at    │
│ • started_at    │    │ • updated_at    │    │ • updated_at    │
│ • completed_at  │    │ • status        │    └─────────────────┘
│ • score         │    └─────────────────┘
└─────────────────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Settings      │    │     Logs        │    │    Templates    │
│                 │    │                 │    │                 │
│ • setting_id    │    │ • log_id (PK)   │    │ • template_id   │
│   (PK)          │    │ • user_id (FK)  │    │   (PK)          │
│ • user_id (FK)  │    │ • level         │    │ • name          │
│ • key           │    │ • message       │    │ • description   │
│ • value         │    │ • timestamp     │    │ • category      │
│ • updated_at    │    │ • module        │    │ • version       │
└─────────────────┘    └─────────────────┘    │ • files_json    │
                                              │ • created_at    │
                                              └─────────────────┘
```

#### 2.2.2 テーブル一覧
| テーブル名 | 論理名 | 概要 | レコード数(予想) |
|------------|--------|------|------------------|
| users | ユーザー管理 | 学習者の基本情報 | 1-10 |
| tutorials | チュートリアル管理 | 学習コンテンツメタデータ | 20-50 |
| tutorial_steps | チュートリアル詳細 | チュートリアルステップ情報 | 100-500 |
| user_progress | 学習進捗管理 | ユーザーの学習進捗データ | 50-1000 |
| projects | プロジェクト管理 | 作成されたプロジェクト情報 | 5-50 |
| project_files | プロジェクトファイル管理 | プロジェクト内ファイル情報 | 20-500 |
| settings | 設定管理 | ユーザー設定・アプリ設定 | 10-100 |
| logs | ログ管理 | アプリケーションログ | 100-10000 |
| templates | テンプレート管理 | プロジェクトテンプレート情報 | 5-20 |

## 3. テーブル定義
### 3.1 ユーザー管理テーブル（users）
| 項目名 | 物理名 | データ型 | 桁数 | NULL | PK | FK | デフォルト値 | 備考 |
|--------|--------|----------|------|------|----|----|--------------|------|
| ユーザーID | user_id | TEXT | 36 | × | ○ | | UUID | UUIDv4形式 |
| ユーザー名 | username | TEXT | 50 | × | | | | ユニーク制約 |
| 作成日時 | created_at | DATETIME | | × | | | CURRENT_TIMESTAMP | |
| 最終ログイン | last_login | DATETIME | | ○ | | | | |
| 設定情報 | preferences | TEXT | | ○ | | | '{}' | JSON形式 |

### 3.2 チュートリアル管理テーブル（tutorials）
| 項目名 | 物理名 | データ型 | 桁数 | NULL | PK | FK | デフォルト値 | 備考 |
|--------|--------|----------|------|------|----|----|--------------|------|
| チュートリアルID | tutorial_id | TEXT | 36 | × | ○ | | UUID | UUIDv4形式 |
| タイトル | title | TEXT | 200 | × | | | | |
| 説明 | description | TEXT | | ○ | | | | |
| 難易度 | difficulty | TEXT | 20 | × | | | 'beginner' | beginner/intermediate/advanced |
| 所要時間(分) | duration | INTEGER | | × | | | 0 | 分単位 |
| 順序 | sort_order | INTEGER | | × | | | 0 | 表示順序 |
| 作成日時 | created_at | DATETIME | | × | | | CURRENT_TIMESTAMP | |
| 有効フラグ | is_active | BOOLEAN | | × | | | 1 | |

### 3.3 チュートリアル詳細テーブル（tutorial_steps）
| 項目名 | 物理名 | データ型 | 桁数 | NULL | PK | FK | デフォルト値 | 備考 |
|--------|--------|----------|------|------|----|----|--------------|------|
| ステップID | step_id | TEXT | 36 | × | ○ | | UUID | UUIDv4形式 |
| チュートリアルID | tutorial_id | TEXT | 36 | × | | ○ | | tutorials.tutorial_id |
| ステップ順序 | step_order | INTEGER | | × | | | | |
| タイトル | title | TEXT | 200 | × | | | | |
| コンテンツ | content | TEXT | | × | | | | Markdown形式 |
| 完了フラグ | is_completed | BOOLEAN | | × | | | 0 | |
| 作成日時 | created_at | DATETIME | | × | | | CURRENT_TIMESTAMP | |

### 3.4 学習進捗管理テーブル（user_progress）
| 項目名 | 物理名 | データ型 | 桁数 | NULL | PK | FK | デフォルト値 | 備考 |
|--------|--------|----------|------|------|----|----|--------------|------|
| 進捗ID | progress_id | TEXT | 36 | × | ○ | | UUID | UUIDv4形式 |
| ユーザーID | user_id | TEXT | 36 | × | | ○ | | users.user_id |
| チュートリアルID | tutorial_id | TEXT | 36 | × | | ○ | | tutorials.tutorial_id |
| ステップID | step_id | TEXT | 36 | × | | ○ | | tutorial_steps.step_id |
| 開始日時 | started_at | DATETIME | | × | | | CURRENT_TIMESTAMP | |
| 完了日時 | completed_at | DATETIME | | ○ | | | | |
| スコア | score | INTEGER | | ○ | | | | 0-100 |
| メモ | notes | TEXT | | ○ | | | | |

### 3.5 プロジェクト管理テーブル（projects）
| 項目名 | 物理名 | データ型 | 桁数 | NULL | PK | FK | デフォルト値 | 備考 |
|--------|--------|----------|------|------|----|----|--------------|------|
| プロジェクトID | project_id | TEXT | 36 | × | ○ | | UUID | UUIDv4形式 |
| ユーザーID | user_id | TEXT | 36 | × | | ○ | | users.user_id |
| プロジェクト名 | name | TEXT | 100 | × | | | | |
| テンプレート種別 | template_type | TEXT | 50 | ○ | | | | |
| 作成日時 | created_at | DATETIME | | × | | | CURRENT_TIMESTAMP | |
| 更新日時 | updated_at | DATETIME | | × | | | CURRENT_TIMESTAMP | |
| ステータス | status | TEXT | 20 | × | | | 'active' | active/archived/deleted |
| 説明 | description | TEXT | | ○ | | | | |

### 3.6 プロジェクトファイル管理テーブル（project_files）
| 項目名 | 物理名 | データ型 | 桁数 | NULL | PK | FK | デフォルト値 | 備考 |
|--------|--------|----------|------|------|----|----|--------------|------|
| ファイルID | file_id | TEXT | 36 | × | ○ | | UUID | UUIDv4形式 |
| プロジェクトID | project_id | TEXT | 36 | × | | ○ | | projects.project_id |
| ファイルパス | file_path | TEXT | 500 | × | | | | 相対パス |
| ファイル種別 | file_type | TEXT | 50 | × | | | | python/json/yaml/md など |
| コンテンツ | content | TEXT | | ○ | | | | ファイル内容 |
| 作成日時 | created_at | DATETIME | | × | | | CURRENT_TIMESTAMP | |
| 更新日時 | updated_at | DATETIME | | × | | | CURRENT_TIMESTAMP | |

### 3.7 設定管理テーブル（settings）
| 項目名 | 物理名 | データ型 | 桁数 | NULL | PK | FK | デフォルト値 | 備考 |
|--------|--------|----------|------|------|----|----|--------------|------|
| 設定ID | setting_id | TEXT | 36 | × | ○ | | UUID | UUIDv4形式 |
| ユーザーID | user_id | TEXT | 36 | ○ | | ○ | | users.user_id (NULL=グローバル設定) |
| キー | key | TEXT | 100 | × | | | | |
| 値 | value | TEXT | | ○ | | | | |
| 更新日時 | updated_at | DATETIME | | × | | | CURRENT_TIMESTAMP | |

### 3.8 ログ管理テーブル（logs）
| 項目名 | 物理名 | データ型 | 桁数 | NULL | PK | FK | デフォルト値 | 備考 |
|--------|--------|----------|------|------|----|----|--------------|------|
| ログID | log_id | TEXT | 36 | × | ○ | | UUID | UUIDv4形式 |
| ユーザーID | user_id | TEXT | 36 | ○ | | ○ | | users.user_id |
| レベル | level | TEXT | 10 | × | | | 'INFO' | DEBUG/INFO/WARN/ERROR |
| メッセージ | message | TEXT | | × | | | | |
| タイムスタンプ | timestamp | DATETIME | | × | | | CURRENT_TIMESTAMP | |
| モジュール | module | TEXT | 100 | ○ | | | | |

### 3.9 テンプレート管理テーブル（templates）
| 項目名 | 物理名 | データ型 | 桁数 | NULL | PK | FK | デフォルト値 | 備考 |
|--------|--------|----------|------|------|----|----|--------------|------|
| テンプレートID | template_id | TEXT | 36 | × | ○ | | UUID | UUIDv4形式 |
| テンプレート名 | name | TEXT | 100 | × | | | | |
| 説明 | description | TEXT | | ○ | | | | |
| カテゴリ | category | TEXT | 50 | × | | | 'basic' | basic/advanced/specialized |
| バージョン | version | TEXT | 20 | × | | | '1.0.0' | |
| ファイル構成 | files_json | TEXT | | × | | | '[]' | JSON形式 |
| 作成日時 | created_at | DATETIME | | × | | | CURRENT_TIMESTAMP | |

## 4. インデックス設計
| テーブル名 | インデックス名 | 対象カラム | 種別 | 用途 |
|------------|----------------|------------|------|------|
| users | idx_users_username | username | UNIQUE | ログイン高速化 |
| tutorial_steps | idx_steps_tutorial_order | tutorial_id, step_order | INDEX | ステップ順序検索 |
| user_progress | idx_progress_user_tutorial | user_id, tutorial_id | INDEX | 進捗検索 |
| user_progress | idx_progress_completed | completed_at | INDEX | 完了状況検索 |
| projects | idx_projects_user_status | user_id, status | INDEX | プロジェクト一覧 |
| project_files | idx_files_project | project_id | INDEX | プロジェクトファイル検索 |
| settings | idx_settings_user_key | user_id, key | UNIQUE | 設定検索 |
| logs | idx_logs_timestamp | timestamp | INDEX | ログ検索 |
| logs | idx_logs_user_level | user_id, level | INDEX | ユーザーログ検索 |

## 5. データ移行設計
### 5.1 移行対象データ
| 移行元 | 移行先テーブル | データ量 | 移行方法 |
|--------|----------------|----------|----------|
| 初期データ（SQLファイル） | tutorials, tutorial_steps | 50件 | SQLスクリプト実行 |
| 初期データ（SQLファイル） | templates | 10件 | SQLスクリプト実行 |
| 設定ファイル | settings | 20件 | JSON→SQL変換 |

### 5.2 データクレンジング
- **重複チェック**: ユーザー名、プロジェクト名の重複除去
- **データ正規化**: JSON形式データの構造検証
- **文字エンコーディング**: UTF-8統一

## 6. バックアップ・復旧設計
### 6.1 バックアップ設計
| バックアップ種別 | 対象 | 頻度 | 保存期間 |
|-------------------|------|------|----------|
| フルバックアップ | fastmcp_starter.db | 手動 | 無期限 |
| 設定バックアップ | settings テーブル | 設定変更時 | 30日 |
| 進捗バックアップ | user_progress テーブル | チュートリアル完了時 | 90日 |

### 6.2 復旧手順
1. **データベースファイル復旧**: バックアップファイルのコピー
2. **整合性チェック**: SQLite PRAGMA integrity_check実行
3. **インデックス再構築**: REINDEX実行
4. **データ検証**: 主要テーブルのレコード数確認

## 7. パフォーマンス最適化
### 7.1 クエリ最適化
```sql
-- よく使用されるクエリの例

-- ユーザーの学習進捗取得
SELECT t.title, ts.title as step_title, up.completed_at
FROM user_progress up
JOIN tutorial_steps ts ON up.step_id = ts.step_id
JOIN tutorials t ON up.tutorial_id = t.tutorial_id
WHERE up.user_id = ? AND up.completed_at IS NOT NULL
ORDER BY up.completed_at DESC;

-- プロジェクト一覧取得
SELECT p.project_id, p.name, p.template_type, 
       COUNT(pf.file_id) as file_count
FROM projects p
LEFT JOIN project_files pf ON p.project_id = pf.project_id
WHERE p.user_id = ? AND p.status = 'active'
GROUP BY p.project_id
ORDER BY p.updated_at DESC;
```

### 7.2 パフォーマンス監視
```sql
-- テーブルサイズ監視
SELECT name, COUNT(*) as record_count
FROM sqlite_master
WHERE type='table';

-- インデックス使用状況
EXPLAIN QUERY PLAN 
SELECT * FROM user_progress WHERE user_id = ?;
```

## 8. セキュリティ対策
### 8.1 データ保護
- **ファイル権限**: 600 (読み書き権限ユーザーのみ)
- **SQLインジェクション対策**: パラメータ化クエリ必須
- **入力検証**: 全入力値の型・長さチェック

### 8.2 アクセス制御
```python
# データアクセス層でのセキュリティ実装例
class DatabaseAccess:
    def validate_user_access(self, user_id: str, resource_id: str) -> bool:
        """ユーザーのリソースアクセス権限チェック"""
        
    def sanitize_input(self, input_value: str) -> str:
        """入力値サニタイズ"""
        
    def execute_safe_query(self, query: str, params: tuple):
        """安全なクエリ実行"""
```

## 9. 初期データ
### 9.1 基本チュートリアルデータ
```sql
-- 基礎チュートリアル
INSERT INTO tutorials VALUES 
('tutorial-001', 'MCPサーバ基礎', 'MCPサーバの基本概念と作成方法', 'beginner', 15, 1, datetime('now'), 1);

-- チュートリアルステップ
INSERT INTO tutorial_steps VALUES 
('step-001-01', 'tutorial-001', 1, 'MCPとは何か', '# MCPとは...', 0, datetime('now')),
('step-001-02', 'tutorial-001', 2, '最初のツール作成', '# ツール作成...', 0, datetime('now'));
```

### 9.2 基本テンプレートデータ
```sql
-- 基本テンプレート
INSERT INTO templates VALUES 
('template-001', 'Basic MCP Server', '基本的なMCPサーバテンプレート', 'basic', '1.0.0', 
 '[{"path":"server.py","type":"python"},{"path":"requirements.txt","type":"text"}]', 
 datetime('now'));
```

## 10. 承認
| 項目 | 氏名 | 承認日 |
|------|------|--------|
| 作成者 | mcp starter | 2025-06-23 |
| 承認者 | - | - |

## 更新履歴
| バージョン | 更新日 | 更新者 | 更新内容 | 影響ドキュメント |
|---|---|---|---|---|
| 1.0 | 2025-06-23 | mcp starter | FastMCPスターターキット向けデータベース設計初版作成 | 04_interface_design.md | 
# プロジェクトドキュメント ディレクトリ構造

## ディレクトリ構造の凡例
- [DIR] : ディレクトリ
- [MD] : マークダウンファイル

## Overall Structure
```
project-docs/
├── [DIR] 00_project_management/ // プロジェクト管理
│   ├── [MD] 01_project_plan.md              // プロジェクト計画
│   ├── [MD] 02_quality_management.md        // 品質管理
│   └── [MD] 03_risk_management.md           // リスク管理
│
├── [DIR] 01_requirements/          // 要件定義
│   ├── [MD] 01_project_overview.md           // プロジェクト概要
│   ├── [MD] 02_business_requirements.md      // ビジネス要件
│   ├── [MD] 03_functional_requirements.md    // 機能要件
│   ├── [MD] 04_non_functional_requirements.md // 非機能要件
│   └── [MD] 05_constraints.md                // 制約条件
│
├── [DIR] 02_design/               // 設計
│   ├── [MD] 01_system_architecture.md       // システムアーキテクチャ
│   ├── [MD] 02_application_design.md        // アプリケーション設計
│   ├── [MD] 03_database_design.md           // データベース設計
│   └── [MD] 04_interface_design.md          // インターフェース設計
│
├── [DIR] 03_development/         // 開発
│   ├── [MD] 01_development_standards.md     // 開発標準
│   ├── [MD] 02_test_specifications.md       // テスト仕様
│   └── [MD] 03_deployment_guide.md          // デプロイメントガイド
│
└── [DIR] 04_operations/         // 運用
    ├── [MD] 01_operations_manual.md         // 運用マニュアル
    ├── [MD] 02_monitoring_backup.md         // 監視・バックアップ
    └── [MD] 03_migration_plan.md            // 移行計画
```
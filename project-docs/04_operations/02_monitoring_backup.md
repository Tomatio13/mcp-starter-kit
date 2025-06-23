---
title: "監視・バックアップ"
version: "1.0"
last_updated: "2025-06-23"
author: "mcp starter"
reviewers: []
related_docs: ["01_operations_manual.md", "03_migration_plan.md"]
status: "approved"
dependencies:
  upstream: ["01_operations_manual.md", "02_design/03_database_design.md"]
  downstream: ["03_migration_plan.md"]
impact_level: "high"
---

# 監視・バックアップ

## 1. 概要

### 1.1 目的
FastMCPスターターキットの安定運用を実現するため、包括的な監視システムとバックアップ戦略を定義します。初学者の学習データを保護し、システムの可用性を確保します。

### 1.2 監視対象
- FastMCPサーバーの稼働状況
- SSE/STDIO通信状況
- 学習システム・プログレス管理
- SQLiteデータベース
- システムリソース

### 1.3 バックアップ方針
```yaml
バックアップ戦略:
  目標復旧時間(RTO): 30分以内
  目標復旧時点(RPO): 1時間以内
  保持期間: 30日間
  バックアップ頻度: 日次自動実行
  検証頻度: 週次復旧テスト
```

## 2. 監視システム

### 2.1 リアルタイム監視
```python
# realtime_monitor.py
import asyncio
import json
import sqlite3
import psutil
from datetime import datetime, timedelta
from typing import Dict, List

class RealtimeMonitor:
    """リアルタイム監視システム"""
    
    def __init__(self, config):
        self.config = config
        self.alert_thresholds = {
            "cpu_usage": 85.0,
            "memory_usage": 80.0,
            "disk_usage": 90.0,
            "response_time": 3.0,
            "error_rate": 5.0
        }
        self.monitoring_active = False
    
    async def start_monitoring(self):
        """監視開始"""
        self.monitoring_active = True
        
        # 並行監視タスク開始
        tasks = [
            asyncio.create_task(self.monitor_system_resources()),
            asyncio.create_task(self.monitor_mcp_server()),
            asyncio.create_task(self.monitor_learning_system()),
            asyncio.create_task(self.monitor_database()),
            asyncio.create_task(self.alert_processor())
        ]
        
        await asyncio.gather(*tasks)
    
    async def monitor_system_resources(self):
        """システムリソース監視"""
        while self.monitoring_active:
            try:
                metrics = {
                    "timestamp": datetime.now().isoformat(),
                    "cpu_percent": psutil.cpu_percent(interval=1),
                    "memory": {
                        "percent": psutil.virtual_memory().percent,
                        "available": psutil.virtual_memory().available,
                        "used": psutil.virtual_memory().used
                    },
                    "disk": {
                        "percent": psutil.disk_usage('/').percent,
                        "free": psutil.disk_usage('/').free
                    },
                    "network": dict(psutil.net_io_counters()._asdict())
                }
                
                # アラート判定
                await self.check_resource_alerts(metrics)
                
                # メトリクス保存
                await self.save_metrics("system_resources", metrics)
                
            except Exception as e:
                print(f"System monitoring error: {e}")
            
            await asyncio.sleep(30)  # 30秒間隔
    
    async def monitor_mcp_server(self):
        """MCPサーバー監視"""
        while self.monitoring_active:
            try:
                # サーバーヘルスチェック
                health_status = await self.check_server_health()
                
                # 通信統計
                comm_stats = await self.collect_communication_stats()
                
                metrics = {
                    "timestamp": datetime.now().isoformat(),
                    "server_status": health_status,
                    "communication": comm_stats
                }
                
                # アラート判定
                if not health_status["healthy"]:
                    await self.send_alert("server_down", "MCPサーバーが応答しません", "critical")
                
                if comm_stats["error_rate"] > self.alert_thresholds["error_rate"]:
                    await self.send_alert("high_error_rate", 
                                        f"エラー率が高い: {comm_stats['error_rate']:.1f}%", "warning")
                
                await self.save_metrics("mcp_server", metrics)
                
            except Exception as e:
                print(f"MCP server monitoring error: {e}")
            
            await asyncio.sleep(60)  # 1分間隔
    
    async def collect_communication_stats(self) -> Dict:
        """通信統計収集"""
        conn = sqlite3.connect(self.config["database_url"])
        cursor = conn.cursor()
        
        # 過去1時間の統計
        one_hour_ago = datetime.now() - timedelta(hours=1)
        
        cursor.execute("""
            SELECT 
                COUNT(*) as total_requests,
                SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count,
                AVG(response_time) as avg_response_time,
                transport_type
            FROM request_logs 
            WHERE timestamp > ? 
            GROUP BY transport_type
        """, (one_hour_ago,))
        
        results = cursor.fetchall()
        conn.close()
        
        stats = {
            "total_requests": 0,
            "error_count": 0,
            "error_rate": 0.0,
            "avg_response_time": 0.0,
            "sse_requests": 0,
            "stdio_requests": 0
        }
        
        for row in results:
            total, errors, avg_time, transport = row
            stats["total_requests"] += total
            stats["error_count"] += errors
            stats["avg_response_time"] = max(stats["avg_response_time"], avg_time or 0)
            
            if transport == "sse":
                stats["sse_requests"] = total
            elif transport == "stdio":
                stats["stdio_requests"] = total
        
        if stats["total_requests"] > 0:
            stats["error_rate"] = (stats["error_count"] / stats["total_requests"]) * 100
        
        return stats
```

### 2.2 ダッシュボード
```python
# dashboard.py
from flask import Flask, render_template, jsonify
import sqlite3
import json

app = Flask(__name__)

class MonitoringDashboard:
    """監視ダッシュボード"""
    
    def __init__(self, db_path):
        self.db_path = db_path
    
    @app.route('/')
    def dashboard():
        """メインダッシュボード"""
        return render_template('dashboard.html')
    
    @app.route('/api/status')
    def get_system_status():
        """システム状況API"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 最新メトリクス取得
        cursor.execute("""
            SELECT metric_type, data, timestamp 
            FROM monitoring_metrics 
            WHERE timestamp > datetime('now', '-1 hour')
            ORDER BY timestamp DESC
        """)
        
        metrics = {}
        for row in cursor.fetchall():
            metric_type, data, timestamp = row
            if metric_type not in metrics:
                metrics[metric_type] = []
            metrics[metric_type].append({
                "data": json.loads(data),
                "timestamp": timestamp
            })
        
        conn.close()
        return jsonify(metrics)
    
    @app.route('/api/learning-stats')
    def get_learning_statistics():
        """学習統計API"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 学習統計
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT user_id) as active_users,
                COUNT(*) as total_sessions,
                AVG(completion_rate) as avg_completion
            FROM user_progress 
            WHERE last_updated > datetime('now', '-24 hours')
        """)
        
        stats = cursor.fetchone()
        
        # チュートリアル別統計
        cursor.execute("""
            SELECT t.title, COUNT(up.id) as attempts, 
                   AVG(up.completion_rate) as avg_completion
            FROM tutorials t
            LEFT JOIN user_progress up ON t.id = up.tutorial_id
            WHERE up.last_updated > datetime('now', '-7 days')
            GROUP BY t.id, t.title
        """)
        
        tutorial_stats = cursor.fetchall()
        
        conn.close()
        
        return jsonify({
            "active_users": stats[0] or 0,
            "total_sessions": stats[1] or 0,
            "avg_completion": stats[2] or 0,
            "tutorial_stats": tutorial_stats
        })
```

## 3. バックアップシステム

### 3.1 自動バックアップ
```bash
#!/bin/bash
# backup_system.sh - 自動バックアップスクリプト

# 設定
BACKUP_DIR="/backup/fastmcp"
DB_PATH="fastmcp.db"
CONFIG_DIR="config"
LOGS_DIR="logs"
RETENTION_DAYS=30

# バックアップ実行
perform_backup() {
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/$backup_timestamp"
    
    echo "🔄 FastMCP バックアップ開始: $backup_timestamp"
    
    # バックアップディレクトリ作成
    mkdir -p "$backup_path"
    
    # 1. データベースバックアップ
    echo "📊 データベースバックアップ中..."
    sqlite3 "$DB_PATH" ".backup '$backup_path/fastmcp.db'"
    if [ $? -eq 0 ]; then
        echo "✅ データベースバックアップ完了"
    else
        echo "❌ データベースバックアップ失敗"
        exit 1
    fi
    
    # 2. 設定ファイルバックアップ
    echo "⚙️  設定ファイルバックアップ中..."
    tar -czf "$backup_path/config.tar.gz" "$CONFIG_DIR"
    echo "✅ 設定ファイルバックアップ完了"
    
    # 3. ログファイルバックアップ（直近7日分）
    echo "📝 ログファイルバックアップ中..."
    find "$LOGS_DIR" -name "*.log" -mtime -7 | tar -czf "$backup_path/logs.tar.gz" -T -
    echo "✅ ログファイルバックアップ完了"
    
    # 4. バックアップ検証
    echo "🔍 バックアップ検証中..."
    if verify_backup "$backup_path"; then
        echo "✅ バックアップ検証成功"
        
        # バックアップ情報記録
        cat > "$backup_path/backup_info.json" << EOF
{
    "timestamp": "$backup_timestamp",
    "backup_type": "full",
    "database_size": "$(du -h "$backup_path/fastmcp.db" | cut -f1)",
    "config_size": "$(du -h "$backup_path/config.tar.gz" | cut -f1)",
    "logs_size": "$(du -h "$backup_path/logs.tar.gz" | cut -f1)",
    "verification": "passed"
}
EOF
        
    else
        echo "❌ バックアップ検証失敗"
        rm -rf "$backup_path"
        exit 1
    fi
    
    # 5. 古いバックアップクリーンアップ
    cleanup_old_backups
    
    echo "🎉 FastMCP バックアップ完了: $backup_path"
}

# バックアップ検証
verify_backup() {
    local backup_path="$1"
    
    # データベース整合性チェック
    sqlite3 "$backup_path/fastmcp.db" "PRAGMA integrity_check;" | grep -q "ok"
    if [ $? -ne 0 ]; then
        echo "❌ データベース整合性チェック失敗"
        return 1
    fi
    
    # 必須テーブル存在確認
    local required_tables="users tutorials user_progress"
    for table in $required_tables; do
        count=$(sqlite3 "$backup_path/fastmcp.db" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='$table'")
        if [ "$count" -eq 0 ]; then
            echo "❌ 必須テーブル '$table' が見つかりません"
            return 1
        fi
    done
    
    # ファイル存在確認
    if [ ! -f "$backup_path/config.tar.gz" ] || [ ! -f "$backup_path/logs.tar.gz" ]; then
        echo "❌ バックアップファイルが不完全です"
        return 1
    fi
    
    return 0
}

# 古いバックアップクリーンアップ
cleanup_old_backups() {
    echo "🧹 古いバックアップクリーンアップ中..."
    find "$BACKUP_DIR" -type d -name "20*" -mtime +$RETENTION_DAYS -exec rm -rf {} \;
    echo "✅ クリーンアップ完了"
}

# 増分バックアップ
incremental_backup() {
    local last_backup=$(find "$BACKUP_DIR" -type d -name "20*" | sort | tail -1)
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)_incremental
    local backup_path="$BACKUP_DIR/$backup_timestamp"
    
    echo "🔄 増分バックアップ開始: $backup_timestamp"
    
    mkdir -p "$backup_path"
    
    # 変更されたファイルのみバックアップ
    if [ -n "$last_backup" ]; then
        find . -newer "$last_backup/backup_info.json" -type f \
            -path "./fastmcp.db*" -o -path "./config/*" -o -path "./logs/*" \
            | tar -czf "$backup_path/incremental.tar.gz" -T -
    else
        echo "⚠️  フルバックアップが見つからないため、フルバックアップを実行します"
        perform_backup
        return
    fi
    
    echo "✅ 増分バックアップ完了: $backup_path"
}
```

### 3.2 復旧手順
```bash
#!/bin/bash
# restore_system.sh - システム復旧スクリプト

# 復旧実行
restore_from_backup() {
    local backup_path="$1"
    local restore_type="${2:-full}"  # full or selective
    
    echo "🔄 FastMCP システム復旧開始"
    echo "バックアップパス: $backup_path"
    echo "復旧タイプ: $restore_type"
    
    # バックアップ検証
    if [ ! -d "$backup_path" ]; then
        echo "❌ バックアップディレクトリが見つかりません: $backup_path"
        exit 1
    fi
    
    # 現在のシステム停止
    echo "🛑 システム停止中..."
    stop_fastmcp_server
    
    # 現在のデータ退避
    local emergency_backup="emergency_backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$emergency_backup"
    cp fastmcp.db "$emergency_backup/" 2>/dev/null || true
    cp -r config "$emergency_backup/" 2>/dev/null || true
    
    # 復旧実行
    case $restore_type in
        "full")
            restore_full_system "$backup_path"
            ;;
        "database")
            restore_database_only "$backup_path"
            ;;
        "config")
            restore_config_only "$backup_path"
            ;;
        *)
            echo "❌ 不正な復旧タイプ: $restore_type"
            exit 1
            ;;
    esac
    
    # システム再起動
    echo "🚀 システム再起動中..."
    start_fastmcp_server
    
    # 復旧検証
    echo "🔍 復旧検証中..."
    if verify_system_health; then
        echo "✅ システム復旧完了"
        
        # 緊急バックアップ削除
        rm -rf "$emergency_backup"
    else
        echo "❌ システム復旧検証失敗 - 緊急バックアップから復旧中..."
        restore_emergency_backup "$emergency_backup"
    fi
}

# フル復旧
restore_full_system() {
    local backup_path="$1"
    
    echo "📊 データベース復旧中..."
    cp "$backup_path/fastmcp.db" "fastmcp.db"
    
    echo "⚙️  設定ファイル復旧中..."
    tar -xzf "$backup_path/config.tar.gz" -C .
    
    echo "📝 ログファイル復旧中..."
    tar -xzf "$backup_path/logs.tar.gz" -C .
    
    echo "✅ フル復旧完了"
}

# データベースのみ復旧
restore_database_only() {
    local backup_path="$1"
    
    echo "📊 データベースのみ復旧中..."
    
    # 現在のDBバックアップ
    cp fastmcp.db "fastmcp.db.before_restore" 2>/dev/null || true
    
    # バックアップから復旧
    cp "$backup_path/fastmcp.db" "fastmcp.db"
    
    # 整合性チェック
    sqlite3 fastmcp.db "PRAGMA integrity_check;" | grep -q "ok"
    if [ $? -ne 0 ]; then
        echo "❌ 復旧したデータベースに問題があります"
        cp "fastmcp.db.before_restore" "fastmcp.db" 2>/dev/null || true
        exit 1
    fi
    
    echo "✅ データベース復旧完了"
}

# 学習データ復旧
restore_learning_data() {
    local backup_db="$1"
    local target_db="${2:-fastmcp.db}"
    
    echo "🎓 学習データ復旧中..."
    
    # 学習関連テーブルのみ復旧
    sqlite3 "$backup_db" ".dump users" | sqlite3 "$target_db"
    sqlite3 "$backup_db" ".dump user_progress" | sqlite3 "$target_db"
    sqlite3 "$backup_db" ".dump tutorials" | sqlite3 "$target_db"
    sqlite3 "$backup_db" ".dump tutorial_steps" | sqlite3 "$target_db"
    
    echo "✅ 学習データ復旧完了"
}
```

## 4. アラートシステム

### 4.1 アラート定義
```python
# alert_system.py
import asyncio
import smtplib
from email.mime.text import MimeText
from enum import Enum
from dataclasses import dataclass
from typing import List

class AlertLevel(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

@dataclass
class Alert:
    level: AlertLevel
    title: str
    message: str
    timestamp: datetime
    component: str
    resolved: bool = False

class AlertManager:
    """アラート管理システム"""
    
    def __init__(self, config):
        self.config = config
        self.active_alerts: List[Alert] = []
        self.alert_handlers = {
            AlertLevel.INFO: self.handle_info_alert,
            AlertLevel.WARNING: self.handle_warning_alert,
            AlertLevel.CRITICAL: self.handle_critical_alert
        }
    
    async def send_alert(self, level: AlertLevel, title: str, message: str, component: str):
        """アラート送信"""
        alert = Alert(
            level=level,
            title=title,
            message=message,
            timestamp=datetime.now(),
            component=component
        )
        
        # アラート記録
        self.active_alerts.append(alert)
        
        # レベル別処理
        handler = self.alert_handlers[level]
        await handler(alert)
        
        # ログ記録
        self.log_alert(alert)
    
    async def handle_critical_alert(self, alert: Alert):
        """緊急アラート処理"""
        # 即座に通知
        await self.send_email_notification(alert)
        await self.send_slack_notification(alert)
        
        # 自動対応可能な場合は実行
        if alert.component == "server_down":
            await self.auto_restart_server()
        elif alert.component == "disk_full":
            await self.auto_cleanup_logs()
    
    async def auto_restart_server(self):
        """サーバー自動再起動"""
        try:
            # 3回まで再起動試行
            for attempt in range(3):
                await asyncio.sleep(10)  # 10秒待機
                
                # サーバー起動
                process = await asyncio.create_subprocess_exec(
                    "python", "src/main.py",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                # 起動確認
                await asyncio.sleep(30)
                if await self.check_server_health():
                    await self.send_alert(AlertLevel.INFO, 
                                        "自動復旧成功", 
                                        f"サーバーが正常に起動しました (試行回数: {attempt + 1})",
                                        "auto_recovery")
                    return
            
            # 自動復旧失敗
            await self.send_alert(AlertLevel.CRITICAL,
                                "自動復旧失敗",
                                "サーバーの自動復旧に失敗しました。手動対応が必要です。",
                                "auto_recovery")
        
        except Exception as e:
            await self.send_alert(AlertLevel.CRITICAL,
                                "自動復旧エラー",
                                f"自動復旧処理中にエラーが発生: {str(e)}",
                                "auto_recovery")
```

## 5. 更新履歴

| バージョン | 更新日 | 更新者 | 更新内容 | 影響ドキュメント |
|---|-----|-----|----|----|
| 1.0 | 2025-06-23 | mcp starter | 初版作成（FastMCP対応監視・バックアップシステムの構築） | 01_operations_manual.md, 03_migration_plan.md | 
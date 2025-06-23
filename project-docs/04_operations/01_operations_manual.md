---
title: "運用マニュアル"
version: "1.0"
last_updated: "2025-06-23"
author: "mcp starter"
reviewers: []
related_docs: ["02_monitoring_backup.md", "03_migration_plan.md", "03_deployment_guide.md"]
status: "approved"
dependencies:
  upstream: ["03_development/03_deployment_guide.md", "02_design/01_system_architecture.md"]
  downstream: ["02_monitoring_backup.md", "03_migration_plan.md"]
impact_level: "high"
---

# 運用マニュアル

## 1. 概要

### 1.1 目的
本ドキュメントは、FastMCPスターターキットプロジェクトの日常運用における手順と指針を定義します。初学者がMCPサーバを安定して運用し、学習環境を継続的に提供できるよう支援します。

### 1.2 運用対象
- FastMCPフレームワークベースのMCPサーバ
- SSE/STDIO両方の通信方式
- 学習システム・チュートリアル・プログレス管理
- 初学者向け運用支援機能

### 1.3 運用原則
```yaml
運用基本方針:
  可用性: 99%以上の稼働率維持
  応答性: 2秒以内のレスポンス時間
  学習継続性: 学習データの保護・継続性確保
  初学者配慮: 分かりやすい運用手順・エラー対応
  自動化: 手動作業の最小化
```

## 2. 日常運用手順

### 2.1 サーバー起動・停止
```bash
# 基本起動手順
start_server() {
    echo "🚀 FastMCP Server 起動中..."
    
    # 1. 環境確認
    check_environment
    
    # 2. 設定ファイル検証
    validate_config
    
    # 3. データベース接続確認
    check_database
    
    # 4. サーバー起動
    if [ "$TRANSPORT_MODE" = "sse" ]; then
        python src/main.py --transport sse --port 8000 &
    else
        python src/main.py --transport stdio &
    fi
    
    SERVER_PID=$!
    echo "✅ Server started (PID: $SERVER_PID)"
    
    # 5. ヘルスチェック
    sleep 5
    health_check
}

# 安全な停止手順
stop_server() {
    echo "🛑 FastMCP Server 停止中..."
    
    # 1. アクティブセッション確認
    active_sessions=$(get_active_sessions)
    if [ "$active_sessions" -gt 0 ]; then
        echo "⚠️  アクティブセッション数: $active_sessions"
        echo "⏰ 30秒後に強制停止します"
        sleep 30
    fi
    
    # 2. グレースフルシャットダウン
    kill -TERM $SERVER_PID
    wait $SERVER_PID
    
    echo "✅ Server stopped safely"
}

# 再起動手順
restart_server() {
    echo "🔄 FastMCP Server 再起動中..."
    stop_server
    sleep 3
    start_server
}
```

### 2.2 ヘルスチェック
```python
# health_monitor.py - 定期ヘルスチェック
import asyncio
import aiohttp
import sqlite3
from datetime import datetime

class HealthMonitor:
    """FastMCPサーバーのヘルスモニタリング"""
    
    def __init__(self, config):
        self.config = config
        self.checks = {
            "server_response": self.check_server_response,
            "database_connection": self.check_database,
            "memory_usage": self.check_memory,
            "learning_system": self.check_learning_system
        }
    
    async def run_health_checks(self) -> dict:
        """全ヘルスチェックの実行"""
        results = {"timestamp": datetime.now().isoformat(), "status": "healthy"}
        
        for check_name, check_func in self.checks.items():
            try:
                check_result = await check_func()
                results[check_name] = {
                    "status": "pass" if check_result["healthy"] else "fail",
                    "response_time": check_result.get("response_time", 0),
                    "details": check_result.get("details", "")
                }
                
                if not check_result["healthy"]:
                    results["status"] = "unhealthy"
                    
            except Exception as e:
                results[check_name] = {
                    "status": "error",
                    "error": str(e)
                }
                results["status"] = "unhealthy"
        
        # 結果をログに記録
        self.log_health_status(results)
        return results
    
    async def check_server_response(self) -> dict:
        """サーバーレスポンスチェック"""
        start_time = asyncio.get_event_loop().time()
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"http://{self.config['host']}:{self.config['port']}/health",
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    response_time = asyncio.get_event_loop().time() - start_time
                    
                    return {
                        "healthy": response.status == 200,
                        "response_time": response_time,
                        "details": f"HTTP {response.status}"
                    }
        except Exception as e:
            return {
                "healthy": False,
                "response_time": 0,
                "details": f"Connection failed: {str(e)}"
            }
    
    async def check_database(self) -> dict:
        """データベース接続チェック"""
        try:
            conn = sqlite3.connect(self.config["database_url"])
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
            conn.close()
            
            return {
                "healthy": True,
                "details": f"Users: {user_count}"
            }
        except Exception as e:
            return {
                "healthy": False,
                "details": f"Database error: {str(e)}"
            }
    
    async def check_learning_system(self) -> dict:
        """学習システムのチェック"""
        try:
            # チュートリアル数の確認
            conn = sqlite3.connect(self.config["database_url"])
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM tutorials")
            tutorial_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM user_progress WHERE status = 'in_progress'")
            active_learners = cursor.fetchone()[0]
            conn.close()
            
            return {
                "healthy": tutorial_count > 0,
                "details": f"Tutorials: {tutorial_count}, Active learners: {active_learners}"
            }
        except Exception as e:
            return {
                "healthy": False,
                "details": f"Learning system error: {str(e)}"
            }
```

### 2.3 ログ管理
```bash
# log_management.sh - ログ管理スクリプト

# ログローテーション
rotate_logs() {
    log_dir="logs"
    max_size="100M"
    max_files=7
    
    for log_file in "$log_dir"/*.log; do
        if [ -f "$log_file" ]; then
            file_size=$(du -m "$log_file" | cut -f1)
            if [ "$file_size" -gt 100 ]; then
                echo "📦 Rotating $log_file (${file_size}MB)"
                
                # 古いログファイルをシフト
                for i in $(seq $((max_files-1)) -1 1); do
                    if [ -f "${log_file}.$i" ]; then
                        mv "${log_file}.$i" "${log_file}.$((i+1))"
                    fi
                done
                
                # 現在のログをバックアップ
                mv "$log_file" "${log_file}.1"
                touch "$log_file"
            fi
        fi
    done
}

# ログ解析
analyze_logs() {
    log_file="logs/fastmcp.log"
    echo "📊 ログ解析結果 (過去24時間)"
    echo "================================"
    
    # エラー集計
    error_count=$(grep -c "ERROR" "$log_file")
    warning_count=$(grep -c "WARNING" "$log_file")
    
    echo "❌ エラー数: $error_count"
    echo "⚠️  警告数: $warning_count"
    
    # 頻出エラーTop5
    echo ""
    echo "🔍 頻出エラー Top5:"
    grep "ERROR" "$log_file" | cut -d']' -f3- | sort | uniq -c | sort -nr | head -5
    
    # アクセス統計
    echo ""
    echo "📈 アクセス統計:"
    echo "- ツール呼び出し: $(grep -c "tool_call" "$log_file")"
    echo "- リソースアクセス: $(grep -c "resource_access" "$log_file")"
    echo "- 新規学習者: $(grep -c "new_learner" "$log_file")"
}
```

## 3. パフォーマンス管理

### 3.1 パフォーマンス監視
```python
# performance_monitor.py
import psutil
import time
from dataclasses import dataclass
from typing import Dict, List

@dataclass
class PerformanceMetrics:
    """パフォーマンス指標"""
    timestamp: float
    cpu_percent: float
    memory_percent: float
    disk_usage: float
    response_time: float
    active_connections: int
    
class PerformanceMonitor:
    """パフォーマンス監視システム"""
    
    def __init__(self):
        self.metrics_history: List[PerformanceMetrics] = []
        self.thresholds = {
            "cpu_percent": 80.0,
            "memory_percent": 75.0,
            "response_time": 2.0,
            "disk_usage": 85.0
        }
    
    def collect_metrics(self) -> PerformanceMetrics:
        """現在のパフォーマンス指標を収集"""
        return PerformanceMetrics(
            timestamp=time.time(),
            cpu_percent=psutil.cpu_percent(interval=1),
            memory_percent=psutil.virtual_memory().percent,
            disk_usage=psutil.disk_usage('/').percent,
            response_time=self.measure_response_time(),
            active_connections=self.count_active_connections()
        )
    
    def analyze_performance(self, hours: int = 24) -> Dict:
        """パフォーマンス分析レポート生成"""
        cutoff_time = time.time() - (hours * 3600)
        recent_metrics = [m for m in self.metrics_history if m.timestamp > cutoff_time]
        
        if not recent_metrics:
            return {"error": "No recent metrics available"}
        
        analysis = {
            "period": f"Past {hours} hours",
            "total_samples": len(recent_metrics),
            "averages": {
                "cpu_percent": sum(m.cpu_percent for m in recent_metrics) / len(recent_metrics),
                "memory_percent": sum(m.memory_percent for m in recent_metrics) / len(recent_metrics),
                "response_time": sum(m.response_time for m in recent_metrics) / len(recent_metrics)
            },
            "peaks": {
                "max_cpu": max(m.cpu_percent for m in recent_metrics),
                "max_memory": max(m.memory_percent for m in recent_metrics),
                "max_response_time": max(m.response_time for m in recent_metrics)
            },
            "alerts": self.generate_alerts(recent_metrics)
        }
        
        return analysis
    
    def generate_alerts(self, metrics: List[PerformanceMetrics]) -> List[str]:
        """アラート生成"""
        alerts = []
        
        # CPU使用率アラート
        high_cpu_samples = [m for m in metrics if m.cpu_percent > self.thresholds["cpu_percent"]]
        if len(high_cpu_samples) > len(metrics) * 0.1:  # 10%以上のサンプルで閾値超過
            alerts.append(f"🚨 CPU使用率が高い状態が継続 (平均: {sum(m.cpu_percent for m in high_cpu_samples)/len(high_cpu_samples):.1f}%)")
        
        # メモリ使用率アラート
        high_mem_samples = [m for m in metrics if m.memory_percent > self.thresholds["memory_percent"]]
        if len(high_mem_samples) > len(metrics) * 0.1:
            alerts.append(f"🚨 メモリ使用率が高い状態が継続 (平均: {sum(m.memory_percent for m in high_mem_samples)/len(high_mem_samples):.1f}%)")
        
        # レスポンス時間アラート
        slow_responses = [m for m in metrics if m.response_time > self.thresholds["response_time"]]
        if len(slow_responses) > len(metrics) * 0.05:  # 5%以上のサンプルで閾値超過
            alerts.append(f"🚨 レスポンス時間が遅い (平均: {sum(m.response_time for m in slow_responses)/len(slow_responses):.2f}秒)")
        
        return alerts
```

### 3.2 最適化施策
```python
# optimization.py
class SystemOptimizer:
    """システム最適化"""
    
    def __init__(self):
        self.optimization_rules = {
            "database": self.optimize_database,
            "memory": self.optimize_memory,
            "cache": self.optimize_cache,
            "connections": self.optimize_connections
        }
    
    async def auto_optimize(self) -> Dict[str, str]:
        """自動最適化の実行"""
        results = {}
        
        for category, optimizer in self.optimization_rules.items():
            try:
                result = await optimizer()
                results[category] = result
            except Exception as e:
                results[category] = f"Optimization failed: {str(e)}"
        
        return results
    
    async def optimize_database(self) -> str:
        """データベース最適化"""
        # SQLiteの最適化
        conn = sqlite3.connect("fastmcp.db")
        cursor = conn.cursor()
        
        # VACUUM（領域の再編成）
        cursor.execute("VACUUM")
        
        # インデックスの再構築
        cursor.execute("REINDEX")
        
        # 統計情報の更新
        cursor.execute("ANALYZE")
        
        conn.close()
        return "Database optimized: VACUUM, REINDEX, ANALYZE completed"
    
    async def optimize_memory(self) -> str:
        """メモリ最適化"""
        import gc
        
        # ガベージコレクション実行
        before = len(gc.get_objects())
        collected = gc.collect()
        after = len(gc.get_objects())
        
        return f"Memory optimized: {collected} objects collected, {before-after} objects freed"
    
    async def optimize_cache(self) -> str:
        """キャッシュ最適化"""
        # 古いキャッシュエントリの削除
        cache_manager = CacheManager()
        removed = await cache_manager.cleanup_expired()
        
        return f"Cache optimized: {removed} expired entries removed"
```

## 4. トラブルシューティング

### 4.1 一般的な問題と解決策
```yaml
問題カテゴリ別対応手順:

接続エラー:
  症状: クライアントが接続できない
  確認項目:
    - サーバープロセスの稼働状況
    - ポートの利用状況 (netstat -tulpn | grep 8000)
    - ファイアウォール設定
    - ネットワーク接続
  解決手順:
    1. サーバー再起動
    2. ポート変更テスト
    3. ログ確認・エラー原因特定

パフォーマンス低下:
  症状: レスポンスが遅い
  確認項目:
    - CPU・メモリ使用率
    - データベースサイズ・クエリ性能
    - 同時接続数
    - ディスク容量
  解決手順:
    1. リソース使用状況確認
    2. データベース最適化実行
    3. キャッシュクリア
    4. 不要プロセス終了

学習データ不整合:
  症状: 学習進捗が正しく表示されない
  確認項目:
    - データベース整合性
    - 学習セッションの状態
    - ユーザー認証状況
  解決手順:
    1. データベース整合性チェック
    2. 学習進捗の再計算
    3. セッション情報リセット
```

### 4.2 緊急時対応手順
```bash
# emergency_response.sh - 緊急時対応スクリプト

# 緊急停止手順
emergency_stop() {
    echo "🚨 緊急停止手順開始"
    
    # 1. 新規接続の停止
    iptables -A INPUT -p tcp --dport 8000 -j DROP
    
    # 2. アクティブセッションの待避
    backup_active_sessions
    
    # 3. サーバープロセス強制終了
    pkill -9 -f "fastmcp"
    
    # 4. データベースの緊急バックアップ
    cp fastmcp.db "emergency_backup_$(date +%Y%m%d_%H%M%S).db"
    
    echo "✅ 緊急停止完了"
}

# 障害診断
diagnose_system() {
    echo "🔍 システム診断開始"
    
    # プロセス状況
    echo "=== プロセス状況 ==="
    ps aux | grep fastmcp
    
    # リソース使用状況
    echo "=== リソース使用状況 ==="
    top -bn1 | grep -E "(Cpu|Mem|fastmcp)"
    
    # ネットワーク状況
    echo "=== ネットワーク状況 ==="
    netstat -tulpn | grep 8000
    
    # ディスク状況
    echo "=== ディスク状況 ==="
    df -h
    
    # 最近のエラーログ
    echo "=== 最近のエラーログ ==="
    tail -n 20 logs/error.log
}

# 最小限復旧
minimal_recovery() {
    echo "🛠️  最小限復旧開始"
    
    # 1. データベース整合性チェック
    sqlite3 fastmcp.db "PRAGMA integrity_check;"
    
    # 2. 設定ファイル確認
    python scripts/validate_config.py
    
    # 3. 最小構成での起動
    python src/main.py --minimal --debug &
    
    # 4. ヘルスチェック
    sleep 10
    curl -f http://localhost:8000/health || echo "復旧失敗"
}
```

## 5. 初学者向け運用支援

### 5.1 学習環境メンテナンス
```python
# learning_maintenance.py
class LearningEnvironmentMaintainer:
    """学習環境メンテナンス"""
    
    async def daily_maintenance(self):
        """日次メンテナンス"""
        maintenance_tasks = [
            self.clean_expired_sessions,
            self.update_tutorial_statistics,
            self.backup_learning_progress,
            self.optimize_learning_database,
            self.generate_learning_report
        ]
        
        results = {}
        for task in maintenance_tasks:
            try:
                result = await task()
                results[task.__name__] = {"status": "success", "result": result}
            except Exception as e:
                results[task.__name__] = {"status": "error", "error": str(e)}
        
        return results
    
    async def clean_expired_sessions(self):
        """期限切れセッションのクリーンアップ"""
        conn = sqlite3.connect("fastmcp.db")
        cursor = conn.cursor()
        
        # 24時間以上非アクティブなセッションを削除
        cursor.execute("""
            DELETE FROM user_sessions 
            WHERE last_activity < datetime('now', '-24 hours')
        """)
        
        cleaned_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        return f"Cleaned {cleaned_count} expired sessions"
    
    async def update_tutorial_statistics(self):
        """チュートリアル統計の更新"""
        conn = sqlite3.connect("fastmcp.db")
        cursor = conn.cursor()
        
        # 完了率統計の更新
        cursor.execute("""
            UPDATE tutorials SET 
                completion_rate = (
                    SELECT CAST(COUNT(*) AS FLOAT) / 
                           (SELECT COUNT(*) FROM users) * 100
                    FROM user_progress 
                    WHERE tutorial_id = tutorials.id AND status = 'completed'
                ),
                average_time = (
                    SELECT AVG(completion_time)
                    FROM user_progress 
                    WHERE tutorial_id = tutorials.id AND status = 'completed'
                )
        """)
        
        conn.commit()
        conn.close()
        
        return "Tutorial statistics updated"
    
    async def generate_learning_report(self):
        """学習レポート生成"""
        conn = sqlite3.connect("fastmcp.db")
        cursor = conn.cursor()
        
        # 基本統計
        cursor.execute("SELECT COUNT(*) FROM users")
        total_users = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM user_progress WHERE status = 'completed'")
        completed_tutorials = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM user_progress WHERE status = 'in_progress'")
        active_learners = cursor.fetchone()[0]
        
        report = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "total_users": total_users,
            "completed_tutorials": completed_tutorials,
            "active_learners": active_learners,
            "completion_rate": completed_tutorials / max(total_users, 1) * 100
        }
        
        # レポートファイル保存
        with open(f"reports/learning_report_{report['date']}.json", "w") as f:
            json.dump(report, f, indent=2)
        
        conn.close()
        return f"Learning report generated: {report}"
```

### 5.2 運用自動化
```bash
# automation.sh - 運用自動化スクリプト

# 定期実行設定 (cron)
setup_automation() {
    echo "⚙️  運用自動化設定"
    
    # crontabエントリ作成
    cat > fastmcp_cron << EOF
# FastMCP Starter 運用自動化
# 毎時ヘルスチェック
0 * * * * /path/to/fastmcp/scripts/health_check.sh

# 日次メンテナンス (AM 2:00)
0 2 * * * /path/to/fastmcp/scripts/daily_maintenance.sh

# 週次レポート (日曜日 AM 3:00)
0 3 * * 0 /path/to/fastmcp/scripts/weekly_report.sh

# ログローテーション (日次 AM 1:00)
0 1 * * * /path/to/fastmcp/scripts/rotate_logs.sh
EOF

    # crontabに登録
    crontab fastmcp_cron
    echo "✅ 自動化スケジュール設定完了"
}

# 週次レポート生成
weekly_report() {
    echo "📊 週次レポート生成中..."
    
    report_date=$(date +%Y-%m-%d)
    report_file="reports/weekly_report_$report_date.md"
    
    cat > "$report_file" << EOF
# FastMCP Starter 週次レポート - $report_date

## サーバー稼働状況
- 稼働時間: $(uptime -p)
- CPU平均使用率: $(get_avg_cpu_usage)%
- メモリ平均使用率: $(get_avg_memory_usage)%

## 学習活動統計
$(python scripts/generate_learning_stats.py)

## エラー・警告サマリー
$(analyze_error_logs)

## 推奨アクション
$(generate_recommendations)
EOF

    echo "✅ 週次レポート生成完了: $report_file"
}
```

## 6. 更新履歴

| バージョン | 更新日 | 更新者 | 更新内容 | 影響ドキュメント |
|---|-----|-----|----|----|
| 1.0 | 2025-06-23 | mcp starter | 初版作成（FastMCP対応運用マニュアルの策定） | 02_monitoring_backup.md, 03_migration_plan.md | 
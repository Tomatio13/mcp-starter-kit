/**
 * タスク管理MCPサーバーのテストクライアント - TypeScript版
 */
import { spawn } from 'child_process';
import readline from 'readline';

interface MCPRequest {
  id: number;
  method: string;
  params?: any;
}

interface MCPResponse {
  id?: number;
  result?: any;
  error?: any;
}

class TaskManagerTestClient {
  private process: any;
  private requestId = 1;
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('📋 タスク管理MCPサーバーテストクライアント - TypeScript版');
    console.log('======================================================');
    
    // MCPサーバーを起動
    this.process = spawn('npm', ['run', 'dev'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.process.stdout.on('data', (data: Buffer) => {
      try {
        const response: MCPResponse = JSON.parse(data.toString());
        console.log('📦 応答:', JSON.stringify(response, null, 2));
      } catch (error) {
        console.log('📄 出力:', data.toString());
      }
    });

    this.process.stderr.on('data', (data: Buffer) => {
      console.error('❌ エラー:', data.toString());
    });

    this.process.on('close', (code: number) => {
      console.log(`🏁 サーバープロセス終了 (コード: ${code})`);
    });

    // 初期化
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: {
          listChanged: true
        },
        sampling: {}
      },
      clientInfo: {
        name: 'task-manager-test-client-ts',
        version: '1.0.0'
      }
    });

    await this.sendRequest('initialized', {});

    // インタラクティブモード開始
    this.startInteractiveMode();
  }

  private async sendRequest(method: string, params?: any): Promise<void> {
    const request: MCPRequest = {
      id: this.requestId++,
      method: method,
      params: params
    };

    console.log('📤 送信:', JSON.stringify(request, null, 2));
    this.process.stdin.write(JSON.stringify(request) + '\n');
  }

  private startInteractiveMode() {
    console.log('\n📋 利用可能なコマンド:');
    console.log('1. tools/list - ツール一覧を取得');
    console.log('2. create <タイトル> [説明] [優先度] - タスク作成');
    console.log('3. list [ステータス] [件数] - タスク一覧');
    console.log('4. update <ID> <ステータス> - タスクステータス更新');
    console.log('5. delete <ID> - タスク削除');
    console.log('6. search <キーワード> - タスク検索');
    console.log('7. stats - 統計情報');
    console.log('8. category-create <名前> [色] - カテゴリ作成');
    console.log('9. categories - カテゴリ一覧');
    console.log('10. assign <タスクID> <カテゴリID> - カテゴリ割り当て');
    console.log('11. backup [パス] - データベースバックアップ');
    console.log('12. export [パス] - JSONエクスポート');
    console.log('13. info - サーバー情報');
    console.log('14. quit - 終了');
    console.log('');

    this.rl.prompt();
    this.rl.on('line', async (input: string) => {
      const args = input.trim().split(' ');
      const command = args[0];

      try {
        switch (command) {
          case '1':
          case 'tools/list':
            await this.sendRequest('tools/list', {});
            break;
            
          case '2':
          case 'create':
            if (args.length < 2) {
              console.log('❌ 使用法: create <タイトル> [説明] [優先度(1-5)]');
            } else {
              const title = args[1];
              const description = args[2] || '';
              const priority = args[3] ? parseInt(args[3]) : 1;
              await this.sendRequest('tools/call', {
                name: 'create_task',
                arguments: { title, description, priority }
              });
            }
            break;
            
          case '3':
          case 'list':
            const status = args[1] || 'all';
            const limit = args[2] ? parseInt(args[2]) : 10;
            await this.sendRequest('tools/call', {
              name: 'get_tasks',
              arguments: { status, limit }
            });
            break;
            
          case '4':
          case 'update':
            if (args.length < 3) {
              console.log('❌ 使用法: update <ID> <ステータス(pending/completed/cancelled)>');
            } else {
              const taskId = parseInt(args[1]);
              const newStatus = args[2];
              if (isNaN(taskId)) {
                console.log('❌ 有効なタスクIDを入力してください');
              } else {
                await this.sendRequest('tools/call', {
                  name: 'update_task_status',
                  arguments: { task_id: taskId, status: newStatus }
                });
              }
            }
            break;
            
          case '5':
          case 'delete':
            if (args.length < 2) {
              console.log('❌ 使用法: delete <ID>');
            } else {
              const taskId = parseInt(args[1]);
              if (isNaN(taskId)) {
                console.log('❌ 有効なタスクIDを入力してください');
              } else {
                await this.sendRequest('tools/call', {
                  name: 'delete_task',
                  arguments: { task_id: taskId }
                });
              }
            }
            break;
            
          case '6':
          case 'search':
            if (args.length < 2) {
              console.log('❌ 使用法: search <キーワード>');
            } else {
              const keyword = args.slice(1).join(' ');
              await this.sendRequest('tools/call', {
                name: 'search_tasks',
                arguments: { keyword }
              });
            }
            break;
            
          case '7':
          case 'stats':
            await this.sendRequest('tools/call', {
              name: 'get_task_statistics',
              arguments: {}
            });
            break;
            
          case '8':
          case 'category-create':
            if (args.length < 2) {
              console.log('❌ 使用法: category-create <名前> [色(#RRGGBB)]');
            } else {
              const name = args[1];
              const color = args[2] || '#007bff';
              await this.sendRequest('tools/call', {
                name: 'create_category',
                arguments: { name, color }
              });
            }
            break;
            
          case '9':
          case 'categories':
            await this.sendRequest('tools/call', {
              name: 'get_categories',
              arguments: {}
            });
            break;
            
          case '10':
          case 'assign':
            if (args.length < 3) {
              console.log('❌ 使用法: assign <タスクID> <カテゴリID>');
            } else {
              const taskId = parseInt(args[1]);
              const categoryId = parseInt(args[2]);
              if (isNaN(taskId) || isNaN(categoryId)) {
                console.log('❌ 有効なIDを入力してください');
              } else {
                await this.sendRequest('tools/call', {
                  name: 'assign_category_to_task',
                  arguments: { task_id: taskId, category_id: categoryId }
                });
              }
            }
            break;
            
          case '11':
          case 'backup':
            const backupPath = args[1];
            await this.sendRequest('tools/call', {
              name: 'backup_database',
              arguments: backupPath ? { backup_path: backupPath } : {}
            });
            break;
            
          case '12':
          case 'export':
            const exportPath = args[1] || 'tasks_export.json';
            await this.sendRequest('tools/call', {
              name: 'export_tasks_to_json',
              arguments: { file_path: exportPath }
            });
            break;
            
          case '13':
          case 'info':
            await this.sendRequest('tools/call', {
              name: 'get_server_info',
              arguments: {}
            });
            break;
            
          case '14':
          case 'quit':
            console.log('👋 終了中...');
            this.cleanup();
            return;
            
          default:
            console.log('❌ 不明なコマンド:', command);
            console.log('利用可能なコマンドを確認するには、上記のリストを参照してください。');
        }
      } catch (error) {
        console.error('❌ コマンドエラー:', error);
      }
      
      this.rl.prompt();
    });
  }

  private cleanup() {
    this.rl.close();
    if (this.process) {
      this.process.kill();
    }
    process.exit(0);
  }
}

// メイン実行
const client = new TaskManagerTestClient();
client.start().catch(console.error);
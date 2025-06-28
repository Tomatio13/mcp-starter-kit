/**
 * MCPサーバーのテストクライアント - TypeScript版
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

class MCPTestClient {
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
    console.log('🚀 MCPサーバーテストクライアント - TypeScript版');
    console.log('================================');
    
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
        name: 'test-client-ts',
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
    console.log('2. tools/call - ツールを実行');
    console.log('3. hello <名前> - 挨拶ツールのテスト');
    console.log('4. add <数値1> <数値2> - 足し算ツールのテスト');
    console.log('5. info - サーバー情報取得');
    console.log('6. age <生年> - 年齢計算');
    console.log('7. format <テキスト> [スタイル] - テキストフォーマット');
    console.log('8. divide <被除数> <除数> - 安全な除算');
    console.log('9. quit - 終了');
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
            
          case '3':
          case 'hello':
            if (args.length < 2) {
              console.log('❌ 使用法: hello <名前>');
            } else {
              await this.sendRequest('tools/call', {
                name: 'say_hello',
                arguments: { name: args[1] }
              });
            }
            break;
            
          case '4':
          case 'add':
            if (args.length < 3) {
              console.log('❌ 使用法: add <数値1> <数値2>');
            } else {
              const a = parseFloat(args[1]);
              const b = parseFloat(args[2]);
              if (isNaN(a) || isNaN(b)) {
                console.log('❌ 数値を入力してください');
              } else {
                await this.sendRequest('tools/call', {
                  name: 'add_numbers',
                  arguments: { a, b }
                });
              }
            }
            break;
            
          case '5':
          case 'info':
            await this.sendRequest('tools/call', {
              name: 'get_server_info',
              arguments: {}
            });
            break;
            
          case '6':
          case 'age':
            if (args.length < 2) {
              console.log('❌ 使用法: age <生年>');
            } else {
              const birthYear = parseInt(args[1]);
              if (isNaN(birthYear)) {
                console.log('❌ 有効な年を入力してください');
              } else {
                await this.sendRequest('tools/call', {
                  name: 'calculate_age',
                  arguments: { birth_year: birthYear }
                });
              }
            }
            break;
            
          case '7':
          case 'format':
            if (args.length < 2) {
              console.log('❌ 使用法: format <テキスト> [スタイル]');
            } else {
              const text = args[1];
              const style = args[2] || 'upper';
              await this.sendRequest('tools/call', {
                name: 'format_text',
                arguments: { text, style }
              });
            }
            break;
            
          case '8':
          case 'divide':
            if (args.length < 3) {
              console.log('❌ 使用法: divide <被除数> <除数>');
            } else {
              const dividend = parseFloat(args[1]);
              const divisor = parseFloat(args[2]);
              if (isNaN(dividend) || isNaN(divisor)) {
                console.log('❌ 数値を入力してください');
              } else {
                await this.sendRequest('tools/call', {
                  name: 'safe_divide',
                  arguments: { dividend, divisor }
                });
              }
            }
            break;
            
          case '9':
          case 'quit':
            console.log('👋 終了中...');
            this.cleanup();
            return;
            
          default:
            console.log('❌ 不明なコマンド:', command);
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
const client = new MCPTestClient();
client.start().catch(console.error);
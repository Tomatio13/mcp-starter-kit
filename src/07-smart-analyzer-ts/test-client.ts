/**
 * スマート情報収集&分析システムのテストクライアント - TypeScript版
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

class SmartAnalyzerTestClient {
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
    console.log('🧠 スマート情報収集&分析システムテストクライアント - TypeScript版');
    console.log('=================================================================');
    
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
        name: 'smart-analyzer-test-client-ts',
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
    console.log('\n🧠 利用可能なコマンド:');
    console.log('1. tools/list - ツール一覧を取得');
    console.log('2. analyze <URL> - 単一URL分析');
    console.log('3. batch <URL1> <URL2> ... - 複数URL一括分析');
    console.log('4. history [件数] - 分析履歴表示');
    console.log('5. sentiment <positive|negative|neutral> - 感情別検索');
    console.log('6. keywords [最小頻度] - キーワード分析');
    console.log('7. report - サマリーレポート生成');
    console.log('8. rss <RSS_URL> [記事数] - RSSフィード分析');
    console.log('9. info - サーバー情報');
    console.log('10. quit - 終了');
    console.log('');
    console.log('📝 使用例:');
    console.log('  analyze https://example.com');
    console.log('  batch https://news1.com https://news2.com');
    console.log('  sentiment positive');
    console.log('  keywords 0.02');
    console.log('  rss https://example.com/feed.xml 5');
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
          case 'analyze':
            if (args.length < 2) {
              console.log('❌ 使用法: analyze <URL>');
            } else {
              const url = args[1];
              if (!this.isValidUrl(url)) {
                console.log('❌ 有効なURLを入力してください');
              } else {
                await this.sendRequest('tools/call', {
                  name: 'scrape_and_analyze',
                  arguments: { url }
                });
              }
            }
            break;
            
          case '3':
          case 'batch':
            if (args.length < 2) {
              console.log('❌ 使用法: batch <URL1> [URL2] [URL3] ...');
            } else {
              const urls = args.slice(1);
              const validUrls = urls.filter(url => this.isValidUrl(url));
              
              if (validUrls.length === 0) {
                console.log('❌ 有効なURLが見つかりません');
              } else if (validUrls.length > 10) {
                console.log('❌ 一度に分析できるURLは最大10件です');
              } else {
                console.log(`📊 ${validUrls.length}件のURLを一括分析中...`);
                await this.sendRequest('tools/call', {
                  name: 'batch_analyze_urls',
                  arguments: { urls: validUrls }
                });
              }
            }
            break;
            
          case '4':
          case 'history':
            const limit = args[1] ? parseInt(args[1]) : 10;
            if (isNaN(limit) || limit < 1 || limit > 100) {
              console.log('❌ 件数は1〜100の範囲で指定してください');
            } else {
              await this.sendRequest('tools/call', {
                name: 'get_analysis_history',
                arguments: { limit }
              });
            }
            break;
            
          case '5':
          case 'sentiment':
            if (args.length < 2) {
              console.log('❌ 使用法: sentiment <positive|negative|neutral>');
            } else {
              const sentimentLabel = args[1];
              if (!['positive', 'negative', 'neutral'].includes(sentimentLabel)) {
                console.log('❌ 感情ラベルは positive, negative, neutral のいずれかを指定してください');
              } else {
                await this.sendRequest('tools/call', {
                  name: 'search_by_sentiment',
                  arguments: { sentiment_label: sentimentLabel }
                });
              }
            }
            break;
            
          case '6':
          case 'keywords':
            const minFrequency = args[1] ? parseFloat(args[1]) : 0.01;
            if (isNaN(minFrequency) || minFrequency < 0 || minFrequency > 1) {
              console.log('❌ 最小頻度は0〜1の範囲で指定してください');
            } else {
              await this.sendRequest('tools/call', {
                name: 'get_keyword_analysis',
                arguments: { min_frequency: minFrequency }
              });
            }
            break;
            
          case '7':
          case 'report':
            console.log('📊 サマリーレポートを生成中...');
            await this.sendRequest('tools/call', {
              name: 'generate_summary_report',
              arguments: {}
            });
            break;
            
          case '8':
          case 'rss':
            if (args.length < 2) {
              console.log('❌ 使用法: rss <RSS_URL> [記事数]');
            } else {
              const rssUrl = args[1];
              const maxItems = args[2] ? parseInt(args[2]) : 10;
              
              if (!this.isValidUrl(rssUrl)) {
                console.log('❌ 有効なRSS URLを入力してください');
              } else if (isNaN(maxItems) || maxItems < 1 || maxItems > 20) {
                console.log('❌ 記事数は1〜20の範囲で指定してください');
              } else {
                console.log(`📰 RSSフィードから${maxItems}件の記事を分析中...`);
                await this.sendRequest('tools/call', {
                  name: 'analyze_rss_feed',
                  arguments: { rss_url: rssUrl, max_items: maxItems }
                });
              }
            }
            break;
            
          case '9':
          case 'info':
            await this.sendRequest('tools/call', {
              name: 'get_server_info',
              arguments: {}
            });
            break;
            
          case '10':
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

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
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
const client = new SmartAnalyzerTestClient();
client.start().catch(console.error);
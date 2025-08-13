# PR-Agentインストールガイド

## 概要
PR-Agentは、AIを活用した自動コードレビューツールです。この手順書では、GitLabにPR-Agentを設定し、Merge Requestの自動分析・レビューを行う環境を構築する方法を説明します。

## 前提条件

### 必要なツールとアクセス権限
- Python 3.7以上がインストールされていること
- OpenAI APIキー（GPTを使用するため）
- GitLab Personal Access Token（APIアクセス用）
- GitLab上でWebhookを設定できる権限

### 必要なスコープ
GitLab Personal Access Tokenには以下のスコープが必要：
- `api`
- `read_user` 
- `read_repository`

## 設定手順

### 1. PR-Agentリポジトリのクローンとインストール

```bash
# PR-Agentリポジトリをクローン
git clone https://github.com/Codium-ai/pr-agent.git
cd pr-agent

# パッケージをインストール
pip install -e .
```

### 2. 設定ファイルの準備

#### secrets設定ファイルの作成
```bash
# テンプレートファイルをコピー
cp pr_agent/settings/.secrets_template.toml pr_agent/settings/.secrets.toml
```

#### `.secrets.toml`ファイルの編集
```toml
[openai]
key = "your_openai_api_key_here"

[gitlab]
personal_access_token = "your_gitlab_personal_access_token"
shared_secret = "your_webhook_secret_token"
```

**設定項目の説明：**
- `openai.key`: OpenAI APIキー
- `gitlab.personal_access_token`: GitLab Personal Access Token
- `gitlab.shared_secret`: Webhook認証用の秘密トークン（任意の文字列）

### 3. 設定ファイルのカスタマイズ

#### `configuration.toml`ファイルの編集
```toml
[config]
git_provider = "gitlab"

[pr_reviewer]
extra_instructions = "Please use Japanese in descriptions."

[pr_description]
publish_description = true
```

**主要な設定項目：**
- `git_provider`: "gitlab"に設定
- `pr_reviewer.extra_instructions`: レビューに関する追加指示
- `pr_description.publish_description`: 説明の自動生成を有効化

### 4. Webhookサーバーの起動

```bash
# PR-AgentのWebhookサーバーを起動
python pr-agent/pr_agent/servers/gitlab_webhook.py
```

デフォルトでは、サーバーはポート3000で起動します。

### 5. 外部アクセスの設定（ngrokを使用した例）

ローカル環境で動作させる場合は、ngrokなどを使用してサーバーを外部に公開します：

```bash
# ngrokをインストール（未インストールの場合）
# brew install ngrok  # macOSの場合
# または公式サイトからダウンロード

# ポート3000を外部に公開
ngrok http 3000
```

ngrokが起動すると、以下のような外部URLが生成されます：
```
https://abcd1234.ngrok-free.app
```

### 6. GitLabでのWebhook設定

#### 6.1 プロジェクト設定画面にアクセス
1. GitLabのプロジェクトページにアクセス
2. 左サイドバーの「Settings」→「Webhooks」を選択

#### 6.2 Webhookの追加
以下の設定でWebhookを追加：

**URL:** `https://your-ngrok-url.ngrok-free.app/webhook`

**Secret Token:** `.secrets.toml`で設定した`shared_secret`と同じ値

**Trigger Events:** 以下にチェック
- Comments
- Merge request events

#### 6.3 SSL verification
- Enable SSL verificationにチェック（httpsの場合）

#### 6.4 設定の保存
「Add webhook」ボタンをクリックして保存

## 利用方法

### 基本的なコマンド

Merge Requestのコメント欄で以下のコマンドを使用できます：

#### `/describe`
- Merge Requestの内容を分析し、詳細な説明を自動生成
- 変更内容の概要とインパクトを日本語で説明

#### `/review`  
- コードの自動レビューを実行
- 潜在的な問題点や改善提案を提供
- セキュリティやパフォーマンスの観点からの分析

#### `/improve`
- コードの改善提案を提供
- より良い実装方法やベストプラクティスの提案

#### `/ask [質問]`
- Merge Requestに関する質問に回答
- 例：`/ask このコードの変更がパフォーマンスに与える影響は？`

#### `/update_changelog`
- 変更内容に基づいてChangelogを自動更新

### 使用例
1. Merge Requestを作成
2. コメント欄で`/describe`と投稿
3. PR-Agentが自動的に詳細な説明を生成
4. 必要に応じて`/review`でコードレビューを実行

## トラブルシューティング

### よくある問題と解決方法

#### 1. Webhookが動作しない
- `.secrets.toml`の`shared_secret`とGitLabのSecret Tokenが一致しているか確認
- サーバーが正常に起動しているか確認（ポート3000）
- ngrok URLが正しくGitLabに設定されているか確認

#### 2. OpenAI APIエラー
- APIキーが正しく設定されているか確認
- OpenAI APIの利用制限に達していないか確認
- インターネット接続を確認

#### 3. GitLab認証エラー  
- Personal Access Tokenの権限スコープを確認
- トークンの有効期限を確認
- GitLabプロジェクトへのアクセス権限を確認

### ログの確認
```bash
# サーバーのログを確認
tail -f pr-agent/logs/pr_agent.log
```

## セキュリティ考慮事項

1. **認証情報の管理**
   - `.secrets.toml`ファイルは絶対にコミットしない
   - API키和トークンは定期的にローテーション

2. **ネットワークセキュリティ**
   - 本番環境では適切なファイアウォール設定を実施
   - HTTPS通信を使用

3. **アクセス制御**
   - 必要最小限の権限でPersonal Access Tokenを作成
   - Webhook URLは適切に保護

## 本番環境での運用

### デーモン化
```bash
# systemdサービスとして登録（Linuxの場合）
sudo systemctl enable pr-agent
sudo systemctl start pr-agent
```

### 監視とメンテナンス
- サーバーの稼働状況を定期的に確認
- API利用量の監視
- ログローテーションの設定

## まとめ

この手順書に従って設定することで、GitLabでAIによる自動コードレビューが利用できるようになります。チーム全体のコード品質向上と開発効率の向上が期待できます。

設定や運用で不明な点がある場合は、PR-Agentの公式ドキュメントや GitHub Issuesを参照してください。
---
marp: true
# ↓↓↓ これらの行はテンプレートが機能するために必要です ↓↓↓
header: ' '
footer: ' '
---

<style>
/* Google Fontsから日本語フォントを読み込み */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap');

/* --- 色やフォントの基本設定 --- */
:root {
  --color-background: #f8f8f4;
  --color-foreground: #3a3b5a;
  --color-heading: #4f86c6;
  --color-hr: #000000;
  --font-default: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
}

/* --- スライド全体のスタイル --- */
section {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-default);
  font-weight: 400;
  box-sizing: border-box;
  border-bottom: 8px solid var(--color-hr);
  position: relative;
  line-height: 1.7;
  font-size: 22px;
  padding: 56px;
}
section:last-of-type {
  border-bottom: none;
}

/* --- 見出しのスタイル --- */
h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  color: var(--color-heading);
  margin: 0;
  padding: 0;
}

/* タイトルページ(h1)のスタイル */
h1 {
  font-size: 56px;
  line-height: 1.4;
  text-align: left;
}

/* 通常スライドのタイトル(##) */
h2 {
  position: absolute;
  top: 40px;
  left: 56px;
  right: 56px;
  font-size: 40px;
  padding-top: 0;
  padding-bottom: 16px;
}

/* h2の疑似要素(::after)を使って、短い線を実装 */
h2::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 8px;
  width: 60px;
  height: 2px;
  background-color: var(--color-hr);
}

/* h2と後続コンテンツの間のスペースを確保 */
h2 + * {
  margin-top: 112px;
}

/* サブ見出し (例: 目的, 目標) */
h3 {
  color: var(--color-foreground);
  font-size: 28px;
  margin-top: 32px;
  margin-bottom: 12px;
}

/* --- リストのスタイル --- */
ul, ol {
  padding-left: 32px;
}
li {
  margin-bottom: 10px;
}

/* フッターとして機能する、太い青いラインを実装 */
footer {
  font-size: 0;
  color: transparent;
  position: absolute;
  left: 56px;
  right: 56px;
  bottom: 40px;
  height: 8px;
  background-color: var(--color-heading);
}

/* ロゴの配置 */
header {
  font-size: 0;
  color: transparent;
  background-image: url('ロゴ.png');
  background-repeat: no-repeat;
  background-size: contain;
  background-position: top right;
  
  position: absolute;
  top: 40px;
  left: calc(100% - 180px - 56px);
  width: 180px;
  height: 50px;
}

/* --- 特別なクラス --- */
section.lead {
  border-bottom: 8px solid var(--color-hr);
}

/* タイトルページではフッターラインとロゴ(header)を非表示にする */
section.lead footer,
section.lead header {
  display: none;
}

section.lead h1 {
  margin-bottom: 24px;
}
section.lead p {
  font-size: 24px;
  color: var(--color-foreground);
}

/* MCPハッカソン用の追加スタイル */
.highlight {
  background-color: #fff3cd;
  padding: 8px 16px;
  border-radius: 4px;
  border-left: 4px solid var(--color-heading);
}

.demo-note {
  background-color: #e7f3ff;
  color: #0056b3;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 20px;
}

.tech-stack {
  display: inline-block;
  background-color: var(--color-heading);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 18px;
  margin: 4px;
}
</style>

# 【チーム名】
# 【プロジェクト名】

**PSITS MCPハッカソン 2025 成果発表**

チームメンバー：【メンバー名】

---

## 解決したい課題

### 現状の問題
- 【具体的な業務課題を1〜2点で記載】
- 【課題による影響や困りごと】

### なぜこの課題に取り組むのか
【課題の重要性や緊急性を説明】

---

## 提案するソリューション

### 解決アプローチ
【MCPを活用した解決策の概要】

### 期待される効果
- **効率化：** 【具体的な改善効果】
- **品質向上：** 【品質面での改善】
- **コスト削減：** 【コスト面での効果】

---

## 技術構成

### アーキテクチャ概要
```
【システム構成図をASCII図やテキストで表現】
[ユーザー] → [n8n] → [MCPサーバー] → [外部API]
```

### 使用技術
<span class="tech-stack">FastMCP</span>
<span class="tech-stack">n8n</span>
<span class="tech-stack">OpenAI GPT-4o</span>
<span class="tech-stack">【その他使用技術】</span>

---

## 実装のポイント

### プロンプトエンジニアリング
- **工夫した点：** 【プロンプト設計の特徴】
- **AIの活用方法：** 【効果的な使い方】

### MCPサーバーの機能
1. **【機能名1】**：【機能の説明】
2. **【機能名2】**：【機能の説明】
3. **【機能名3】**：【機能の説明】

---

## デモンストレーション

<div class="demo-note">
📱 ここで実際の動作をデモンストレーションします
</div>

### デモシナリオ
1. **【ステップ1】**：【操作内容と期待結果】
2. **【ステップ2】**：【操作内容と期待結果】
3. **【ステップ3】**：【操作内容と期待結果】

---

## 実装の成果

### 達成できたこと
- ✅ 【完成した機能1】
- ✅ 【完成した機能2】
- ✅ 【完成した機能3】

### 今後の改善予定
- 🔄 【改善予定の項目1】
- 🔄 【改善予定の項目2】

---

## 学んだこと・気づき

### 技術面での学び
【MCPやプロンプトエンジニアリングで学んだこと】

### チームワークでの成果
【チーム開発で得られた知見】

<div class="highlight">
<strong>特に印象的だった学び：</strong><br>
【最も重要な学びや発見】
</div>

---

## 今後の展開

### 実用化に向けて
- **短期的な計画：** 【今後1〜3ヶ月の予定】
- **長期的な展望：** 【将来的な発展性】

### 他部署・他社への横展開
【このソリューションの応用可能性】

---

# ご清聴ありがとうございました

**質疑応答**

---

## 補足資料（必要に応じて）

### 技術詳細
【技術的な補足説明】

### 参考資料
- 【参考にした資料やドキュメント】
- 【関連技術の情報源】
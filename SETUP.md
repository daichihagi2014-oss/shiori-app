# 旅のしおり - セットアップガイド

## 必要なもの

- Node.js 18以上
- Supabaseアカウント（無料）
- Vercelアカウント（デプロイ用、無料）

---

## 1. Supabaseの設定

### 1-1. プロジェクト作成

1. [supabase.com](https://supabase.com) にアクセスしてアカウント作成
2. 「New Project」をクリックしてプロジェクトを作成
3. 任意の名前・パスワード・リージョン（日本に近いのは ap-northeast-1）を設定

### 1-2. データベーステーブルの作成

1. Supabase Dashboard → **SQL Editor** を開く
2. `supabase/schema.sql` の内容を全てコピーして実行

### 1-3. Storageバケットの作成

1. Supabase Dashboard → **Storage** を開く
2. 「New bucket」をクリック
3. バケット名: `shiori-images`
4. 「Public bucket」にチェックを入れてCreate
5. バケットの **Policies** から以下を追加:
   - Name: `Allow all inserts`
   - Allowed operations: INSERT, SELECT
   - Target roles: anon, authenticated
   - Policy: `true`

### 1-4. APIキーのコピー

1. Supabase Dashboard → **Settings** → **API**
2. 以下をコピー:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. ローカル開発

```bash
# 依存パッケージのインストール（済み）
npm install

# 環境変数の設定
cp .env.local.example .env.local
# .env.local を編集してSupabaseのURLとキーを入力

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 を開く

---

## 3. Vercelへのデプロイ

```bash
# Vercel CLIをインストール（未インストールの場合）
npm install -g vercel

# デプロイ
vercel

# 本番デプロイ
vercel --prod
```

**Vercel Dashboard で環境変数を設定:**
1. Project Settings → Environment Variables
2. `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を追加

---

## 使い方

### しおりを作る
1. トップページの「しおりを作る」をクリック
2. タイトル・目的地・日程・パスワードを入力
3. 「しおりを作成する」でURLとパスワードが発行される

### しおりを共有する
- 発行されたURLとパスワードをグループのLINEやSlackで共有

### しおりを編集する
- URLにアクセスしてパスワードを入力
- セクション（スケジュール・TODO・持ち物・メモ）を追加して編集
- 編集内容はリアルタイムで全員に反映

---

## セクションの種類

| セクション | 説明 |
|-----------|------|
| 📅 スケジュール | 日付・時間・場所・絵文字でスケジュールを管理 |
| ✅ TODOリスト | 旅の準備タスクをチェックリストで管理 |
| 🎒 持ち物リスト | 持ち物をチェックリストで管理 |
| 📝 メモ | 自由にメモを書ける |

---

## トラブルシューティング

**「しおりの作成に失敗しました」と出る場合**
→ Supabaseの環境変数が正しく設定されているか確認

**画像がアップロードできない場合**
→ StorageバケットのPoliciesが正しく設定されているか確認

**リアルタイム更新されない場合**
→ Supabase RealtimeがEnableになっているか確認（Table Editor → Replication）

# LISENS — 社内ライセンス制度運用アプリ

教育 × 品質保証 × 人事評価補助を統合するB2B SaaSのMVP。

## 概要

LISENSは、社内の教育・評価・認定を一元管理するWebアプリケーションです。

### MVP機能
- **認証・ログイン** — メール + パスワード（Supabase Auth）
- **受講進捗管理** — カリキュラム×科目の進捗をリアルタイムに把握
- **実技評価の記録** — テンプレート項目に沿ったスコア+コメントの記録
- **レベル認定** — 承認フロー付きのレベル認定管理
- **権限分岐** — 5ロールに応じた画面表示・操作の制御

### 5つのユーザーロール
| ロール | 説明 |
|--------|------|
| 本部管理者 (admin) | システム全体の管理権限 |
| 教育責任者 (education_manager) | カリキュラム管理、認定承認 |
| 評価者 (evaluator) | 実技評価の入力 |
| 店舗責任者 (store_manager) | 自店舗のスタッフ情報閲覧 |
| 受講者 (learner) | 自身の進捗・評価・認定の閲覧 |

## セットアップ手順

### 前提条件
- Node.js 18以上
- npm

### インストール

```bash
# リポジトリのクローン後
cd lisens

# 依存関係のインストール
npm install

# 環境変数を設定（プロジェクト直下に .env.local を作成）
#   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=（Supabaseのanonキー）

# 開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

> Supabaseの初期セットアップは `supabase/01_create_tables.sql` → `supabase/02_seed_data.sql` → `supabase/04_secure_rls.sql` の順にSQL Editorで実行してください（`03_fix_rls.sql` は匿名全開放の暫定版なので本番では使いません）。

### テスト用アカウント

シードデータ（`supabase/02_seed_data.sql`）で以下のアカウントが作成されます。  
ログインには **Supabase Auth でパスワード設定が必要**です（招待メールのリンク、またはSupabaseダッシュボードで設定）。クリックだけのダミーログインは廃止しました。

| メール | 名前 | ロール |
|--------|------|--------|
| admin@element.com | 管理太郎 | 本部管理者 |
| edu@element.com | 教育花子 | 教育責任者 |
| eval@element.com | 鈴木一郎 | 評価者 |
| store@element.com | 佐藤次郎 | 店舗責任者 |
| learner1@element.com | 山田太郎 | 受講者 |
| learner2@element.com | 田中美咲 | 受講者 |
| learner3@element.com | 高橋健太 | 受講者 |

## 主要画面

| 画面 | パス | 説明 |
|------|------|------|
| ログイン | `/login` | メールでログイン |
| ホーム | `/` | ロール別ダッシュボード |
| 受講者一覧 | `/learners` | 全受講者の進捗一覧 |
| 受講者詳細 | `/learners/:id` | 個人カルテ（進捗・評価・認定） |
| 評価入力 | `/evaluations/new?learner_id=xxx` | 実技評価のスコア入力 |
| 認定一覧 | `/certifications` | 認定ステータス一覧 |
| 認定詳細 | `/certifications/:id` | 認定の承認・差し戻し |

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フレームワーク | Next.js (App Router) |
| 言語 | TypeScript |
| スタイリング | CSS Modules + グローバルCSS |
| ホスティング | Netlify（静的エクスポート + Functions） |
| データ／認証 | Supabase（PostgreSQL + Auth + RLS） |

## フォルダ構成

```
lisens/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx            # ホーム（ダッシュボード）
│   ├── login/              # ログイン画面
│   ├── auth/               # 招待リンク/パスワード設定（Supabase Auth）
│   ├── learners/           # 受講者一覧・詳細・招待
│   ├── evaluations/        # 評価入力
│   ├── certifications/     # 認定一覧・詳細・申請
│   ├── admin/              # スタッフ/カリキュラム/レポート管理
│   └── components/         # 共通コンポーネント
├── lib/                    # ロジック・データ・型定義
│   ├── types.ts            # TypeScript型定義
│   ├── constants.ts        # 定数定義
│   ├── supabase.ts         # Supabaseクライアント
│   ├── data.ts             # データアクセス層（Supabase）
│   ├── auth-context.tsx    # 認証コンテキスト（Supabase Auth）
│   └── route-id.ts         # 静的エクスポート用の動的ルートID取得
├── supabase/               # テーブル作成・シード・RLSのSQL
├── netlify/functions/      # 招待/削除のサーバーレス関数
└── docs/                   # 設計ドキュメント
```

## 設計ドキュメント

- `docs/requirements.md` — 要件定義書
- `docs/product_spec.md` — プロダクト仕様書
- `docs/db_schema.md` — データベース設計書
- `docs/screen_flow.md` — 画面遷移設計書
- `docs/tech_proposal.md` — 技術提案書

## 将来のロードマップ

- Phase 2: 宿題提出、再受講管理、テンプレート評価表
- Phase 3: 店舗別KPI、人事評価連携、品質レビュー
- Phase 4: 通知機能、合否判定AI、マルチテナント

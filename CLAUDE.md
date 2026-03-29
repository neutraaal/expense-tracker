# Expense Tracker - プロジェクト引き継ぎメモ

## アプリ概要
Windows デスクトップで動く**支出管理アプリ**。
複数人の支出を記録し、月次で清算金額（誰が誰にいくら支払うか）を自動計算する。

## 技術スタック
- **フレームワーク**: Electron v29 + Vite + React 18
- **DB**: sql.js v1.12（SQLite の WebAssembly 実装。コンパイル不要）
- **パッケージャー**: electron-builder（Windows NSIS インストーラー生成）

## 機能要件
- 支出のみ管理（収入管理は不要）
- 支出ごとに「誰が払ったか」を記録
- 月次で均等割り清算金額を算出（最小送金回数に最適化）
- CSVエクスポート・予算管理は不要

## DBスキーマ
```sql
members    : id, name, created_at
categories : id, name, created_at
expenses   : id, date, amount, category_id, paid_by, memo, created_at, updated_at
```
- `expenses.paid_by` → `members.id` の外部キー
- デフォルトカテゴリ: 食費・光熱費・日用品・交通費・外食・娯楽・その他

## IPC API（window.api）
```js
window.api.members.getAll() / create(name) / update(id, name) / delete(id)
window.api.categories.getAll() / create(name) / update(id, name) / delete(id)
window.api.expenses.getByMonth(year, month) / create(...) / update(...) / delete(id)
window.api.settlement.calculate(year, month)
  // → { totalAmount, perPerson, balances: [{id, name, paid, fairShare, balance}], transactions: [{from, to, amount}] }
```

## プロジェクト構成
```
D:\expense-tracker\
├── src/
│   ├── main/
│   │   ├── index.js      # Electron メインプロセス（DB初期化・IPC登録）
│   │   ├── database.js   # DB初期化・CRUD・清算ロジック
│   │   └── ipc.js        # IPC ハンドラー登録
│   ├── preload/
│   │   └── index.js      # window.api を Renderer に公開
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── App.jsx
│           ├── main.jsx
│           └── assets/index.css
├── electron.vite.config.js
├── package.json
└── CLAUDE.md
```

## フェーズ進捗
- [x] フェーズ 1: 環境構築（electron-vite + React + sql.js）
- [x] フェーズ 2: データ設計（DBスキーマ・IPC通信・CRUD・清算ロジック）
- [x] フェーズ 3: UI実装
- [x] フェーズ 4: 機能実装
- [ ] フェーズ 5: ビルド・配布

### 各フェーズ実行時の注意点
各フェーズが完了した場合、勝手に次のフェーズは実行せず、完了報告を行う

## フェーズ 3 タスク（完了）
- [x] アプリ全体レイアウト（ナビゲーション・サイドバー）
- [x] ダッシュボード画面（月次支出サマリー・グラフ）
- [x] 支出入力フォーム（日付・金額・カテゴリ・支払者・メモ）
- [x] 支出一覧・履歴画面
- [x] カテゴリ管理画面
- [x] メンバー管理画面
- [x] 月次清算画面

## フェーズ 4 タスク（完了）
- [x] 支出一覧のフィルタ・検索（メンバー・カテゴリ絞り込み、メモ全文検索）
- [x] フォームバリデーション（必須チェック・エラーメッセージ表示）
- [x] キーボード操作（Esc でモーダル閉じる・Enter で送信）
- [x] 支出一覧のソート（日付・金額で並び替え）

## 開発コマンド
```bash
cd D:\expense-tracker
npm run dev      # 開発サーバー起動
npm run build    # ビルド
npm run package  # Windows インストーラー生成
```

## DBファイルの場所（開発時）
```
C:\Users\tripe\AppData\Roaming\expense-tracker\expense-tracker.db
```
GUI確認ツール: DB Browser for SQLite（https://sqlitebrowser.org/）

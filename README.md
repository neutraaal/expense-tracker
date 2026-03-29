# Expense Tracker

複数人の支出を記録し、月次で清算金額を自動計算する Windows デスクトップアプリです。

## 機能

- 支出の記録（日付・金額・カテゴリ・支払者・メモ）
- ダッシュボード（月次支出サマリー・グラフ表示）
- 支出一覧・フィルタ・ソート・全文検索
- カテゴリ管理・メンバー管理
- 月次清算計算（最小送金回数に最適化）

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Electron v29 + Vite + React 18 |
| データベース | sql.js v1.12（SQLite WebAssembly） |
| パッケージャー | electron-builder（Windows NSIS インストーラー） |

## 開発環境のセットアップ

```bash
# 依存パッケージをインストール
npm install

# 開発サーバーを起動
npm run dev
```

## ビルド・配布

```bash
# ビルドのみ
npm run build

# Windows インストーラーを生成
npm run package
```

## プロジェクト構成

```
expense-tracker/
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

## DBスキーマ

```sql
members    : id, name, created_at
categories : id, name, created_at
expenses   : id, date, amount, category_id, paid_by, memo, created_at, updated_at
```

デフォルトカテゴリ: 食費・光熱費・日用品・交通費・外食・娯楽・その他

## IPC API

レンダラープロセスから `window.api` を通じて以下の操作が可能です。

```js
// メンバー管理
window.api.members.getAll()
window.api.members.create(name)
window.api.members.update(id, name)
window.api.members.delete(id)

// カテゴリ管理
window.api.categories.getAll()
window.api.categories.create(name)
window.api.categories.update(id, name)
window.api.categories.delete(id)

// 支出管理
window.api.expenses.getByMonth(year, month)
window.api.expenses.create(...)
window.api.expenses.update(...)
window.api.expenses.delete(id)

// 清算計算
window.api.settlement.calculate(year, month)
// 戻り値: { totalAmount, perPerson, balances: [{id, name, paid, fairShare, balance}], transactions: [{from, to, amount}] }
```

## DBファイルの場所（開発時）

```
C:\Users\<username>\AppData\Roaming\expense-tracker\expense-tracker.db
```

GUI確認ツール: [DB Browser for SQLite](https://sqlitebrowser.org/)

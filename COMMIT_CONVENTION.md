# Git Commit Convention

このプロジェクトでは、Conventional Commits形式を採用しています。

## 接頭辞一覧

| 接頭辞     | 説明                                                             |
| ---------- | ---------------------------------------------------------------- |
| `feat`     | 新機能の追加                                                     |
| `fix`      | バグ修正                                                         |
| `docs`     | ドキュメントのみの変更                                           |
| `style`    | コードの動作に影響しない変更（空白、フォーマット、セミコロン等） |
| `refactor` | バグ修正や機能追加を伴わないコードの変更                         |
| `perf`     | パフォーマンス改善のためのコード変更                             |
| `test`     | テストの追加・修正                                               |
| `build`    | ビルドシステムや外部依存関係に影響する変更                       |
| `ci`       | CI設定ファイルやスクリプトの変更                                 |
| `chore`    | その他の変更（ソースやテストの変更を伴わない）                   |
| `revert`   | 以前のコミットの取り消し                                         |

## フォーマット

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 必須要素

- **type**: 上記の接頭辞のいずれか
- **subject**: 変更内容の簡潔な説明（50文字以内推奨）

### 任意要素

- **scope**: 変更の影響範囲（例: `api`, `ui`, `config`）
- **body**: 変更の詳細な説明
- **footer**: Breaking Changesや関連Issue番号

## 使用例

```
feat: ユーザー認証機能を追加

fix: ログイン時のエラーハンドリングを修正

docs: READMEにインストール手順を追加

style: コードフォーマットを統一

refactor: データベース接続ロジックを整理

perf: クエリのパフォーマンスを最適化

test: ユーザーモジュールのユニットテストを追加

build: TypeScriptのバージョンを更新

ci: GitHub Actionsワークフローを追加

chore: 不要なファイルを削除
```

## スコープ付きの例

```
feat(auth): OAuth2.0認証を実装

fix(api): レスポンスのステータスコードを修正

refactor(database): コネクションプールを導入
```

## Breaking Changesの例

```
feat(api)!: APIエンドポイントの構造を変更

BREAKING CHANGE: /api/v1/users が /api/v2/users に変更されました
```

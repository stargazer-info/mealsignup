# Meal Signup Monorepo

食事申込（朝・昼・夕）をグループ（組織）単位で管理する Web アプリケーションのモノレポです。  
フロントエンド（client: React + Vite + TypeScript）とバックエンド（server: Express + Prisma + TypeScript）、共有パッケージ（shared）で構成されています。

## リポジトリ構成

- client/ … フロントエンド（Vite + React + TypeScript + Tailwind）
- server/ … バックエンド（Express + Prisma）
  - prisma/schema.prisma … DB スキーマ
  - openapi/openapi.yaml … API 仕様（OpenAPI 3.1）
  - .env.example … サーバ用の環境変数サンプル
- shared/ … 共有コード・型定義（将来の拡張用）
- docker-compose.yml … ローカル開発用の Postgres/Redis 定義
- notes/ … ドキュメント類（任意）

## 主要機能

- 組織とメンバーシップ管理（ADMIN/MEMBER）
- 食事申込区分（NONE / NORMAL / TAKEOUT）
- 月次サマリー/日別の申込表示
- 認証（Clerk を想定）
- OpenAPI による API 仕様管理

## クイックスタート

前提:
- Node.js 18+（LTS 推奨）
- Docker / Docker Compose
- npm（またはお好みのパッケージマネージャ）

1) 環境変数を設定  
server/.env.example を server/.env にコピーし、必要な値を設定します。  
Docker 上の Postgres を利用する場合は例:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/mealsignup"
CLERK_SECRET_KEY="sk_test_..."  # Clerk を利用する場合に設定
PORT=3001
NODE_ENV=development
CLIENT_URL="http://localhost:5173"
```

2) 依存関係のインストール
- client/ と server/ それぞれで npm ci を実行してください。

3) Docker（DB/Redis）の起動
- リポジトリルートで docker-compose up -d を実行。  
  - Postgres: localhost:5432（DB: mealsignup / user: postgres / pass: password）
  - Redis: localhost:6379

4) Prisma のセットアップ（server/）
- マイグレーション適用: npx prisma migrate deploy
- クライアント生成: npx prisma generate

5) 開発サーバ起動
- client: npm run dev（デフォルト http://localhost:5173）
- server: npm run dev（デフォルト http://localhost:3001）

## API 仕様

- OpenAPI 定義: server/openapi/openapi.yaml  
API クライアント生成やドキュメント閲覧に利用できます。Swagger Editor や VS Code の OpenAPI プラグインなどで参照してください。

## データモデル概要（Prisma）

- Organization / OrganizationMembership … 組織とメンバーシップ
- MealOrderType … 申込区分（id は "NONE" / "NORMAL" / "TAKEOUT"）
- MealSignup … 日付ごとの申込（朝・昼・夕の区分を保持）
- UserProfile … 表示名などのユーザープロファイル

スキーマは server/prisma/schema.prisma を参照してください。

## よくあるトラブル

- DB 接続エラー
  - docker-compose の Postgres が起動しているか確認
  - server/.env の DATABASE_URL が実環境に合っているか確認
- 認証エラー
  - CLERK_SECRET_KEY が設定されているか確認
- 型不整合
  - server 側で prisma generate、client/server を再起動

## ライセンス

Copyright © 2023 Stargazer Information. All rights reserved.

# アプリまとめ
最終更新: 2025-09-13

このアプリは、組織（グループ）単位でユーザーが日別の食事申込み（朝・昼・夕）を行い、月次の集計を確認できるフルスタックアプリです。認証には Clerk を用い、フロントエンドは React/TypeScript（Vite + Tailwind + shadcn/ui）、バックエンドは Express + Prisma で構成されています。

- フロントエンド: client/
- サーバー: server/
- 共有設定/ドキュメント: shared/, notes/

注意: 本まとめはチャットで共有された最新のコード断片を基にし、内部調査ノートの要点も取り込み済みです。

## 主なユースフロー
1. サインイン（Clerk）
2. 初回ユーザーは表示名（displayName）を設定（PATCH /api/me/display-name → DB: user_profiles に保存）
3. 所属組織の取得（GET /api/organizations/me）
   - 未所属なら GroupSetup で「新規作成」または「招待コードで参加」
   - 所属済みなら最後に選択した組織（isLastSelected）を使用
4. 食事申込み（MealApplicationTable）
   - 日付ごとに朝/昼/夕をトグル
   - 自分の月次申込みを取得/保存（GET /api/meals/self/monthly, POST /api/meals/self/bulk）
   - 月移動（MonthNavigator、month は 1-12）
5. グループ集計（GroupSummary）
   - 組織の月次人数サマリーを取得（GET /api/organizations/:organizationId/monthly-summary?year&month）

## フロントエンド（client）
- 基盤
  - 認証/ユーザー: @clerk/clerk-react（SignedIn/SignedOut/useUser/useAuth）
  - トークン付 API 呼び出し: fetchWithRefresh と apiUrl（client/src/api/index.ts）
    - API_BASE_URL は VITE_API_BASE_URL（未指定時 http://localhost:3001）
- 主要コンポーネント/画面
  - App.tsx
    - サインイン状態と displayName（DB保存）を確認
    - displayName 取得後に組織一覧をロード（GET /api/organizations/me）
    - GroupSetup/MealApplicationTable/GroupSummary を切り替え
  - MealApplicationTable
    - 月間の申込みを日×朝/昼/夕でトグル（POST /api/meals）
    - 自分の月次データの一括取得・保存（/api/meals/self/monthly, /api/meals/self/bulk）
  - GroupSummary
    - 組織の月次サマリー表示（/api/organizations/:id/monthly-summary）
  - GroupSetup
    - 組織の新規作成・招待コードでの参加
  - MonthNavigator
    - 年月の増減（month は 1-12）
- API クライアント
  - mealSignup.ts
    - fetchSelfMonthlyMealSignup(year, month, getToken, organizationId?)
    - saveSelfMonthlyMealSignup(monthlyMealSignup, year, month, organizationId, getToken)
  - monthlySummary.ts
    - fetchMonthlySummary({ id }, currentDate, getToken)
  - organizations.ts で組織関連 API、index.ts で apiUrl と fetchWithRefresh を集中管理
- 型
  - types/DailyData.ts: { day, breakfast, lunch, dinner }（それぞれ { count, users }）

## バックエンド（server）概要
- サーバー構成/運用補足
  - clerkMiddleware を全 API ルートの前に適用（server/src/app.ts）
  - CORS: CLIENT_URL（カンマ区切り複数可）を許可し、credentials: true
  - ヘルスチェック: GET /health（status/timestamp/service を返却）
  - Graceful shutdown: SIGINT/SIGTERM で Prisma を切断
- ルーティング（例）
  - /api/auth, /api/me, /api/meals, /api/organizations
- 認証
  - Clerk ミドルウェア + requireAuth でユーザー検証し、req.user に { id, email, name } を付与
- データモデル（Prisma: server/prisma/schema.prisma）
  - Organization（招待コード inviteCode）
  - OrganizationMembership（clerkId, role, isLastSelected）
  - MealSignup（clerkId, organizationId, date, breakfast/lunch/dinner）
    - 複合ユニークキー: (clerkId, organizationId, date)
  - UserProfile（clerkId, displayName）… 表示名のソース・オブ・トゥルース

## 主要 API（要点）
- 組織
  - GET /api/organizations/me: 自分の所属一覧 + lastSelectedOrganization
  - POST /api/organizations, POST /api/organizations/join
  - GET /api/organizations/:organizationId/monthly-summary?year&month: 組織の月次サマリー（日別の人数とユーザー名）
- 自分の申込み
  - GET /api/meals/self/monthly?year&month&organizationId: 自分の月次申込み（未登録日は false で初期化）
  - POST /api/meals/self/bulk: 月次申込みの一括 upsert
- 個別申込み
  - POST /api/meals: { date, breakfast, lunch, dinner, organizationId } を upsert（"YYYY-MM-DD" 送信）

## 実装上のポイント
- 月移動は 1-12 を維持し、年は適宜繰り上げ/下げ
- App.tsx は displayName（DB: user_profiles）取得後に組織一覧をロード
- fetchWithRefresh 経由で Authorization: Bearer <token> を一貫付与

## セットアップ/起動（ローカル開発）
- 環境変数（server）
  - DATABASE_URL（PostgreSQL）
  - CLERK_SECRET_KEY
  - CLIENT_URL（例: http://localhost:5173）
- 環境変数（client）
  - VITE_API_BASE_URL（既定: http://localhost:3001）
- Prisma マイグレーション
  - migrations に沿ってデータベースを作成・適用（deploy/migrate を使用）

## 改善アイデア（任意）
- 日付パース/タイムゾーン
  - "YYYY-MM-DD" を new Date(date) で直接パースすると環境で日付ずれの恐れ
  - 対策: "YYYY-MM-DD" を分解して new Date(y, m-1, d, 0, 0, 0, 0) を共通化
- 集計パフォーマンス
  - 月次サマリーは将来データ増に備え、DB 側の groupBy とインデックス（@@index([organizationId, date])）検討
- アクセシビリティ
  - 申込みセルを button 要素化、aria-pressed などの付与
- バリデーション
  - inviteCode/name の trim と長さ制限を API 層で一貫適用

## 参考
- 内部調査の要点は本ファイルに統合済みです

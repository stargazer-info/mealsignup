# アプリまとめ
最終更新: 2025-10-04

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
   - 日付ごとに朝/昼/夕をトグル（未申込→申込→弁当）して保存（POST /api/meals）
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
    - 月間の申込みを日×朝/昼/夕でトグル（未申込→申込→弁当）して保存（POST /api/meals）
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
  - types/DailyData.ts: { day, breakfast, lunch, dinner }（各 meal に normal/takeout の { count, users } を保持）

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
  - MealOrderType（id: "NONE
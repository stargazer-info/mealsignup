# アプリまとめ

このアプリは、組織（グループ）単位でユーザーが日別の食事申込み（朝・昼・夕）を行い、月次の集計を確認できるフルスタックアプリです。認証には Clerk を用い、フロントエンドは React/TypeScript（Vite + Tailwind + shadcn/ui）、バックエンドは Express + Prisma で構成されています。

- フロントエンド: client/
- サーバー: server/
- 共有設定/ドキュメント: shared/, notes/

注意: 本まとめはチャットで共有された最新ファイルを信頼ソースとして記載しています。

## 主なユースフロー
1. サインイン（Clerk）
2. 初回ユーザーは表示名（displayName）を設定（PATCH /api/me/display-name）
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
  - トークン付 API 呼び出し: fetchWithRefresh と apiUrl（client/src/api/index.ts 参照）
- 主要コンポーネント/画面
  - App.tsx
    - サインイン状態や displayName を確認し、GroupSetup/MealApplicationTable/GroupSummary を切り替え
    - 組織一覧・最終選択組織の取得（fetchUserOrganizations）
  - MealApplicationTable
    - 月間の申込みを日×朝/昼/夕でトグル
    - 自分の月次データの一括取得・保存（client/src/api/mealSignup.ts）
  - GroupSummary
    - 組織の月次サマリー表示（client/src/api/monthlySummary.ts）
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
  - organizations.ts（別ファイル）で組織関連 API、index.ts で apiUrl と fetchWithRefresh を集中管理
- 型
  - types/DailyData.ts: { day, breakfast, lunch, dinner }（人数やブール配列とのマッピングに使用）

## バックエンド（server）概要
- ルーティング（例）
  - /api/auth, /api/me, /api/meals, /api/organizations
- 認証
  - Clerk ミドルウェアでユーザーを検証し、req.user に { id, email, name } を付与
- データモデル（Prisma）
  - Organization（招待コード inviteCode）
  - OrganizationMembership（ユーザーの所属: clerkId, role, isLastSelected）
  - MealSignup（clerkId, organizationId, date, breakfast/lunch/dinner）
    - 複合ユニークキー: (clerkId, organizationId, date)

## 主要 API（要点）
- 組織
  - GET /api/organizations/me: 自分の所属と lastSelectedOrganization
  - POST /api/organizations, POST /api/organizations/join
  - GET /api/organizations/:organizationId/monthly-summary?year&month: 組織の月次サマリー（日別の人数）
- 自分の申込み
  - GET /api/meals/self/monthly?year&month&organizationId: 自分の月次申込み（全日分をブールで初期化）
  - POST /api/meals/self/bulk: 月次申込みの一括 upsert
- 個別申込み
  - POST /api/meals: { date, breakfast, lunch, dinner, organizationId } を upsert

## 実装上のポイント
- 月移動は 1-12 を維持し、年は適宜繰り上げ/下げ
- App.tsx では displayName（DB保管）取得後に組織一覧をロード
- fetchWithRefresh 経由で Authorization: Bearer <token> を一貫付与

## 改善アイデア（任意）
- 日付パース/タイムゾーン
  - "YYYY-MM-DD" を new Date(date) で直接パースすると環境で日付ずれの恐れ
  - 対策: "YYYY-MM-DD" を分解して new Date(y, m-1, d, 0, 0, 0, 0) を共通化
- 集計パフォーマンス
  - 月次サマリーは将来データ増に備え、DB 側の groupBy とインデックス（@@index([organizationId, date])）検討
- アクセシビリティ
  - 申込みセルを button 要素化、aria-pressed などの付与
- バリデーション
  -  inviteCode/name の trim と長さ制限を API 層で一貫適用

## 参考
- 詳細は notes/investigation-summary-2025-09-06.md を参照

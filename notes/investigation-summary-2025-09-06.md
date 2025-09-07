# 調査サマリー（2025-09-06）

本サマリーは、チャットで共有いただいたファイルのみを信頼ソースとして、フロントエンドとバックエンドの整合性・仕様確認を行った結果のまとめです。

対象ファイル（チャットで提供済み）
- フロントエンド
  - client/src/App.tsx
  - client/src/components/meal-application-table.tsx
  - client/src/components/group-setup.tsx
  - client/src/components/group-summary.tsx
  - client/src/components/month-navigator.tsx
  - client/src/api/index.ts
  - client/src/api/meals.ts
  - client/src/api/mealSignup.ts
  - client/src/api/organizations.ts
  - client/src/api/monthlySummary.ts
  - client/src/types/DailyData.ts
- バックエンド
  - server/src/app.ts
  - server/src/middleware/auth.ts
  - server/src/routes/meals.ts
  - server/src/routes/organizations.ts
  - server/src/routes/auth.ts
  - server/src/routes/me.ts
  - server/prisma/schema.prisma

## 1. リポジトリ概要
- 用途: 組織（グループ）内でユーザーが日別の食事申込み（朝/昼/夕）を行い、月次集計を参照できるフルスタックアプリ。
- 構成: モノレポ（client, server, shared）。認証は Clerk を利用。

## 2. フロントエンド要約と確認
- 技術: React + TypeScript + Vite + Tailwind（shadcn/ui）。
- 主な画面/機能:
  - MealApplicationTable: 月ごとの日付行で朝/昼/夕の申込をトグル。全申込/全解除（self/bulk）対応。MonthNavigatorで月移動。
  - GroupSetup: グループ新規作成（POST /api/organizations）、招待コード参加（POST /api/organizations/join）。
  - GroupSummary: 月次のグループ集計（GET /api/organizations/:id/monthly-summary）を表示。
  - App: サインイン → displayName 設定 → 組織一覧取得（GET /api/organizations/me）→ 初回は GroupSetup、それ以外は MealApplicationTable/GroupSummary を切替。
- API クライアント:
  - client/src/api/index.ts で API ベースURLと各エンドポイントを集中管理。
  - meals.ts, mealSignup.ts, organizations.ts, monthlySummary.ts が Authorization: Bearer <token> を付与して Fetch。
- 型:
  - client/src/types/DailyData.ts の { day, breakfast, lunch, dinner } は数値型で、GroupSummary の表示と server の monthly-summary レスポンスに一致。

整合性メモ
- MonthNavigator は month を 1-12 で扱っており、MealApplicationTable/GroupSummary と一致。
- MealApplicationTable → saveMealSignupApi は "YYYY-MM-DD" 形式の date を送信。server 側の POST /api/meals と連携。
- fetchSelfMonthlyMealSignup/self/bulk の I/F は server 側 /api/meals/self/* と合致。

## 3. バックエンド要約と確認
- server/src/app.ts:
  - helmet/cors/morgan/json の設定は妥当。
  - CORS origin は process.env.CLIENT_URL または http://localhost:5173。
  - clerkMiddleware を使用し、後続の requireAuth と連携。
  - ルーティング: /api/auth, /api/meals, /api/organizations, /api/me, /api/test（test は別途）。
- 認証（server/src/middleware/auth.ts）:
  - getAuth(req) で userId を取得し、clerkClient.users.getUser(userId) から req.user に { id, email, name } を付与。
  - optionalAuth も用意。エラーハンドリング妥当。
- データモデル（server/prisma/schema.prisma）:
  - Organization, OrganizationMembership, MealSignup。複合ユニークキー @@unique([clerkId, organizationId, date]) で upsert に対応。
  - OrganizationMembership.isLastSelected によりデフォルト組織の選択を表現。
  - onDelete: Cascade で組織削除時に関連を整理。

### 3.1 /api/organizations 系（server/src/routes/organizations.ts）
- GET /api/organizations/me:
  - ユーザーの membership を organization 同梱で取得し、{ organizations, lastSelectedOrganization } を返却。
  - client/src/api/organizations.ts の MyOrganizationsResponse に一致。
- POST /api/organizations:
  - name 必須、nanoid(8) の招待コードをユニーク生成。
  - トランザクションで Organization 作成 → 既存選択解除 → 自身の ADMIN membership を isLastSelected=true で作成。
- POST /api/organizations/join:
  - inviteCode から Organization を検索。
  - 既にメンバーの場合は 400。選択済み組織がなければ isLastSelected=true。
- GET /api/organizations/:organizationId:
  - 権限チェック（membership 必須）。
  - ADMIN の場合に限り全メンバー一覧を返却。memberCount も返す。
- GET /api/organizations/:organizationId/monthly-summary?year&month:
  - 組織メンバーシップを検証。
  - 対象月内の MealSignup を集計し、日毎に { breakfast, lunch, dinner } を集約して返却。
  - client/src/api/monthlySummary.ts と整合。DailyData は数値型で一致。
- POST /api/organizations/:organizationId/leave:
  - 最後のメンバーなら Organization を削除。そうでなければ明日以降の個人 MealSignup を削除し membership を削除。
- DELETE /api/organizations/:organizationId:
  - メンバー数が 1 超で 403。ユーザーがメンバーであることを確認し削除。

### 3.2 /api/meals 系（server/src/routes/meals.ts）
- GET /api/meals?date=YYYY-MM-DD | month=YYYY-MM:
  - organizationId 指定がなければ isLastSelected の組織を選択、なければ 400。
  - 指定組織のメンバーシップ必須（403）。
  - Clerk からユーザー情報をまとめ、各申込に user 情報を含めて返却。
- POST /api/meals:
  - { date, breakfast, lunch, dinner, organizationId } を受け取り、複合ユニークキーで upsert。
  - date は new Date(date) でパース。日付の 00:00:00 正規化は行っている（upsert where 側は 0:00:00, create 側は 0:00:00 で生成）。
- GET /api/meals/self/monthly:
  - ?year=&month=&organizationId= を受け取り、個人の対象月の全日について boolean 配列を返す（未登録日は false 初期化）。
  - Cache-Control: no-store を返却。
- POST /api/meals/self/bulk:
  - monthlyMealSignup 配列（day, breakfast, lunch, dinner）を upsert の配列でトランザクション処理。

### 3.3 /api/auth, /api/me
- /api/auth/me, /api/auth/select-organization/:organizationId は req.user と Prisma を用いて現在ユーザー情報や最終選択組織を返却・更新。client 側からの直接利用箇所は限定的だが仕様は妥当。
- /api/me/display-name (PATCH):
  - Clerk の public_metadata.displayName を更新。client/src/App.tsx から使用され、更新後に user.reload() を呼ぶ流れで整合。

## 4. フロント/バック間の整合性まとめ
- 認証ヘッダ: 全 API 呼び出しで Authorization: Bearer <token> を付与しており、requireAuth と一致。
- 組織:
  - GET /api/organizations/me の戻り値を App.tsx が消費し、lastSelectedOrganization or 先頭で groupData を構築 → MealApplicationTable/GroupSummary に渡す流れは一貫。
  - GroupSetup → create/join の API とも一致。エラー文言もユーザーフレンドリー。
- 月移動:
  - MonthNavigator は 1-12 で正しく増減。MealApplicationTable, GroupSummary と連動。
- サマリー:
  - client/src/api/monthlySummary.ts は year/month をリクエストし、{ year, month, dailyData } を返す server 実装と一致。
  - DailyData は数値で、GroupSummary 表示で合計（breakfast + lunch + dinner）を使用。
- 自分の月次:
  - fetchSelfMonthlyMealSignup, saveSelfMonthlyMealSignup と /api/meals/self/* は引数・戻り値とも一致し、MealApplicationTable のデータ構造にマッピングされている。

## 5. 既知の軽微なリスク/改善提案（任意）
1) タイムゾーン/日付パース
- POST /api/meals で date を new Date(date) でパースしているため、"YYYY-MM-DD" を UTC と解釈する環境では日付ずれのリスクがあります。
- 改善案: "YYYY-MM-DD" を split して new Date(y, m-1, d, 0, 0, 0, 0) で生成し、where/create 双方で同一ロジックを使用。

2) パフォーマンス（集計系）
- GET /api/organizations/:id/monthly-summary はアプリ側での集約処理。データ量が増えた場合、Prisma の groupBy（date 単位 + sum）で集計してから返すと効率的。
- meal_signups に (organizationId, date) のインデックスがあると月単位取得が高速化（Prisma の @@index で追加可能）。

3) UX/アクセシビリティ
- MealApplicationTable のセルは div クリックでトグル。ボタン要素や aria-pressed の付与でアクセシビリティを改善可能。

4) バリデーション
- server 側で inviteCode/name について更なる入力正規化（trim/長さ制限）を一貫して適用すると堅牢性が向上。

## 6. 現時点の結論
- クライアントとサーバーの主要エンドポイントは整合しており、基本動作は問題ない見込みです。
- 機能追加は不要。任意改善として「日付パースの厳密化」「集計の DB 側実行（将来的スケール対応）」を提案します。

## 7. 追加の確認が必要になった場合
- 本サマリーはチャット提供ファイルの内容に基づきます。その他の未共有ファイルの仕様変更がある場合は、当該ファイルをチャットに追加してください。

/**
 * 家族全体の食事予約数を管理する型。
 * この変更により、予約が0件の場合も0として返すことができ、予約件数を直接表示できます。
 */
export interface DailyData {
  day: number;
  breakfast: number;
  lunch: number;
  dinner: number;
}

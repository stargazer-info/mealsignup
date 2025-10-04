import { apiUrl, fetchWithRefresh } from './index';

export type MealOrderTypeId = "NONE" | "NORMAL" | "TAKEOUT";

export interface MonthlyMealSignupItem {
  day: number;
  breakfast: MealOrderTypeId;
  lunch: MealOrderTypeId;
  dinner: MealOrderTypeId;
}

// 自分の月次食事予約データを取得
export const fetchSelfMonthlyMealSignup = async (
  year: number,
  month: number,
  getToken: () => Promise<string | null>,
  organizationId?: string
): Promise<MonthlyMealSignupItem[]> => {
  const response = await fetchWithRefresh(apiUrl.mealSignup.selfMonthly(year, month, organizationId), {}, getToken);
  if (!response.ok) {
    throw new Error(`Error fetching self monthly meal signup: ${response.statusText}`);
  }
  const data = await response.json();
  return data as MonthlyMealSignupItem[];
};

// 自分の月次食事予約データを一括保存
export const saveSelfMonthlyMealSignup = async (
  monthlyMealSignup: MonthlyMealSignupItem[],
  year: number,
  month: number,
  organizationId: string,
  getToken: () => Promise<string | null>
) => {
  const response = await fetchWithRefresh(apiUrl.mealSignup.saveSelfMonthly(), {
    method: 'POST',
    body: JSON.stringify({
      monthlyMealSignup: monthlyMealSignup.map(item => ({
        day: item.day,
        breakfast: item.breakfast,
        lunch: item.lunch,
        dinner: item.dinner,
      })),
      year,
      month,
      organizationId,
    }),
  }, getToken);
  if (!response.ok) {
    throw new Error(`Error saving self monthly meal signup: ${response.statusText}`);
  }
  return response.json();
};

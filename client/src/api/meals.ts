import { apiUrl, fetchWithRefresh } from './index';
import type { MealOrderTypeId } from './mealSignup';

// 食事予約関連のAPI関数群

export const saveMealSignupApi = async (
  dateStr: string,
  mealSignup: { breakfast: MealOrderTypeId; lunch: MealOrderTypeId; dinner: MealOrderTypeId },
  organizationId: string,
  getToken: () => Promise<string | null>
) => {
  const response = await fetchWithRefresh(apiUrl.meals.save(), {
    method: 'POST',
    body: JSON.stringify({
      date: dateStr,
      breakfast: mealSignup.breakfast,
      lunch: mealSignup.lunch,
      dinner: mealSignup.dinner,
      organizationId,
    }),
  }, getToken);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }
  return response.json();
};

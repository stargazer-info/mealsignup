import { apiUrl } from './index';

// 食事予約関連のAPI関数群
export const fetchMealSignup = async (dateStr: string, token: string) => {
  const response = await fetch(apiUrl.meals.get(dateStr), {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Error fetching meal signup: ${response.statusText}`);
  }
  return response.json();
};

export const saveMealSignupApi = async (
  dateStr: string,
  mealSignup: { breakfast: boolean; lunch: boolean; dinner: boolean },
  organizationId: string,
  token: string
) => {
  const response = await fetch(apiUrl.meals.save(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      date: dateStr,
      breakfast: mealSignup.breakfast,
      lunch: mealSignup.lunch,
      dinner: mealSignup.dinner,
      organizationId,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }
  return response.json();
};

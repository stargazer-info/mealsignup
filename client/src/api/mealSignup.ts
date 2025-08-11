// 自分の月次食事予約データを取得
export const fetchSelfMonthlyMealSignup = async (year: number, month: number, token: string) => {
  const response = await fetch(
    `http://localhost:3001/api/meals/self/monthly?year=${year}&month=${month}`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );
  if (!response.ok) {
    throw new Error(`Error fetching self monthly meal signup: ${response.statusText}`);
  }
  return response.json();
};

// 自分の月次食事予約データを一括保存
export const saveSelfMonthlyMealSignup = async (
  monthlyMealSignup: any[],
  year: number,
  month: number,
  organizationId: string,
  token: string
) => {
  const response = await fetch('http://localhost:3001/api/meals/self/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      monthlyMealSignup: monthlyMealSignup.map(item => ({
        id: item.id, // 既存レコードの場合は id を渡す
        day: item.day, // デバッグ目的で残してもよい
        breakfast: item.breakfast,
        lunch: item.lunch,
        dinner: item.dinner,
      })),
      year,
      month,
      organizationId,
    }),
  });
  if (!response.ok) {
    throw new Error(`Error saving self monthly meal signup: ${response.statusText}`);
  }
  return response.json();
};

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
      monthlyMealSignup,
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

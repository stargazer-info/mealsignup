import type { DailyData } from '../types/DailyData';

interface MonthlySummaryResponse {
  year: number;
  month: number;
  dailyData: DailyData[];
}

export const fetchMonthlySummary = async (
  currentOrganization: { id: string },
  currentDate: Date,
  getToken: () => Promise<string>
): Promise<MonthlySummaryResponse> => {
  const token = await getToken();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1～12形式
  const url = `http://localhost:3001/api/organizations/${currentOrganization.id}/monthly-summary?year=${year}&month=${month}`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error('Error fetching monthly summary');
  }
  const data = await response.json();
  return { year: data.year, month: data.month, dailyData: data.dailyData };
};

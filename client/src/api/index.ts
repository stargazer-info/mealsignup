const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const buildApiUrl = (path: string) => {
  return `${API_BASE_URL}${path}`;
};

export const apiUrl = {
  organizations: {
    me: () => buildApiUrl('/api/organizations/me'),
    details: (id: string) => buildApiUrl(`/api/organizations/${id}`),
    create: () => buildApiUrl('/api/organizations'),
    join: () => buildApiUrl('/api/organizations/join'),
    leave: (id: string) => buildApiUrl(`/api/organizations/${id}/leave`),
    delete: (id: string) => buildApiUrl(`/api/organizations/${id}`),
    monthlySummary: (id: string, year: number, month: number) => buildApiUrl(`/api/organizations/${id}/monthly-summary?year=${year}&month=${month}`),
  },
  auth: {
    register: () => buildApiUrl('/api/auth/register'),
    me: () => buildApiUrl('/api/auth/me'),
    selectOrganization: (id: string) => buildApiUrl(`/api/auth/select-organization/${id}`),
  },
  meals: {
    get: (dateStr: string) => buildApiUrl(`/api/meals?date=${dateStr}`),
    save: () => buildApiUrl('/api/meals'),
  },
  mealSignup: {
    selfMonthly: (year: number, month: number, organizationId?: string) => buildApiUrl(`/api/meals/self/monthly?year=${year}&month=${month}${organizationId ? `&organizationId=${organizationId}` : ''}`),
    saveSelfMonthly: () => buildApiUrl('/api/meals/self/bulk'),
  },
  me: {
    updateDisplayName: () => buildApiUrl('/api/me/display-name'),
  }
};

export const fetchWithRefresh = async (url: string, options: RequestInit = {}, getToken: () => Promise<string | null>) => {
  let token = await getToken();
  if (!token) throw new Error('No token available');

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      if (response.status === 401) { // 認証エラー時リフレッシュ
        console.warn('Token may be expired, refreshing...');
        token = await getToken();
        headers['Authorization'] = `Bearer ${token}`;
        return fetch(url, { ...options, headers });
      }
      throw new Error(`API error: ${response.statusText}`);
    }
    return response;
  } catch (error) {
    throw error;
  }
};

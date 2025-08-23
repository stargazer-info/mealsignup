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
    delete: (id: string) => buildApiUrl(`/api/organizations/${id}`),
    monthlySummary: (id: string, year: number, month: number) => buildApiUrl(`/api/organizations/${id}/monthly-summary?year=${year}&month=${month}`),
  },
  auth: {
    register: () => buildApiUrl('/api/auth/register'),
    me: () => buildApiUrl('/api/auth/me'),
    selectOrganization: (id: string) => buildApiUrl(`/api/auth/select-organization/${id}`),
    leaveOrganization: () => buildApiUrl('/api/auth/leave-organization'),
  },
  meals: {
    get: (dateStr: string) => buildApiUrl(`/api/meals?date=${dateStr}`),
    save: () => buildApiUrl('/api/meals'),
  },
  mealSignup: {
    selfMonthly: (year: number, month: number) => buildApiUrl(`/api/meals/self/monthly?year=${year}&month=${month}`),
    saveSelfMonthly: () => buildApiUrl('/api/meals/self/bulk'),
  }
};

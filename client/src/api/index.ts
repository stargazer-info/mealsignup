// API関数群
export const fetchUserOrganizations = async (token: string) => {
  const response = await fetch('http://localhost:3001/api/organizations/me', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Error fetching organizations: ${response.statusText}`);
  }
  return response.json();
};

export const registerUserIfNeeded = async (token: string) => {
  const registerResponse = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!registerResponse.ok) {
    const err = await registerResponse.json();
    if (registerResponse.status === 400 && err.error === 'User already exists') {
      // ユーザーが既に存在する場合は正常とみなす
      return;
    }
    throw new Error(err.error);
  }
};

export const fetchMealSignup = async (dateStr: string, token: string) => {
  const response = await fetch(`http://localhost:3001/api/meals?date=${dateStr}`, {
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
  const response = await fetch('http://localhost:3001/api/meals', {
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

export const switchOrganizationApi = async (organizationId: string, token: string) => {
  const response = await fetch(`http://localhost:3001/api/organizations/select/${organizationId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Error switching organization: ${response.statusText}`);
  }
  return response.json();
};

// 組織関連のAPI関数群
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

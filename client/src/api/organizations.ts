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

export const fetchOrganizationDetails = async (organizationId: string, token: string) => {
  const response = await fetch(`http://localhost:3001/api/organizations/${organizationId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Error fetching organization details: ${response.statusText}`);
  }
  return response.json();
};

export const updateUserProfile = async (data: any, token: string) => {
  const response = await fetch('http://localhost:3001/api/auth/me', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Error updating user profile: ${response.statusText}`);
  }
  return response.json();
};

export const deleteOrganization = async (organizationId: string, token: string) => {
  const response = await fetch(`http://localhost:3001/api/organizations/${organizationId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Error deleting organization: ${response.statusText}`);
  }
  return response.json();
};

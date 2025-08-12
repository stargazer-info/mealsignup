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


export const fetchOrganizationDetails = async (organizationId: string, token: string) => {
  const response = await fetch(`http://localhost:3001/api/organizations/${organizationId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Error fetching organization details: ${response.statusText}`);
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

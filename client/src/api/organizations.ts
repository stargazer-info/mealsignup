// 組織関連のAPI関数群

export interface Organization {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationWithRole extends Organization {
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface MyOrganizationsResponse {
  organizations: OrganizationWithRole[];
  lastSelectedOrganization: OrganizationWithRole | null;
}

export const fetchUserOrganizations = async (token: string): Promise<MyOrganizationsResponse> => {
  const response = await fetch('http://localhost:3001/api/organizations/me', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Error fetching organizations: ${response.statusText}`);
  }
  return response.json() as Promise<MyOrganizationsResponse>;
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

export const createOrganization = async (name: string, token: string): Promise<Organization> => {
  const response = await fetch('http://localhost:3001/api/organizations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) { throw new Error('Failed to create organization'); }
  return response.json();
};

export const joinOrganization = async (inviteCode: string, token: string): Promise<{ organization: Organization }> => {
  const response = await fetch('http://localhost:3001/api/organizations/join', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inviteCode }),
  });
  if (!response.ok) { throw new Error('Failed to join organization'); }
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

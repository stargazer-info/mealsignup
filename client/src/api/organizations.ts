import { apiUrl } from './index';

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
  lastSelectedOrganization: Organization | null;
}

export const fetchUserOrganizations = async (token: string): Promise<MyOrganizationsResponse> => {
  const response = await fetch(apiUrl.organizations.me(), {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Error fetching organizations: ${response.statusText}`);
  }
  return response.json() as Promise<MyOrganizationsResponse>;
};


export const fetchOrganizationDetails = async (organizationId: string, token: string) => {
  const response = await fetch(apiUrl.organizations.details(organizationId), {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Error fetching organization details: ${response.statusText}`);
  }
  return response.json();
};

export const leaveOrganization = async (organizationId: string, token: string) => {
  const response = await fetch(apiUrl.organizations.leave(organizationId), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to leave organization');
  }
};


export const createOrganization = async (name: string, token: string): Promise<Organization> => {
  const response = await fetch(apiUrl.organizations.create(), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) { throw new Error('Failed to create organization'); }
  const data = await response.json();
  return data.organization as Organization;
};

export const joinOrganization = async (inviteCode: string, token: string): Promise<{ organization: Organization }> => {
  const response = await fetch(apiUrl.organizations.join(), {
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
  const response = await fetch(apiUrl.organizations.delete(organizationId), {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Error deleting organization: ${response.statusText}`);
  }
  return;
};

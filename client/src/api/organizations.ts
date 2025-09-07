import { apiUrl, fetchWithRefresh } from './index';

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

export const fetchUserOrganizations = async (getToken: () => Promise<string | null>): Promise<MyOrganizationsResponse> => {
  const response = await fetchWithRefresh(apiUrl.organizations.me(), {}, getToken);
  if (!response.ok) {
    throw new Error(`Error fetching organizations: ${response.statusText}`);
  }
  return response.json() as Promise<MyOrganizationsResponse>;
};


export const fetchOrganizationDetails = async (organizationId: string, getToken: () => Promise<string | null>) => {
  const response = await fetchWithRefresh(apiUrl.organizations.details(organizationId), {}, getToken);
  if (!response.ok) {
    throw new Error(`Error fetching organization details: ${response.statusText}`);
  }
  return response.json();
};

export const leaveOrganization = async (organizationId: string, getToken: () => Promise<string | null>) => {
  const response = await fetchWithRefresh(apiUrl.organizations.leave(organizationId), { method: 'POST' }, getToken);
  if (!response.ok) {
    throw new Error('Failed to leave organization');
  }
};


export const createOrganization = async (name: string, getToken: () => Promise<string | null>): Promise<Organization> => {
  const response = await fetchWithRefresh(apiUrl.organizations.create(), {
    method: 'POST',
    body: JSON.stringify({ name }),
  }, getToken);
  if (!response.ok) { throw new Error('Failed to create organization'); }
  const data = await response.json();
  return data.organization as Organization;
};

export const joinOrganization = async (inviteCode: string, getToken: () => Promise<string | null>): Promise<{ organization: Organization }> => {
  const response = await fetchWithRefresh(apiUrl.organizations.join(), {
    method: 'POST',
    body: JSON.stringify({ inviteCode }),
  }, getToken);
  if (!response.ok) { throw new Error('Failed to join organization'); }
  return response.json();
};

export const deleteOrganization = async (organizationId: string, getToken: () => Promise<string | null>) => {
  const response = await fetchWithRefresh(apiUrl.organizations.delete(organizationId), { method: 'DELETE' }, getToken);
  if (!response.ok) {
    throw new Error(`Error deleting organization: ${response.statusText}`);
  }
  return;
};

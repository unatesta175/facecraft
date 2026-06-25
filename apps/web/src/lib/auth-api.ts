import { apiRequest } from './api-client';
import type { DemoAccounts } from './kiosk-api';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  username: string;
  staffCode: string;
  role: string;
  status: string;
  deletePermission?: boolean;
  profileImageUrl?: string | null;
};

export function formatUserRole(role: string): string {
  return role
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

export function getUserInitials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'U'
  );
}

export const authApi = {
  getCurrentUser: () => apiRequest<AuthUser>('GET', '/api/v1/auth/me'),
  logout: () => apiRequest('POST', '/api/v1/auth/logout'),
  getDemoAccounts: () => apiRequest<DemoAccounts>('GET', '/api/v1/auth/demo-accounts'),
};

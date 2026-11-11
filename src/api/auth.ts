import { clearSession, refreshSession, request, setAccessToken, waitForRefresh } from './client';
import type { UserProfile } from '../types/roles';

export const getMe = () => request<UserProfile>('/users/me');
export const getSetupStatus = () => request<{ setupRequired: boolean }>('/setup/status', { authenticated: false });
export const createFirstOwner = (body: { name: string; email: string; password: string }) =>
  request<unknown>('/setup', { method: 'POST', body, authenticated: false });
export const updateMe = (body: { name?: string; email?: string; currentPassword?: string }) =>
  request<UserProfile>('/users/me', { method: 'PATCH', body });
export const changeOwnPassword = (body: { currentPassword: string; newPassword: string }) =>
  request<{ message: string }>('/users/me/password', { method: 'PATCH', body });

export async function login(email: string, password: string) {
  const result = await request<{ accessToken: string }>('/auth/login', {
    method: 'POST', body: { email, password }, authenticated: false,
  });
  setAccessToken(result.accessToken);
  try { return await getMe(); }
  catch (error) { clearSession(); throw error; }
}

export async function restoreSession() {
  await refreshSession();
  return getMe();
}

export async function logout() {
  await waitForRefresh();
  await request('/auth/logout', { method: 'POST', authenticated: false });
  clearSession();
}

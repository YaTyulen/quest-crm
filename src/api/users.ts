import { request } from './client';
import type { BusinessRole, SystemRole, UserProfile } from '../types/roles';
type UserSummary = Omit<UserProfile, 'businessRoles'>;
export async function getUsers(): Promise<UserProfile[]> {
  const users = await request<UserSummary[]>('/users');
  return Promise.all(users.map(async user => {
    const roles = await request<{ businessRoles: BusinessRole[] }>(`/users/${user.id}/business-roles`);
    return { ...user, businessRoles: roles.businessRoles };
  }));
}
export const createUser = (body: { name: string; email: string; password: string; systemRole: SystemRole }) =>
  request<UserSummary>('/users', { method: 'POST', body });
export const setSystemRole = (id: number, systemRole: SystemRole) =>
  request(`/users/${id}/system-role`, { method: 'PATCH', body: { systemRole } });
export const setUserActivity = (id: number, isActive: boolean) =>
  request(`/users/${id}/activity`, { method: 'PATCH', body: { isActive } });
export interface QuestAssignment { questId: number; roles: BusinessRole[]; }
export const replaceUserQuests = (id: number, assignments: QuestAssignment[]) =>
  request(`/users/${id}/quests`, { method: 'PUT', body: { assignments } });
export interface QuestStaff { id: number; name: string; roles: BusinessRole[]; }
export const getQuestStaff = (questId: number) => request<QuestStaff[]>(`/quests/${questId}/staff`);

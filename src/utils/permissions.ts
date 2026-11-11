import type { SystemRole } from '../types/roles';

export const systemRoleLabels: Record<SystemRole, string> = {
  OWNER: 'Владелец', ADMIN: 'Администратор', USER: 'Сотрудник',
};

export const canManage = (role: SystemRole | undefined) => role === 'OWNER' || role === 'ADMIN';

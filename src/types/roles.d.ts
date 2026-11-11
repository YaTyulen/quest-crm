export type Role = 'admin' | 'actor' | 'operator';
export type SystemRole = 'OWNER' | 'ADMIN' | 'USER';
export type BusinessRole = 'OPERATOR' | 'ACTOR';
export interface UserProfile {
  id: number;
  email: string;
  name: string;
  systemRole: SystemRole;
  businessRoles: BusinessRole[];
  createdAt: string;
  isActive: boolean;
}

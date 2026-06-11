export type Role = 'admin' | 'actor' | 'operator';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  isActive: boolean;
  vkId?: string;
  createdAt: import('firebase/firestore').Timestamp;
}

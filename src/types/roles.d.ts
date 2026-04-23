export type Role = 'admin' | 'actor' | 'operator';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  vkId?: string;
  createdAt: import('firebase/firestore').Timestamp;
}

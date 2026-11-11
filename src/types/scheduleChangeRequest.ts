import type { Role } from './roles';

export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ScheduleChangeRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  date: string; // YYYY-MM-DD
  requestedAvailability: { [time: string]: boolean };
  currentAvailability: { [time: string]: boolean };
  status: ChangeRequestStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

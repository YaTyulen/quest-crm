import type { Role } from './roles';

export interface ScheduleSlot {
  time: string;
  isAvailable: boolean;
}

export interface DaySchedule {
  [time: string]: boolean;
}

export interface UserSchedule {
  userId: string;
  userName: string;
  userEmail: string;
  availability: {
    [date: string]: DaySchedule;
  };
  updatedAt: string | Date;
  isActive: boolean;
  role?: Role;
  firstFilledAt?: { [date: string]: string | Date };
}

export interface AvailabilityInfo {
  userId: string;
  userName: string;
  isAvailable: boolean;
}

// Тип для данных из API (без id)
export type UserScheduleData = Omit<UserSchedule, 'id'>;

// Тип для создания нового расписания
export interface CreateScheduleData {
  userId: string;
  userName: string;
  userEmail: string;
  availability: {
    [date: string]: DaySchedule;
  };
  isActive?: boolean;
}

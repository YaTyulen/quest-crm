import { request } from './client';
import type { Quest } from './quests';
import type { Booking } from './bookings';
import type { QuestAssignment } from './users';

export interface AvailabilitySlot { slotId: number; time: string; order: number; canWork: boolean | null; }
export interface AvailabilityDay { date: string; slots: AvailabilitySlot[]; }
export interface MyAvailability { quest: Pick<Quest, 'id' | 'title'>; days: AvailabilityDay[]; }
export const getUserQuests = (userId: number) => request<{ quests: Quest[]; assignments: QuestAssignment[] }>(`/users/${userId}/quests`);
export const getScheduleSettings = () => request<{ availabilityHorizonDays: number }>('/settings');
export const getMyAvailability = (questId: number, from: string, to: string) => {
  const query = new URLSearchParams({ questId: String(questId), from, to });
  return request<MyAvailability>(`/availability/me?${query}`);
};
export const saveMyAvailability = (item: { questId: number; slotId: number; date: string; canWork: boolean }) =>
  request<{ saved: number }>('/availability/me', { method: 'PUT', body: { items: [item] } });

export interface OverviewUser { id: number; name: string; }
export interface OverviewRole {
  available: number; unavailable: number; needed: number; ok: boolean;
  availableUsers: OverviewUser[]; unavailableUsers: OverviewUser[];
}
export interface OverviewSlot {
  slotId: number; time: string; order: number; operators: OverviewRole; actors: OverviewRole;
  availabilityStatus: 'covered' | 'understaffed' | 'empty' | 'declined';
  slotStatus: 'open' | 'closed_manual' | 'closed_auto' | 'booked';
  closedReason?: string;
  booking: (Pick<Booking, 'id' | 'status'> & {
    operator: OverviewUser | null;
    actor: OverviewUser | null;
  }) | null;
}
export interface OverviewDay { date: string; missingUsers: OverviewUser[]; slots: OverviewSlot[]; }
export interface AvailabilityOverview { quest: Pick<Quest, 'id' | 'title'>; days: OverviewDay[]; }
export const getAvailabilityOverview = (questId: number, from: string, to: string) => {
  const query = new URLSearchParams({ questId: String(questId), from, to });
  return request<AvailabilityOverview>(`/availability/overview?${query}`);
};

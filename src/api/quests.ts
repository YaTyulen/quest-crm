import { request } from './client';

export interface Quest {
  id: number;
  title: string;
  description: string | null;
  createdAt: string;
  operatorsNeeded: number;
  actorsNeeded: number;
}
export const getQuests = () => request<Quest[]>('/quests');
export const createQuest = (body: { title: string; description?: string }) =>
  request<Quest>('/quests', { method: 'POST', body });

export type QuestSettings = Pick<Quest, 'title' | 'description' | 'operatorsNeeded' | 'actorsNeeded'>;
export const updateQuestSettings = (id: number, body: QuestSettings) =>
  request<Quest>(`/quests/${id}`, { method: 'PUT', body });

export interface QuestSlots {
  quest: Pick<Quest, 'id' | 'title'>;
  slots: import('./slots').SlotTemplate[];
}
export const getQuestSlots = (questId: number) => request<QuestSlots>(`/quests/${questId}/slots`);
export const replaceQuestSlots = (questId: number, slotIds: number[]) =>
  request<QuestSlots>(`/quests/${questId}/slots`, { method: 'PUT', body: { slotIds } });

export interface SlotPrice {
  dayOfWeek: number;
  price: number;
}

interface QuestSlotPrices {
  questId: number;
  slotId: number;
  prices: SlotPrice[];
}

const pricesPath = (questId: number, slotId: number) => `/quests/${questId}/slots/${slotId}/prices`;
export const getQuestSlotPrices = (questId: number, slotId: number) =>
  request<QuestSlotPrices>(pricesPath(questId, slotId));
export const replaceQuestSlotPrices = (questId: number, slotId: number, prices: SlotPrice[]) =>
  request<QuestSlotPrices>(pricesPath(questId, slotId), { method: 'PUT', body: { prices } });

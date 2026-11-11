import { request } from './client';

export const closeQuestSlot = (questId: number, body: { slotId: number; date: string; reason?: string }) =>
  request<{ id: number; reason: string | null }>(`/quests/${questId}/closures`, { method: 'POST', body });

export const getQuestSlotClosures = (questId: number, date: string) => {
  const query = new URLSearchParams({ from: date, to: date });
  return request<{ id: number; slotId: number }[]>(`/quests/${questId}/closures?${query}`);
};

export const removeQuestSlotClosure = (questId: number, closureId: number) =>
  request<{ message: string }>(`/quests/${questId}/closures/${closureId}`, { method: 'DELETE' });

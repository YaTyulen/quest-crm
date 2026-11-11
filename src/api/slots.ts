import { request } from './client';

export interface SlotTemplate {
  id: number;
  time: string;
  order: number;
  isActive: boolean;
}
export const getSlots = () => request<SlotTemplate[]>('/slots');
export const createSlot = (body: { time: string; order: number; isActive: boolean }) =>
  request<SlotTemplate>('/slots', { method: 'POST', body });

export const updateSlot = (slotId: number, body: Partial<Pick<SlotTemplate, 'time' | 'order' | 'isActive'>>) =>
  request<SlotTemplate>(`/slots/${slotId}`, { method: 'PUT', body });

export const deleteSlot = (slotId: number) => request(`/slots/${slotId}`, { method: 'DELETE' });

import type { SlotTemplate } from '../../api/slots';
export const sortSlots = (slots: SlotTemplate[]) => [...slots].sort((a, b) => a.time.localeCompare(b.time));
export const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Не удалось выполнить запрос';

import type { Client } from '../types/client';
export const useClientsData = () => ({
  upcoming: [] as Client[], completed: [] as Client[], loading: false,
  deleteClient: async (_clientId: string): Promise<void> => {
    throw new Error('API записей на игры пока недоступен');
  },
});

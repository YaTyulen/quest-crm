export interface Client {
  id: string;
  name: string;
  phone: string;
  quest: string;
  data: string;
  count: number;
  piece: number;
  isCash: string;
  note: string;
};

export type ChartType = 'bar' | 'pie' | 'line';
export type ChartDataCategory = 'count' | 'piece' | 'revenue' | 'clientsByQuest';
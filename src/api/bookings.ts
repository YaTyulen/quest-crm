import { request } from './client';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type PaymentMethod = 'CASH' | 'QR' | 'TRANSFER';

export interface Booking {
  id: number;
  date: string;
  createdAt: string;
  status: BookingStatus;
  clientName: string;
  clientPhone: string;
  playersCount: number;
  quest: { id: number; title: string };
  slot: { id: number; time: string };
  operator: { id: number; name: string; isActive: boolean } | null;
  actor: { id: number; name: string; isActive: boolean } | null;
  prepaymentAmount: number | null;
  prepaymentMethod: PaymentMethod;
  actualPlayersCount: number | null;
  onSiteAmount: number | null;
  onSitePaymentMethod: PaymentMethod | null;
}

export const getBookings = () => request<Booking[]>('/bookings');

export type ManualBookingInput = Pick<BookingDetails, 'clientName' | 'clientPhone' | 'playersCount' | 'clientEmail' | 'comment'>
  & { questId: number; slotId: number; date: string };
export const createManualBooking = (body: ManualBookingInput) =>
  request<Pick<Booking, 'id' | 'date' | 'status' | 'slot'>>('/bookings', { method: 'POST', body: { ...body, source: 'MANUAL' } });

export interface BookingDetails extends Booking {
  clientEmail: string | null;
  comment: string | null;
  price: number | null;
}

export const getBooking = (id: number) => request<BookingDetails>(`/bookings/${id}`);

export type BookingUpdate = Pick<BookingDetails, 'clientName' | 'clientPhone' | 'clientEmail' | 'playersCount' | 'comment' | 'status' | 'price'
  | 'prepaymentAmount' | 'prepaymentMethod' | 'actualPlayersCount' | 'onSiteAmount' | 'onSitePaymentMethod'>;
export type BookingMove = { date: string; slotId: number; questId?: number };
export const updateBooking = (id: number, body: Partial<BookingUpdate> & { move?: BookingMove }) =>
  request<BookingDetails>(`/bookings/${id}`, { method: 'PUT', body });
export const assignBookingStaff = (id: number, body: { operatorId?: number | null; actorId?: number | null }) =>
  request<BookingDetails>(`/bookings/${id}/staff`, { method: 'PATCH', body });

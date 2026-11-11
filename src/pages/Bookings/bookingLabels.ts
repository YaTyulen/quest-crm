import type { Booking, BookingStatus, PaymentMethod } from '../../api/bookings';
import type { OverviewSlot } from '../../api/availability';

export const bookingStatuses: Record<BookingStatus, string> = {
  PENDING: 'Ожидает подтверждения',
  CONFIRMED: 'Подтверждена',
  CANCELLED: 'Отменена',
  COMPLETED: 'Завершена',
};

export const paymentMethods: Record<PaymentMethod, string> = {
  TRANSFER: 'Переводом',
  CASH: 'Наличными',
  QR: 'По QR-коду',
};

export function hasBookingResults(booking: Pick<Booking, 'actualPlayersCount' | 'onSiteAmount' | 'onSitePaymentMethod'>) {
  return booking.actualPlayersCount != null && booking.onSiteAmount != null
    && (booking.onSiteAmount === 0 || booking.onSitePaymentMethod != null);
}

export function bookingHasElapsed(booking: Pick<Booking, 'date' | 'slot'>, today: string, time: string) {
  const date = booking.date.slice(0, 10);
  return date < today || (date === today && booking.slot.time <= time);
}

export const slotStatuses: Record<OverviewSlot['slotStatus'], string> = {
  open: 'Свободно',
  booked: 'Забронировано',
  closed_manual: 'Закрыто вручную',
  closed_auto: 'Закрыто автоматически',
};

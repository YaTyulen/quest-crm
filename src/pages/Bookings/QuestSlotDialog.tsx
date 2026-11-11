import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { OverviewSlot } from '../../api/availability';
import { getBooking, type BookingDetails } from '../../api/bookings';
import { closeQuestSlot, getQuestSlotClosures, removeQuestSlotClosure } from '../../api/slotClosures';
import { dateValue } from '../../hooks/useSchedulePeriod';
import { bookingStatuses, slotStatuses } from './bookingLabels';
import Pencil from '../../assets/pencil.svg';

interface Props {
  questId: number;
  date: string;
  slot: OverviewSlot;
  isAdmin: boolean;
  onDismiss: () => void;
  onSlotClosed: (reason: string | null) => void;
  onClosureRemoved: () => void;
  onAddBooking?: () => void;
  onEditBooking?: (id: number) => void;
}

const dateLabel = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
const priceLabel = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });

export function QuestSlotDialog({ questId, date, slot, isAdmin, onDismiss, onSlotClosed, onClosureRemoved, onAddBooking, onEditBooking }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState<BookingDetails | null>(null);
  const bookingId = slot.booking?.id;
  const [loading, setLoading] = useState(isAdmin && bookingId !== undefined);
  const [attempt, setAttempt] = useState(0);
  const booking = details ?? slot.booking;
  const canClose = isAdmin && slot.slotStatus === 'open' && !booking;
  const canOpen = isAdmin && slot.slotStatus === 'closed_manual';

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  useEffect(() => {
    if (!isAdmin || bookingId === undefined) return;
    let active = true;
    setLoading(true);
    setError('');
    getBooking(bookingId).then(result => { if (active) setDetails(result); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Не удалось загрузить бронь.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAdmin, bookingId, attempt]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if ((!canClose && !canOpen) || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setError('');
    try {
      if (canOpen) {
        const closures = await getQuestSlotClosures(questId, date);
        const closure = closures.find(item => item.slotId === slot.slotId);
        if (closure) await removeQuestSlotClosure(questId, closure.id);
        onClosureRemoved();
      } else {
        const result = await closeQuestSlot(questId, { date, slotId: slot.slotId });
        onSlotClosed(result.reason);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : canOpen ? 'Не удалось открыть слот.' : 'Не удалось закрыть слот.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return <dialog ref={dialog} className="booking-page__dialog" aria-labelledby="quest-slot-title"
    onClick={event => {
      if (event.target === event.currentTarget && !submitting.current) {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onDismiss();
      }
    }}
    onCancel={event => { event.preventDefault(); if (!submitting.current) onDismiss(); }}>
    <div className="booking-page__dialog-body">
      <div className="booking-page__dialog-heading">
        <h2 id="quest-slot-title">{booking ? `Бронирование №${booking.id}` : 'Слот квеста'}</h2>
        <div className="booking-page__dialog-heading-actions">
          {isAdmin && bookingId !== undefined && onEditBooking && <button type="button" className="booking-page__dialog-dismiss"
            aria-label="Редактировать бронь" title="Редактировать бронь" disabled={saving}
            onClick={() => onEditBooking(bookingId)}><Pencil aria-hidden="true" /></button>}
          <button type="button" className="booking-page__dialog-dismiss" aria-label="Закрыть окно" title="Закрыть окно" disabled={saving} onClick={onDismiss}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>
      <p>{dateLabel.format(dateValue(date))}, {slot.time} · {slotStatuses[slot.slotStatus]}</p>
      {slot.slotStatus === 'closed_auto'
        ? <p>Не хватает доступных сотрудников нужных ролей. Слот откроется автоматически, когда команда будет укомплектована.</p>
        : slot.closedReason && <p>Причина закрытия: {slot.closedReason}</p>}
      {booking && <dl className="booking-page__details">
        <dt>Статус</dt><dd>{bookingStatuses[booking.status]}</dd>
        <dt>Оператор</dt><dd>{booking.operator?.name ?? 'Не назначен'}</dd>
        <dt>Актёр</dt><dd>{booking.actor?.name ?? 'Не назначен'}</dd>
        {isAdmin && details && <>
          <dt>Клиент</dt><dd>{details.clientName}</dd>
          <dt>Телефон</dt><dd>{details.clientPhone}</dd>
          {details.clientEmail && <><dt>Email</dt><dd>{details.clientEmail}</dd></>}
          <dt>Игроков</dt><dd>{details.playersCount}</dd>
          {details.price != null && <><dt>Стоимость</dt><dd>{priceLabel.format(details.price)}</dd></>}
          {details.comment && <><dt>Комментарий</dt><dd>{details.comment}</dd></>}
        </>}
      </dl>}
      {loading && <p role="status">Загружаем детали брони…</p>}
      {error && <p role="alert">{error}</p>}
      {(canClose || canOpen || (bookingId !== undefined && error)) && <form className="booking-page__toolbar" onSubmit={submit}>
        {canClose && onAddBooking && <button type="button" disabled={saving} onClick={onAddBooking}>Добавить бронь</button>}
        {canClose && <button type="submit" className="booking-page__action--close" disabled={saving}>{saving ? 'Закрываем…' : 'Закрыть слот'}</button>}
        {canOpen && <button type="submit" className="booking-page__action--open" disabled={saving}>{saving ? 'Открываем…' : 'Открыть слот'}</button>}
        {error && !canOpen && bookingId !== undefined && <button type="button" onClick={() => setAttempt(value => value + 1)}>Повторить загрузку</button>}
      </form>}
    </div>
  </dialog>;
}

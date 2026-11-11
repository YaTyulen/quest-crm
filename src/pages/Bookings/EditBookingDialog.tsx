import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { assignBookingStaff, getBooking, updateBooking, type BookingDetails, type BookingStatus, type BookingUpdate, type PaymentMethod } from '../../api/bookings';
import { getAvailabilityOverview, type OverviewSlot } from '../../api/availability';
import { bookingHasElapsed, bookingStatuses, hasBookingResults, paymentMethods } from './bookingLabels';
import { BookingMoveForm } from './BookingMoveForm';

const message = (reason: unknown) => reason instanceof Error ? reason.message : 'Не удалось выполнить запрос.';
const arrivalDate = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });

function BookingForm({ booking, saving, today, time, onSave }: {
  booking: BookingDetails; saving: boolean; today: string; time: string; onSave: (changes: Partial<BookingUpdate>) => void;
}) {
  const past = bookingHasElapsed(booking, today, time);
  const [onSite, setOnSite] = useState(String(booking.onSiteAmount ?? ''));
  const canComplete = past && (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED' || hasBookingResults(booking));
  const allowedStatuses = Object.entries(bookingStatuses).filter(([value]) => value === booking.status || value !== 'COMPLETED' || canComplete);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? '').trim();
    const amount = (key: string) => value(key) === '' ? null : Number(value(key));
    const values: Partial<BookingUpdate> = {
      clientName: value('clientName'), clientPhone: value('clientPhone'), clientEmail: value('clientEmail') || null,
      playersCount: Number(value('playersCount')), comment: value('comment') || null, status: value('status') as BookingStatus,
      price: amount('price'),
      prepaymentAmount: amount('prepaymentAmount'),
      prepaymentMethod: value('prepaymentMethod') as PaymentMethod,
      ...(past ? {
        actualPlayersCount: amount('actualPlayersCount'),
        onSiteAmount: amount('onSiteAmount'),
        onSitePaymentMethod: (value('onSitePaymentMethod') || null) as PaymentMethod | null,
      } : {}),
    };
    const changes = Object.fromEntries(Object.entries(values).filter(([key, value]) => value !== booking[key as keyof BookingUpdate]));
    if (Object.keys(changes).length) onSave(changes);
  };
  return <form className="booking-page__dialog-body booking-page__edit booking-page__section" onSubmit={submit}>
    <h3>Клиент и бронь</h3>
    <fieldset disabled={saving}>
      <label>Имя клиента<input name="clientName" defaultValue={booking.clientName} required pattern=".*\S.*" /></label>
      <label>Телефон<input type="tel" name="clientPhone" defaultValue={booking.clientPhone} required pattern="\s*\S.{3,}\S\s*" /></label>
      <label>Email<input type="email" name="clientEmail" defaultValue={booking.clientEmail ?? ''} /></label>
      <label>Количество игроков<input type="number" name="playersCount" min={1} max={2147483647} step={1} defaultValue={booking.playersCount} required /></label>
      <label className="booking-page__field-accent">Цена, ₽<input name="price" type="number" min={0} max={2147483647} step={1} defaultValue={booking.price ?? ''} /></label>
      <label className="booking-page__field-accent">Статус<select key={booking.status} name="status" defaultValue={booking.status}>
        {allowedStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label>Комментарий<textarea name="comment" rows={3} defaultValue={booking.comment ?? ''} /></label>
    </fieldset>
    <fieldset disabled={saving}>
      <legend>Предоплата</legend>
      <label>Предоплата, ₽<input name="prepaymentAmount" type="number" min={0} max={2147483647} step={1} defaultValue={booking.prepaymentAmount ?? ''} /></label>
      <label>Способ предоплаты<select name="prepaymentMethod" defaultValue={booking.prepaymentMethod ?? 'TRANSFER'}>
        {Object.entries(paymentMethods).map(([method, label]) => <option key={method} value={method}>{label}</option>)}
      </select></label>
    </fieldset>
    {past && <fieldset disabled={saving}>
      <legend>Итоги игры</legend>
      <label>Фактическое количество участников<input name="actualPlayersCount" type="number" min={0} max={2147483647} step={1} defaultValue={booking.actualPlayersCount ?? ''} /></label>
      <label>Заплатили на месте, ₽<input name="onSiteAmount" type="number" min={0} max={2147483647} step={1} value={onSite} onChange={event => setOnSite(event.target.value)} /></label>
      <label>Способ оплаты на месте<select name="onSitePaymentMethod" defaultValue={booking.onSitePaymentMethod ?? ''} disabled={!(Number(onSite) > 0)} required={Number(onSite) > 0}>
        <option value="">Выберите способ</option>
        {Object.entries(paymentMethods).map(([method, label]) => <option key={method} value={method}>{label}</option>)}
      </select></label>
    </fieldset>}
    <div className="booking-page__toolbar"><button disabled={saving} type="submit">Сохранить бронь</button></div>
  </form>;
}

export function EditBookingDialog({ id, today, time, onDismiss, onSaved }: {
  id: number; today: string; time: string; onDismiss: () => void; onSaved: (booking: BookingDetails) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [staffSlot, setStaffSlot] = useState<OverviewSlot | null>(null);
  const questId = booking?.quest.id;
  const bookingDate = booking?.date.slice(0, 10);
  const slotId = booking?.slot.id;
  const [loadError, setLoadError] = useState('');
  const [staffError, setStaffError] = useState('');
  const [staffLoading, setStaffLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [staffAttempt, setStaffAttempt] = useState(0);
  const [staffDraft, setStaffDraft] = useState<Partial<Record<'operator' | 'actor', string>>>({});
  const [formRevision, setFormRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  useEffect(() => {
    let active = true;
    setLoadError('');
    getBooking(id).then(result => { if (active) setBooking(result); })
      .catch(reason => { if (active) setLoadError(message(reason)); });
    return () => { active = false; };
  }, [id, attempt]);
  useEffect(() => {
    if (questId === undefined || !bookingDate || slotId === undefined) return;
    let active = true;
    setStaffError('');
    setStaffLoading(true);
    setStaffSlot(null);
    getAvailabilityOverview(questId, bookingDate, bookingDate).then(result => {
      const slot = result.days.find(day => day.date === bookingDate)?.slots.find(item => item.slotId === slotId);
      if (!slot) throw new Error('Не удалось найти доступность сотрудников для этого слота.');
      if (active) setStaffSlot(slot);
    })
      .catch(reason => { if (active) setStaffError(message(reason)); })
      .finally(() => { if (active) setStaffLoading(false); });
    return () => { active = false; };
  }, [staffAttempt, questId, bookingDate, slotId]);

  const save = async (operation: () => Promise<BookingDetails>, success: string, syncFields?: () => void) => {
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setSaveError('');
    setNotice('');
    try {
      const updated = await operation();
      setBooking(updated);
      syncFields?.();
      onSaved(updated);
      setNotice(success);
    } catch (reason) {
      setSaveError(reason instanceof ApiError && reason.status === 409
        ? 'Не удалось сохранить: выбранный слот занят или закрыт. Проверьте доступность и попробуйте снова.'
        : message(reason));
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  const saveStaff = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!booking || staffLoading || staffError) return;
    const operatorId = staffDraft.operator === undefined ? booking.operator?.id ?? null : Number(staffDraft.operator) || null;
    const actorId = staffDraft.actor === undefined ? booking.actor?.id ?? null : Number(staffDraft.actor) || null;
    if (operatorId !== null && operatorId === actorId) {
      setNotice('');
      setSaveError('Выберите разных сотрудников на роли оператора и актёра.');
      return;
    }
    const changes = {
      ...(operatorId !== (booking.operator?.id ?? null) ? { operatorId } : {}),
      ...(actorId !== (booking.actor?.id ?? null) ? { actorId } : {}),
    };
    if (Object.keys(changes).length) void save(() => assignBookingStaff(id, changes), 'Назначения сохранены.', () => setStaffDraft({}));
  };

  return <dialog ref={dialog} className="booking-page__dialog booking-page__dialog--edit" aria-labelledby="edit-booking-title"
    onCancel={event => { event.preventDefault(); if (!submitting.current) onDismiss(); }}>
    <div className="booking-page__dialog-body">
      <div className="booking-page__dialog-heading">
        <div>
          <h2 id="edit-booking-title">Бронирование №{id}</h2>
          {booking && <p className="booking-page__arrival">Бронь поступила: <time dateTime={booking.createdAt}>{arrivalDate.format(new Date(booking.createdAt))}</time></p>}
        </div>
        <button type="button" className="booking-page__dialog-dismiss" aria-label="Закрыть окно" disabled={saving} onClick={onDismiss}>
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className="booking-page__dialog-content">
      {loadError ? <div className="booking-page__toolbar"><p role="alert">{loadError}</p>
        <button type="button" onClick={() => setAttempt(value => value + 1)}>Повторить загрузку</button>
      </div> : !booking ? <p role="status">Загружаем бронь…</p> : <>
        <BookingMoveForm key={`${booking.quest.id}:${booking.date}:${booking.slot.id}`} booking={booking} saving={saving}
          onMove={move => void save(() => updateBooking(id, { move }), 'Игра перенесена.', () => setStaffDraft({}))} />
        <BookingForm key={formRevision} booking={booking} saving={saving} today={today} time={time}
          onSave={changes => void save(() => updateBooking(id, changes), 'Бронь сохранена.', () => setFormRevision(value => value + 1))} />
        {booking.status === 'CANCELLED' ? <p>Назначения можно изменить после восстановления брони.</p>
          : <form className="booking-page__dialog-body booking-page__edit booking-page__section" onSubmit={saveStaff}>
            <fieldset disabled={saving || staffLoading || Boolean(staffError)}>
              <legend>Сотрудники</legend>
              {([{ name: 'operator', role: 'OPERATOR', label: 'Оператор' }, { name: 'actor', role: 'ACTOR', label: 'Актёр' }] as const).map(({ name, role, label }) => {
                const assigned = booking[name];
                const eligible = (role === 'OPERATOR' ? staffSlot?.operators.availableUsers : staffSlot?.actors.availableUsers) ?? [];
                return <label key={name}>{label}<select name={name} value={staffDraft[name] ?? (assigned ? String(assigned.id) : '')}
                  onChange={event => { const value = event.target.value; setStaffDraft(previous => ({ ...previous, [name]: value })); }}>
                  <option value="">Не назначен</option>
                  {assigned && !eligible.some(user => user.id === assigned.id) && <option value={assigned.id} disabled>{assigned.name} (недоступен)</option>}
                  {eligible.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select></label>;
              })}
            </fieldset>
            <div className="booking-page__toolbar">
              {staffError ? <button type="button" onClick={() => setStaffAttempt(value => value + 1)}>Повторить загрузку сотрудников</button>
                : <button type="submit" disabled={saving || staffLoading}>{staffLoading ? 'Загружаем сотрудников…' : 'Сохранить назначения'}</button>}
            </div>
            {staffError && <p role="alert">{staffError}</p>}
          </form>}
        {saving && <p role="status">Сохраняем…</p>}
        {saveError && <p role="alert">{saveError}</p>}
        {notice && <p role="status">{notice}</p>}
      </>}
      </div>
    </div>
  </dialog>;
}

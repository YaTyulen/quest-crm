import { useEffect, useRef, useState } from 'react';
import { getAvailabilityOverview, type OverviewSlot } from '../../api/availability';
import { createManualBooking, type Booking } from '../../api/bookings';
import { ApiError } from '../../api/client';
import { getQuestSlots, type Quest } from '../../api/quests';
import { monthAhead } from '../../hooks/useSchedulePeriod';

export function CreateBookingDialog({ quests, today, time, initialQuest, initialDate, initialSlotId, onClose, onCreated }: {
  quests: Quest[]; today: string; time: string; initialQuest: number | ''; onClose: () => void;
  initialDate?: string; initialSlotId?: number;
  onCreated: (booking: Pick<Booking, 'id' | 'date' | 'status' | 'slot'>) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const [questId, setQuestId] = useState<number | ''>(initialQuest);
  const [date, setDate] = useState(initialDate ?? today);
  const [slotId, setSlotId] = useState(initialSlotId === undefined ? '' : String(initialSlotId));
  const [result, setResult] = useState<{ key: string; slots: OverviewSlot[]; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const max = monthAhead(today);
  const valid = questId !== '' && date >= today && date <= max;
  const key = `${questId}:${date}`;
  const day = result?.key === key ? result : null;
  const slots = (day?.slots ?? []).filter(slot => date !== today || slot.time > time);
  const selected = slots.find(slot => String(slot.slotId) === slotId);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  useEffect(() => {
    if (!valid) return;
    let active = true;
    Promise.all([getAvailabilityOverview(questId, date, date), getQuestSlots(questId)]).then(([overview, assigned]) => {
      const day = overview.days.find(item => item.date === date);
      if (!day || day.slots.some(slot => !slot.slotStatus)) throw new Error('Сервер не вернул состояния слотов на выбранную дату.');
      const activeIds = new Set(assigned.slots.filter(slot => slot.isActive).map(slot => slot.id));
      const slots = day.slots.filter(slot => activeIds.has(slot.slotId) && slot.slotStatus === 'open' && !slot.booking)
        .sort((a, b) => a.time.localeCompare(b.time));
      if (active) setResult({ key, slots });
    }).catch(reason => {
      if (active) setResult({ key, slots: [], error: reason instanceof Error ? reason.message : 'Не удалось загрузить слоты.' });
    });
    return () => { active = false; };
  }, [questId, date, key, valid, attempt]);

  return <dialog ref={dialog} className="booking-page__dialog booking-page__dialog--edit" aria-labelledby="manual-booking-title"
    onCancel={event => { event.preventDefault(); if (!submitting.current) onClose(); }}>
    <div className="booking-page__dialog-body">
      <div className="booking-page__dialog-heading">
        <h2 id="manual-booking-title">Новая бронь</h2>
        <button type="button" className="booking-page__dialog-dismiss" aria-label="Закрыть окно" disabled={saving} onClick={onClose}><span aria-hidden="true">×</span></button>
      </div>
      <div className="booking-page__dialog-content">
      {quests.length ? <form className="booking-page__dialog-body booking-page__edit" onSubmit={async event => {
        event.preventDefault();
        if (!valid || !selected || submitting.current) return;
        const form = new FormData(event.currentTarget);
        const value = (name: string) => String(form.get(name) ?? '').trim();
        if (!value('name') || value('phone').length < 5) {
          setSaveError('Укажите имя клиента и телефон длиной не менее 5 символов.');
          return;
        }
        submitting.current = true; setSaving(true); setSaveError('');
        try {
          onCreated(await createManualBooking({
            questId, date, slotId: selected.slotId, clientName: value('name'), clientPhone: value('phone'),
            clientEmail: value('email') || null, playersCount: Number(value('players')), comment: value('comment') || null,
          }));
        } catch (reason) {
          if (reason instanceof ApiError && reason.status === 409) {
            setSaveError('Слот больше недоступен. Выберите другое время.');
            setSlotId(''); setResult(null); setAttempt(value => value + 1);
          } else setSaveError(reason instanceof Error ? reason.message : 'Не удалось создать бронь.');
        } finally { submitting.current = false; setSaving(false); }
      }}>
        <fieldset className="booking-page__section" disabled={saving}>
          <legend>Квест и время</legend>
          <label className="booking-page__quest-field">Квест<select required value={questId} onChange={event => {
            setQuestId(event.target.value ? Number(event.target.value) : ''); setResult(null); setSlotId(''); setSaveError('');
          }}><option value="">Выберите квест</option>
            {quests.map(quest => <option key={quest.id} value={quest.id}>{quest.title}</option>)}
          </select></label>
          <label>Дата<input type="date" min={today} max={max} required value={date} onChange={event => {
            setDate(event.target.value); setResult(null); setSlotId(''); setSaveError('');
          }} /></label>
          <label>Свободное время<select required value={selected ? slotId : ''} disabled={!valid || !slots.length} onChange={event => setSlotId(event.target.value)}>
            <option value="">{valid && !day ? 'Загружаем…' : 'Выберите время'}</option>
            {slots.map(slot => <option key={slot.slotId} value={slot.slotId}>{slot.time}</option>)}
          </select></label>
        </fieldset>
        {valid && day && !day.error && !slots.length && <p>На эту дату нет свободных слотов.</p>}
        {valid && day?.error && <div className="booking-page__toolbar"><p role="alert">{day.error}</p>
          <button type="button" onClick={() => { setResult(null); setAttempt(value => value + 1); }}>Повторить загрузку</button></div>}
        <fieldset className="booking-page__section" disabled={saving}>
          <legend>Данные клиента</legend>
          <label>Имя<input name="name" required /></label>
          <label>Телефон<input type="tel" name="phone" required minLength={5} /></label>
          <label>Электронная почта<input type="email" name="email" /></label>
          <label>Количество игроков<input type="number" name="players" min={1} max={2147483647} step={1} defaultValue={1} required /></label>
          <label>Комментарий<textarea name="comment" rows={3} /></label>
        </fieldset>
        {saveError && <p role="alert">{saveError}</p>}
        <div className="booking-page__toolbar"><button type="submit" disabled={saving || !valid || !selected}>{saving ? 'Создаём…' : 'Создать бронь'}</button></div>
      </form> : <p>Нет доступных квестов. Обновите список или добавьте квест.</p>}
      </div>
    </div>
  </dialog>;
}

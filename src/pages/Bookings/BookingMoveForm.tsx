import { useEffect, useState } from 'react';
import { getAvailabilityOverview, type OverviewSlot } from '../../api/availability';
import type { BookingDetails, BookingMove } from '../../api/bookings';
import { getQuests, getQuestSlots, type Quest } from '../../api/quests';
import { monthAhead, useScheduleToday } from '../../hooks/useSchedulePeriod';

export function BookingMoveForm({ booking, saving, onMove }: {
  booking: BookingDetails; saving: boolean; onMove: (move: BookingMove) => void;
}) {
  const today = useScheduleToday();
  const max = monthAhead(today);
  const currentDate = booking.date.slice(0, 10);
  const currentSlot = booking.slot.id;
  const [questId, setQuestId] = useState(booking.quest.id);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questError, setQuestError] = useState('');
  const [date, setDate] = useState(currentDate);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [result, setResult] = useState<{ date: string; questId: number; slots: OverviewSlot[]; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const validDate = date >= today && date <= max;
  const changingQuest = questId !== booking.quest.id;
  const sameDayAndQuest = !changingQuest && date === currentDate;
  const day = result?.date === date && result.questId === questId ? result : null;
  const matching = changingQuest ? day?.slots.find(slot => slot.time === booking.slot.time) : undefined;
  const value = slotId ?? (matching ? String(matching.slotId) : sameDayAndQuest ? String(currentSlot) : '');
  const selected = day?.slots.find(slot => String(slot.slotId) === value);

  useEffect(() => {
    let active = true;
    setQuestError('');
    getQuests().then(items => { if (active) setQuests(items); })
      .catch(() => { if (active) setQuestError('Не удалось загрузить список квестов.'); });
    return () => { active = false; };
  }, [attempt]);

  useEffect(() => {
    if (!validDate) return;
    let active = true;
    Promise.all([getAvailabilityOverview(questId, date, date), getQuestSlots(questId)]).then(([overview, assigned]) => {
      if (!active) return;
      const day = overview.days.find(day => day.date === date);
      if (!day || day.slots.some(slot => !slot.slotStatus)) throw new Error('Сервер не вернул доступные слоты.');
      const activeIds = new Set(assigned.slots.filter(slot => slot.isActive).map(slot => slot.id));
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const slots = day.slots.filter(slot => activeIds.has(slot.slotId) && slot.slotStatus === 'open' && !slot.booking
        && (date !== today || slot.time > time)
        && (!sameDayAndQuest || slot.slotId !== currentSlot))
        .sort((a, b) => a.time.localeCompare(b.time));
      setResult({ date, questId, slots });
    }).catch(reason => {
      if (active) setResult({ date, questId, slots: [], error: reason instanceof Error ? reason.message : 'Не удалось загрузить слоты.' });
    });
    return () => { active = false; };
  }, [questId, date, today, validDate, sameDayAndQuest, currentSlot, attempt]);

  return <section className="booking-page__section booking-page__move">
    <h3>Перенести игру</h3>
    <form className="booking-page__dialog-body booking-page__edit" onSubmit={event => {
      event.preventDefault();
      if (validDate && selected && !saving) onMove({ questId, date, slotId: selected.slotId });
    }}>
      <fieldset disabled={saving}>
        <label className="booking-page__quest-field">Квест<select value={questId} onChange={event => {
          const target = Number(event.target.value);
          if (target !== questId) { setQuestId(target); setDate(currentDate); setSlotId(null); setResult(null); }
        }}>
          {!quests.some(quest => quest.id === booking.quest.id) && <option value={booking.quest.id}>{booking.quest.title}</option>}
          {quests.map(quest => <option key={quest.id} value={quest.id}>{quest.title}</option>)}
        </select></label>
        <label>Дата<input type="date" min={today} max={max} required value={date} readOnly={changingQuest} onChange={event => {
          setDate(event.target.value); setSlotId(''); setResult(null);
        }} /></label>
        <label>Время<select required value={value} disabled={!validDate || !day?.slots.length} onChange={event => setSlotId(event.target.value)}>
          {!sameDayAndQuest && <option value="">{validDate && !day ? 'Загружаем…' : 'Выберите время'}</option>}
          {sameDayAndQuest && <option value={currentSlot}>{booking.slot.time} (текущее)</option>}
          {day?.slots.map(slot => <option key={slot.slotId} value={slot.slotId}>{slot.time}</option>)}
        </select></label>
      </fieldset>
      {validDate && !day && <p role="status">Загружаем слоты…</p>}
      {validDate && day && !day.error && !day.slots.length && <p>На эту дату нет свободных слотов.</p>}
      {changingQuest && validDate && day && !day.error && day.slots.length > 0 && !matching && <p>Прежнее время недоступно. Выберите другое время на ту же дату.</p>}
      {changingQuest && !validDate && <p>Дата игры вне доступного периода. Сначала выберите новую дату в текущем квесте.</p>}
      {validDate && day?.error && <p role="alert">{day.error}</p>}
      {questError && <p role="alert">{questError}</p>}
      <div className="booking-page__toolbar">
        {(day?.error || questError) && <button type="button" disabled={saving} onClick={() => { setResult(null); setAttempt(value => value + 1); }}>Повторить загрузку</button>}
        <button type="submit" disabled={saving || !validDate || !selected}>Подтвердить перенос</button>
      </div>
    </form>
  </section>;
}

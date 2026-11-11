import { useEffect, useState } from 'react';
import { getAvailabilityOverview, getUserQuests, type OverviewDay, type OverviewSlot } from '../../api/availability';
import { getQuests, getQuestSlots, type Quest } from '../../api/quests';
import { dateValue, monthAhead, useBookingClock } from '../../hooks/useSchedulePeriod';
import { useAuth } from '../../hooks/useAuth';
import { QuestSlotDialog } from './QuestSlotDialog';
import { CreateBookingDialog } from './CreateBookingDialog';
import { EditBookingDialog } from './EditBookingDialog';
import { slotStatuses as labels } from './bookingLabels';
import { canManage } from '../../utils/permissions';
import './BookingPages.scss';

const dayLabel = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
const shortDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

function QuestMonth({ quest, from, to, time }: { quest: Quest; from: string; to: string; time: string }) {
  const { user } = useAuth();
  const questId = quest.id;
  const [days, setDays] = useState<OverviewDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<{ date: string; slot: OverviewSlot } | null>(null);
  const [bookingSlot, setBookingSlot] = useState<{ date: string; slotId: number } | null>(null);
  const [editBookingId, setEditBookingId] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([getAvailabilityOverview(questId, from, to), getQuestSlots(questId)]).then(([overview, assigned]) => {
      if (!active) return;
      const activeSlots = new Set(assigned.slots.filter(slot => slot.isActive).map(slot => slot.id));
      const result = overview.days.map(day => ({
        ...day,
        slots: day.slots.filter(slot => activeSlots.has(slot.slotId))
          .sort((a, b) => a.time.localeCompare(b.time)),
      }));
      if (result.some(day => day.slots.some(slot => !Object.hasOwn(labels, slot.slotStatus)))) {
        throw new Error('Сервер не вернул состояния слотов. Проверьте, что запущена версия API с бронированиями.');
      }
      setDays(result);
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Не удалось загрузить сетку квеста.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [questId, from, to, attempt]);

  const handleSlotClosed = (reason: string | null) => {
    if (!selected) return;
    setDays(previous => previous.map(day => day.date !== selected.date ? day : {
      ...day,
      slots: day.slots.map(slot => slot.slotId !== selected.slot.slotId ? slot : {
        ...slot, slotStatus: 'closed_manual', closedReason: reason ?? undefined,
      }),
    }));
    setSelected(null);
  };

  const handleClosureRemoved = () => {
    setSelected(null);
    setAttempt(value => value + 1);
  };

  return <section aria-label="Слоты квеста по дням">
    <div className="booking-page__toolbar">
      <p>{shortDate.format(dateValue(from))} — {shortDate.format(dateValue(to))}</p>
      <button type="button" disabled={loading} onClick={() => setAttempt(value => value + 1)}>{error ? 'Повторить загрузку' : 'Обновить'}</button>
    </div>
    {loading ? <p role="status">Загружаем слоты…</p> : error ? <p role="alert">{error}</p>
      : !days.some(day => day.slots.length) ? <p>У квеста нет активных слотов.</p>
      : <div className="booking-page__days">
        {days.map(day => <section className="booking-page__day" key={day.date}>
          <h2><time dateTime={day.date}>{day.date === from ? 'Сегодня, ' : ''}{dayLabel.format(dateValue(day.date))}</time></h2>
          {day.slots.length === 0 ? <p>На этот день нет слотов.</p>
            : <ul className="booking-page__slots">{day.slots.map(slot => <li key={slot.slotId}>
              <button type="button" className={`booking-page__slot booking-page__slot--${slot.slotStatus}`}
                aria-haspopup="dialog" onClick={() => setSelected({ date: day.date, slot })}>
                <strong>{slot.time}</strong>
                <span>{labels[slot.slotStatus]}</span>
                {slot.booking && slot.slotStatus !== 'booked' && <span className="booking-page__badge booking-page__badge--confirmed">Есть бронь</span>}
              </button>
            </li>)}</ul>}
        </section>)}
      </div>}
    {selected && <QuestSlotDialog questId={questId} date={selected.date} slot={selected.slot}
      isAdmin={canManage(user?.systemRole)} onDismiss={() => setSelected(null)} onSlotClosed={handleSlotClosed} onClosureRemoved={handleClosureRemoved}
      onEditBooking={id => { setSelected(null); setEditBookingId(id); }}
      onAddBooking={selected.date > from || (selected.date === from && selected.slot.time > time) ? () => {
        setBookingSlot({ date: selected.date, slotId: selected.slot.slotId }); setSelected(null);
      } : undefined} />}
    {bookingSlot && <CreateBookingDialog quests={[quest]} today={from} time={time} initialQuest={questId}
      initialDate={bookingSlot.date} initialSlotId={bookingSlot.slotId} onClose={() => setBookingSlot(null)}
      onCreated={() => { setBookingSlot(null); setAttempt(value => value + 1); }} />}
    {editBookingId !== null && <EditBookingDialog id={editBookingId} today={from} time={time}
      onDismiss={() => setEditBookingId(null)} onSaved={() => setAttempt(value => value + 1)} />}
  </section>;
}

export default function QuestGridPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const managesQuests = canManage(user?.systemRole);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questId, setQuestId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const { today, time } = useBookingClock();
  const quest = quests.find(item => item.id === questId);

  useEffect(() => {
    if (userId === undefined) return;
    let active = true;
    setLoading(true);
    setError('');
    (managesQuests ? getQuests() : getUserQuests(userId).then(result => result.quests)).then(result => {
      if (!active) return;
      setQuests(result);
      setQuestId(result[0]?.id ?? null);
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Не удалось загрузить квесты.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt, userId, managesQuests]);

  return <main className="booking-page">
    <h1>Сетка квеста</h1>
    <p className="booking-page__subtitle">Свободные, забронированные и закрытые слоты на месяц вперёд.</p>
    {loading ? <p role="status">Загружаем квесты…</p> : error ? <div className="booking-page__toolbar">
      <p role="alert">{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Повторить загрузку</button>
    </div> : questId === null ? <p>{managesQuests ? 'Квестов пока нет.' : 'Вы пока не назначены ни на один квест.'}</p> : <>
      <div className="booking-page__toolbar">
        <label>Квест
          <select value={questId} onChange={event => setQuestId(Number(event.target.value))}>
            {quests.map(quest => <option value={quest.id} key={quest.id}>{quest.title}</option>)}
          </select>
        </label>
      </div>
      {quest && <QuestMonth key={`${quest.id}:${today}`} quest={quest} from={today} to={monthAhead(today)} time={time} />}
    </>}
  </main>;
}

import { useEffect, useState } from 'react';
import { getBookings, type Booking, type BookingStatus } from '../../api/bookings';
import { getQuests, type Quest } from '../../api/quests';
import { dateValue, useBookingClock } from '../../hooks/useSchedulePeriod';
import { bookingHasElapsed, bookingStatuses as statuses, hasBookingResults, paymentMethods } from './bookingLabels';
import { EditBookingDialog } from './EditBookingDialog';
import { CreateBookingDialog } from './CreateBookingDialog';
import './BookingPages.scss';

const gameDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
const rubles = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });

function Prepayment({ booking }: { booking: Booking }) {
  const amount = booking.prepaymentAmount ?? 0;
  return <div className="booking-page__marks">
    <span className={`booking-page__badge booking-page__staffing-badge booking-page__staffing-badge--${amount > 0 ? 'ready' : 'missing'}`}>
      <span aria-hidden="true">{amount > 0 ? '✓' : '!'}</span>
      {amount > 0 ? 'Внесена' : 'Не внесена'}
    </span>
    {amount > 0 && <span className="booking-page__staff-muted">{rubles.format(amount)} · {paymentMethods[booking.prepaymentMethod]}</span>}
  </div>;
}

function Staffing({ booking, quest, loading }: { booking: Booking; quest?: Quest; loading: boolean }) {
  if (booking.status === 'CANCELLED') return <span className="booking-page__staff-muted">—</span>;
  if (loading) return <span className="booking-page__staff-muted">Проверяем…</span>;
  if (quest?.operatorsNeeded == null || quest.actorsNeeded == null) {
    return <span className="booking-page__staff-muted">Нет данных</span>;
  }
  const operators = booking.operator?.isActive ? 1 : 0;
  const actors = booking.actor?.isActive ? 1 : 0;
  const staffed = operators >= quest.operatorsNeeded && actors >= quest.actorsNeeded;
  return <div className="booking-page__staffing">
    <span className={`booking-page__badge booking-page__staffing-badge booking-page__staffing-badge--${staffed ? 'ready' : 'missing'}`}>
      <span aria-hidden="true">{staffed ? '✓' : '!'}</span>
      {staffed ? 'Команда собрана' : 'Сотрудники не назначены'}
    </span>
    <span className="booking-page__staff-muted">Операторы {operators}/{quest.operatorsNeeded} · Актёры {actors}/{quest.actorsNeeded}</span>
  </div>;
}

export default function BookingsPage() {
  const { today, time } = useBookingClock();
  const [period, setPeriod] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(true);
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [questFilter, setQuestFilter] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'arrival' | 'game'>('arrival');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getBookings().then(result => {
      if (active) setBookings(result);
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Не удалось загрузить бронирования.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt, today]);
  useEffect(() => {
    let active = true;
    setQuestsLoading(true);
    getQuests().then(result => { if (active) setQuests(result); })
      .catch(() => { if (active) setQuests([]); })
      .finally(() => { if (active) setQuestsLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  const questsById = new Map(quests.map(quest => [quest.id, quest]));
  const questOptions = [...new Map([...bookings.map(booking => booking.quest), ...quests]
    .map(quest => [quest.id, quest.title])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], 'ru'));
  const isPast = (booking: Pick<Booking, 'date' | 'slot'>) => bookingHasElapsed(booking, today, time);
  const upcoming = bookings.filter(booking => !isPast(booking));
  const past = bookings.filter(isPast);
  const options = Object.entries(statuses).filter(([value]) => period === 'past' || value !== 'COMPLETED');
  const visible = (period === 'past' ? past : upcoming).filter(booking =>
    (!status || booking.status === status) && (questFilter === '' || booking.quest.id === questFilter))
    .sort((a, b) => {
      const byGame = sortBy === 'game'
        ? a.date.slice(0, 10).localeCompare(b.date.slice(0, 10)) || a.slot.time.localeCompare(b.slot.time)
        : 0;
      return byGame || b.createdAt.localeCompare(a.createdAt) || b.id - a.id;
    });
  return <main className="booking-page">
    <header className="booking-page__page-heading"><h1>Бронирования</h1>
      <div className="booking-page__toolbar"><button type="button" aria-haspopup="dialog" disabled={questsLoading}
        onClick={() => { setNotice(''); setCreating(true); }}>+ Добавить бронь</button></div>
    </header>
    <p className="booking-page__subtitle">Предстоящие и прошедшие бронирования.</p>
    <div className="booking-page__filters">
      <div className="booking-page__period" role="group" aria-label="Период бронирований">
        <button type="button" aria-pressed={period === 'upcoming'} onClick={() => { setPeriod('upcoming'); setStatus(''); }}>Предстоящие</button>
        <button type="button" aria-pressed={period === 'past'} onClick={() => { setPeriod('past'); setStatus(''); }}>Прошедшие</button>
      </div>
      <div className="booking-page__toolbar">
        <label>Квест
          <select value={questFilter} onChange={event => setQuestFilter(event.target.value === '' ? '' : Number(event.target.value))}>
            <option value="">Все квесты</option>
            {questOptions.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
          </select>
        </label>
        <label>Статус
          <select value={status} onChange={event => setStatus(event.target.value as BookingStatus | '')}>
            <option value="">Все статусы</option>
            {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>Сортировка
          <select value={sortBy} onChange={event => setSortBy(event.target.value === 'game' ? 'game' : 'arrival')}>
            <option value="arrival">Новые брони сначала</option>
            <option value="game">По дате и времени игры</option>
          </select>
        </label>
        <button type="button" disabled={loading} onClick={() => setAttempt(value => value + 1)}>{error ? 'Повторить загрузку' : 'Обновить'}</button>
      </div>
    </div>
    {notice && <p role="status">{notice}</p>}
    {loading ? <p role="status">Загружаем бронирования…</p> : error ? <p role="alert">{error}</p>
      : visible.length === 0 ? <p>{status || questFilter !== '' ? 'По выбранным фильтрам броней нет.' : period === 'past' ? 'Прошедших броней пока нет.' : 'Предстоящих броней пока нет.'}</p>
      : <div className="booking-page__table-wrap" tabIndex={0} role="region" aria-label="Список бронирований">
        <table className="booking-page__table">
          <thead><tr>
            {['Квест', 'Дата и время игры', 'Клиент', 'Игроков', 'Статус'].map(label => <th key={label} scope="col">{label}</th>)}
            {period === 'upcoming' && <th scope="col">Предоплата</th>}
            {period === 'upcoming' && <th scope="col">Команда</th>}
            {period === 'past' && <th scope="col">Итоги</th>}
          </tr></thead>
          <tbody>{visible.map(booking => <tr key={booking.id}
            className={`booking-page__booking-row${period === 'past' && booking.status !== 'CANCELLED' && !hasBookingResults(booking) ? ' booking-page__booking-row--missing-results' : ''}`}
            onClick={() => setSelectedId(booking.id)}>
            <th scope="row"><button type="button" className="booking-page__booking-link" aria-haspopup="dialog"
              aria-label={`Открыть бронь: ${booking.quest.title}, ${booking.clientName}, ${gameDate.format(dateValue(booking.date.slice(0, 10)))}, ${booking.slot.time}`}
              onClick={event => { event.stopPropagation(); setSelectedId(booking.id); }}>{booking.quest.title}</button></th>
            <td><time dateTime={booking.date.slice(0, 10)}>{gameDate.format(dateValue(booking.date.slice(0, 10)))}</time>, {booking.slot.time}</td>
            <td>{booking.clientName}<br />{booking.clientPhone}</td>
            <td>{booking.playersCount}</td>
            <td><span className={`booking-page__badge booking-page__badge--${booking.status.toLowerCase()}`}>{statuses[booking.status]}</span></td>
            {period === 'upcoming' && <td><Prepayment booking={booking} /></td>}
            {period === 'upcoming' && <td><Staffing booking={booking} quest={questsById.get(booking.quest.id)} loading={questsLoading} /></td>}
            {period === 'past' && <td>{booking.status === 'CANCELLED'
              ? <span className="booking-page__staff-muted">—</span>
              : hasBookingResults(booking)
                ? <span className="booking-page__staff-muted">Заполнены</span>
                : <span className="booking-page__badge booking-page__badge--pending"><span aria-hidden="true">! </span>Не заполнены</span>}
            </td>}
          </tr>)}</tbody>
        </table>
      </div>}
    {selectedId !== null && <EditBookingDialog key={selectedId} id={selectedId} today={today} time={time}
      onDismiss={() => setSelectedId(null)}
      onSaved={updated => setBookings(previous => previous.map(item => item.id === updated.id ? updated : item))} />}
    {creating && <CreateBookingDialog quests={quests} today={today} time={time}
      initialQuest={quests.some(quest => quest.id === questFilter) ? questFilter : quests.length === 1 ? quests[0].id : ''}
      onClose={() => setCreating(false)} onCreated={booking => {
        setCreating(false); setPeriod(isPast(booking) ? 'past' : 'upcoming'); setQuestFilter(''); setStatus('');
        setNotice(`Бронь №${booking.id} создана.`); setAttempt(value => value + 1);
      }} />}
  </main>;
}

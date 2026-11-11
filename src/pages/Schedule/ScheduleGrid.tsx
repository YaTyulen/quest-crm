import { useEffect, useRef, useState } from 'react';
import { getQuests, getQuestSlots, type Quest } from '../../api/quests';
import { getScheduleSettings, getAvailabilityOverview, getMyAvailability, getUserQuests, saveMyAvailability, type OverviewDay, type OverviewUser, type OverviewSlot } from '../../api/availability';
import { useAuth } from '../../hooks/useAuth';
import { canManage } from '../../utils/permissions';
import { dateValue, makeDates, useBookingClock } from '../../hooks/useSchedulePeriod';
import '../../components/MySchedule/MySchedule.scss';
import './ScheduleGrid.scss';

const message = (error: unknown) => error instanceof Error ? error.message : 'Не удалось загрузить расписание';
const uniqueUsers = (users: OverviewUser[]) => [...new Map(users.map(user => [user.id, user])).values()];
const questImage = 'https://images.pexels.com/photos/18301295/pexels-photo-18301295.jpeg?auto=compress&cs=tinysrgb&w=1200';
const personalLabel = (value: boolean | null) => value === null ? 'Не отмечено' : value ? 'Могу' : 'Не могу';
const personName = (user: OverviewUser, userId: number) => user.id === userId ? `${user.name} (вы)` : user.name;

const Slot = ({ slot, date, questId, userId, mark, saving, pending, onToggle }: {
  slot: OverviewSlot; date: string; questId: number; userId: number; mark: boolean | null | undefined;
  saving: boolean; pending: boolean; onToggle: () => void;
}) => {
  const [showUnavailable, setShowUnavailable] = useState(false);
  const roles = [{ label: 'Операторы', data: slot.operators }, { label: 'Актёры', data: slot.actors }]
    .filter(({ data }) => data.needed > 0);
  const available = uniqueUsers(roles.flatMap(({ data }) => data.availableUsers));
  const unavailable = uniqueUsers(roles.flatMap(({ data }) => data.unavailableUsers));
  const tooltipId = `unavailable-${questId}-${date}-${slot.slotId}`;
  const missing = roles.filter(({ data }) => data.availableUsers.length < data.needed);
  const needed = roles.reduce((total, { data }) => total + data.needed, 0);
  const enough = roles.length > 0 && missing.length === 0 && available.length >= needed;
  const coverage = enough ? 'Людей достаточно' : missing.length === 2 ? 'Не хватает людей в обеих ролях'
    : missing.length === 1 ? (missing[0].label === 'Операторы' ? 'Не хватает операторов' : 'Не хватает актёров')
      : 'Не хватает отдельных людей на роли';
  return <article className={`schedule-grid__slot${enough ? ' schedule-grid__slot--available' : ''}`} aria-label={`Слот ${slot.time}`}>
    <div className="schedule-grid__slot-heading"><h3><time>{slot.time}</time></h3>
      {unavailable.length > 0 && <span className={`schedule-grid__tooltip${showUnavailable ? ' schedule-grid__tooltip--open' : ''}`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setShowUnavailable(false); }}>
        <button type="button" className="schedule-grid__unavailable" aria-describedby={tooltipId}
          aria-expanded={showUnavailable} aria-controls={tooltipId} onClick={() => setShowUnavailable(value => !value)} onKeyDown={event => { if (event.key === 'Escape') setShowUnavailable(false); }}
          aria-label={`Не могут: ${unavailable.length}`}>−{unavailable.length}</button>
        <span id={tooltipId} role="tooltip" className="schedule-grid__tooltip-content">Не могут: {unavailable.map(user => personName(user, userId)).join(', ')}</span>
      </span>}
    </div>
    {roles.length > 0 && <p className={`schedule-grid__coverage${enough ? ' schedule-grid__coverage--enough' : ''}`}>{coverage}</p>}
    {roles.map(({ label, data }) => <div className="schedule-grid__role" key={label}>
      <strong>{label} <span>{data.availableUsers.length}/{data.needed}</span></strong>
      {data.availableUsers.length ? <ul className="schedule-grid__names">
        {data.availableUsers.map(user => <li key={user.id}>{personName(user, userId)}</li>)}
      </ul> : <span className="schedule-grid__empty">Пока никто не может</span>}
    </div>)}
    {mark !== undefined && <button type="button" disabled={saving} aria-busy={pending}
      className={`schedule-grid__personal schedule-grid__personal--${mark === null ? 'unknown' : mark ? 'yes' : 'no'}`}
      aria-label={`${slot.time}. Моя доступность: ${personalLabel(mark)}. Отметить «${personalLabel(mark !== true)}»`} onClick={onToggle}>
      <span>Моя доступность</span><strong>{pending ? 'Сохраняем…' : personalLabel(mark)}</strong>
    </button>}
  </article>;
};

function overviewDay(days: OverviewDay[], date: string, activeSlots: Set<number>) {
  const day = days.find(item => item.date === date);
  if (!day || !Array.isArray(day.missingUsers) || day.slots.some(slot => !Array.isArray(slot.operators?.availableUsers)
    || !Array.isArray(slot.operators?.unavailableUsers) || !Array.isArray(slot.actors?.availableUsers) || !Array.isArray(slot.actors?.unavailableUsers))) {
    throw new Error('Сервер вернул неполные данные расписания на выбранный день.');
  }
  return { ...day, slots: day.slots.filter(slot => activeSlots.has(slot.slotId)).sort((a, b) => a.time.localeCompare(b.time)) };
}

const QuestOverview = ({ quest, dates, userId, editable, onBusy }: {
  quest: Quest; dates: string[]; userId: number; editable: boolean; onBusy: (busy: boolean) => void;
}) => {
  const [current, setCurrent] = useState<OverviewDay | null>(null);
  const [marks, setMarks] = useState<Record<number, boolean | null>>({});
  const [date, setDate] = useState(dates[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [personalError, setPersonalError] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const submitting = useRef(false);
  const mounted = useRef(true);
  const dateStrip = useRef<HTMLDivElement>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; onBusy(false); }; }, [onBusy]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(null); setPersonalError(''); setMarks({});
    const personal = editable ? getMyAvailability(quest.id, date, date)
      .then(result => {
        const day = result.days.find(item => item.date === date);
        if (!day) throw new Error('Сервер не вернул ваши отметки на этот день.');
        return { marks: Object.fromEntries(day.slots.map(slot => [slot.slotId, slot.canWork])), error: '' };
      }).catch(reason => ({ marks: {}, error: message(reason) }))
      : Promise.resolve({ marks: {}, error: '' });
    Promise.all([getAvailabilityOverview(quest.id, date, date), getQuestSlots(quest.id), personal]).then(([result, assigned, mine]) => {
      if (!active) return;
      const activeSlots = new Set(assigned.slots.filter(slot => slot.isActive).map(slot => slot.id));
      setCurrent(overviewDay(result.days, date, activeSlots));
      setMarks(mine.marks);
      setPersonalError(mine.error);
    }).catch(reason => { if (active) setError(message(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [quest.id, date, editable, attempt]);

  const toggle = async (slot: OverviewSlot) => {
    if (!editable || !current || current.date !== date || loading || submitting.current || marks[slot.slotId] === undefined) return;
    const canWork = marks[slot.slotId] !== true;
    submitting.current = true; onBusy(true); setPending(slot.slotId); setFeedback(null);
    try {
      await saveMyAvailability({ questId: quest.id, slotId: slot.slotId, date, canWork });
      if (!mounted.current) return;
      setMarks(previous => ({ ...previous, [slot.slotId]: canWork }));
      try {
        const result = await getAvailabilityOverview(quest.id, date, date);
        if (mounted.current) {
          setCurrent(overviewDay(result.days, date, new Set(current.slots.map(item => item.slotId))));
          setFeedback({ text: `${slot.time}: «${personalLabel(canWork)}» сохранено.`, error: false });
        }
      } catch {
        if (mounted.current) setFeedback({ text: 'Ваша отметка сохранена. Не удалось обновить данные команды — нажмите «Обновить».', error: true });
      }
    } catch (reason) {
      if (mounted.current) setFeedback({ text: `Не удалось сохранить слот ${slot.time}: ${message(reason)}`, error: true });
    } finally {
      submitting.current = false;
      if (mounted.current) { setPending(null); onBusy(false); }
    }
  };
  const missing = uniqueUsers(current?.missingUsers ?? []);

  return <section className="my-schedule__availability" aria-label={`Общее расписание квеста ${quest.title}`}>
    <div className="my-schedule__date-bar">
    <button className="my-schedule__date-arrow" aria-label="Прокрутить даты назад" onClick={() => dateStrip.current?.scrollBy({ left: -360, behavior: 'smooth' })}>‹</button>
    <div ref={dateStrip} className="my-schedule__dates" aria-label="Выбор дня">
      {dates.map((item, index) => <button key={item} className={`my-schedule__date${[0, 6].includes(dateValue(item).getDay()) ? ' my-schedule__date--weekend' : ''}${item === date ? ' my-schedule__date--selected' : ''}`}
        aria-pressed={item === date} disabled={pending !== null} onClick={() => { setFeedback(null); setDate(item); }}>
        <span>{index === 0 ? 'Сегодня' : dateValue(item).toLocaleDateString('ru-RU', { weekday: 'short' })}</span>
        <span>{dateValue(item).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
      </button>)}
    </div>
    <button className="my-schedule__date-arrow" aria-label="Прокрутить даты вперёд" onClick={() => dateStrip.current?.scrollBy({ left: 360, behavior: 'smooth' })}>›</button>
    </div>
    <div className="my-schedule__day-card">
    <div className="schedule-grid__heading">
      <h2>{dateValue(date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
      <button className="schedule-grid__refresh" disabled={loading || pending !== null} onClick={() => { setFeedback(null); setAttempt(value => value + 1); }}><span aria-hidden="true">↻</span> {loading ? 'Загружаем…' : 'Обновить'}</button>
    </div>
    {error ? <div role="alert"><p className="my-schedule__error">{error}</p><button className="my-schedule__retry" onClick={() => setAttempt(value => value + 1)}>Повторить загрузку</button></div> :
      loading || !current || current.date !== date ? <p role="status">Загружаем расписание...</p> : current.slots.length === 0 ? <p>У квеста нет активных слотов.</p> : <>
        {missing.length > 0 && <p className="schedule-grid__missing" role="status"><strong>Расписание не заполнили: </strong>{missing.map(user => user.name).join(', ')}</p>}
        {!editable && <p className="schedule-grid__missing">Вы не назначены на этот квест. Здесь можно посмотреть отметки команды.</p>}
        {personalError && <p className="my-schedule__error" role="alert">Не удалось загрузить вашу доступность: {personalError}</p>}
        <div className="schedule-grid__slots">{current.slots.map(slot => <Slot key={`${date}:${slot.slotId}`} slot={slot} date={date} questId={quest.id}
          userId={userId} mark={marks[slot.slotId]} saving={pending !== null} pending={pending === slot.slotId} onToggle={() => void toggle(slot)} />)}</div>
      </>}
    {feedback && <p className={feedback.error ? 'my-schedule__error' : 'my-schedule__saved'} role={feedback.error ? 'alert' : 'status'}>{feedback.text}</p>}
    <div className="my-schedule__hint-box"><span className="my-schedule__hint-icon" aria-hidden="true">☀</span><p>Здесь показана доступность сотрудников. Нажмите на красную цифру, чтобы увидеть, кто не может работать.
      {editable && <><br />Первое нажатие на свою отметку ставит «Могу», следующие переключают «Могу» и «Не могу».</>}
    </p></div>
    </div>
  </section>;
};

export const ScheduleGrid = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const managesQuests = canManage(user?.systemRole);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
  const [horizon, setHorizon] = useState<number | null>(null);
  const [questId, setQuestId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const { today } = useBookingClock();
  useEffect(() => {
    if (userId === undefined) return;
    let active = true;
    setLoading(true); setError(null);
    Promise.all([managesQuests ? getQuests() : Promise.resolve(null), getScheduleSettings(), getUserQuests(userId)]).then(([catalog, settings, assigned]) => {
      if (!active) return;
      const all = catalog ?? assigned.quests;
      if (!Number.isInteger(settings.availabilityHorizonDays) || settings.availabilityHorizonDays < 1 || settings.availabilityHorizonDays > 90) throw new Error('Сервер вернул некорректный период расписания.');
      const ids = new Set(assigned.quests.map(quest => quest.id));
      setQuests(all); setAssignedIds(ids);
      setQuestId(previous => all.some(quest => quest.id === previous) ? previous : all.find(quest => ids.has(quest.id))?.id ?? all[0]?.id ?? null);
      setHorizon(settings.availabilityHorizonDays);
    }).catch(reason => { if (active) setError(message(reason)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt, userId, managesQuests]);
  const selectedQuest = quests.find(quest => quest.id === questId && (managesQuests || assignedIds.has(quest.id)));
  const assignedQuests = quests.filter(quest => assignedIds.has(quest.id));
  const otherQuests = managesQuests ? quests.filter(quest => !assignedIds.has(quest.id)) : [];
  const dates = horizon ? makeDates(today, horizon) : [];

  return <main className="my-schedule schedule-grid">
    <div className="my-schedule__topline"><time dateTime={today} className="my-schedule__today">{dateValue(today).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })}</time></div>
    <div className="my-schedule__intro"><div className="my-schedule__intro-copy">
    <h1>Расписание</h1>
    <p className="my-schedule__subtitle">Посмотрите, кто может работать, и отметьте свою доступность прямо в слоте.</p>
    {!loading && !error && quests.length > 0 && <label className="my-schedule__quest">Квест<div className="my-schedule__quest-select"><img src={questImage} alt="" /><select value={questId ?? ''} disabled={busy} onChange={event => setQuestId(event.target.value ? Number(event.target.value) : null)}>
      <option value="">Выберите квест</option>
      {assignedQuests.length > 0 && <optgroup label="Мои квесты">{assignedQuests.map(quest => <option key={quest.id} value={quest.id}>{quest.title}</option>)}</optgroup>}
      {otherQuests.length > 0 && <optgroup label="Другие квесты">{otherQuests.map(quest => <option key={quest.id} value={quest.id}>{quest.title}</option>)}</optgroup>}
    </select></div></label>}
    </div>
    {selectedQuest && <div className="my-schedule__quest-banner" style={{ backgroundImage: `linear-gradient(0deg, #101018d9, #10101808), url("${questImage}")` }}>
      <span className="my-schedule__banner-icon" aria-hidden="true">▦</span><div><h2>{selectedQuest.title}</h2><p>{selectedQuest.description || 'Командная игра, логика, адреналин'}</p></div>
      <a className="my-schedule__photo-credit" href="https://www.pexels.com/photo/a-dark-empty-corridor-18301295/" target="_blank" rel="noreferrer">Фото: Philip Borden / Pexels</a>
    </div>}
    </div>
    {loading ? <p role="status">Загружаем квесты и настройки...</p> : error ? <div role="alert"><p className="my-schedule__error">{error}</p><button className="my-schedule__retry" onClick={() => setAttempt(value => value + 1)}>Повторить загрузку</button></div> :
      quests.length === 0 ? <p>{managesQuests ? 'Квестов пока нет.' : 'Вы пока не назначены ни на один квест.'}</p> : <>
        {selectedQuest && userId !== undefined && <QuestOverview key={`${userId}:${selectedQuest.id}:${today}:${horizon}`}
          quest={selectedQuest} dates={dates} userId={userId} editable={assignedIds.has(selectedQuest.id)} onBusy={setBusy} />}
      </>}
  </main>;
};

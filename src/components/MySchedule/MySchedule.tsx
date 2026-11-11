import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { dateValue, makeDates, useScheduleToday } from '../../hooks/useSchedulePeriod';
import { getUserQuests, getScheduleSettings, getMyAvailability, saveMyAvailability, type AvailabilityDay, type AvailabilitySlot } from '../../api/availability';
import { getQuestSlots, type Quest } from '../../api/quests';
import { ApiError } from '../../api/client';
import './MySchedule.scss';

const message = (reason: unknown) => reason instanceof Error ? reason.message : 'Не удалось выполнить запрос';
const labels = (value: boolean | null) => value === null ? 'Не отмечено' : value ? 'Могу' : 'Не могу';
const questImage = 'https://images.pexels.com/photos/18301295/pexels-photo-18301295.jpeg?auto=compress&cs=tinysrgb&w=1200';

const QuestAvailability = ({ quest, dates, onBusy }: { quest: Quest; dates: string[]; onBusy: (value: boolean) => void }) => {
  const [days, setDays] = useState<AvailabilityDay[]>([]);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const submitting = useRef(false);
  const mounted = useRef(true);
  const dateStrip = useRef<HTMLDivElement>(null);
  const from = dates[0];
  const to = dates[dates.length - 1];
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; onBusy(false); }; }, [onBusy]);
  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError(null);
    Promise.all([getMyAvailability(quest.id, from, to), getQuestSlots(quest.id)]).then(([result, assigned]) => {
      if (!active) return;
      const activeIds = new Set(assigned.slots.filter(slot => slot.isActive).map(slot => slot.id));
      setDays(result.days.map(day => ({ ...day, slots: day.slots.filter(slot => activeIds.has(slot.slotId)).sort((a, b) => a.time.localeCompare(b.time)) })));
    }).catch(reason => { if (active) setLoadError(message(reason)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [quest.id, from, to, attempt]);

  const toggle = async (slot: AvailabilitySlot) => {
    if (submitting.current || loading) return;
    const canWork = slot.canWork !== true;
    const date = selectedDate;
    submitting.current = true; onBusy(true); setPendingId(slot.slotId); setSaveError(null); setSavedMessage(null);
    try {
      await saveMyAvailability({ questId: quest.id, slotId: slot.slotId, date, canWork });
      if (!mounted.current) return;
      setDays(previous => previous.map(day => day.date === date ? { ...day, slots: day.slots.map(item => item.slotId === slot.slotId ? { ...item, canWork } : item) } : day));
      setSavedMessage(`${slot.time}: ${labels(canWork)} — сохранено.`);
    } catch (reason) {
      if (mounted.current) setSaveError(reason instanceof ApiError && reason.status === 403 ? 'Вы больше не назначены на этот квест. Обновите страницу.' : `Не удалось сохранить слот ${slot.time}: ${message(reason)}`);
    } finally {
      submitting.current = false;
      if (mounted.current) { setPendingId(null); onBusy(false); }
    }
  };
  const currentDay = days.find(day => day.date === selectedDate);

  return <section className="my-schedule__availability" aria-label={`Доступность на квесте ${quest.title}`}>
    <div className="my-schedule__date-bar">
      <button className="my-schedule__date-arrow" aria-label="Прокрутить даты назад" onClick={() => dateStrip.current?.scrollBy({ left: -360, behavior: 'smooth' })}>‹</button>
    <div ref={dateStrip} className="my-schedule__dates" aria-label="Выбор дня">
      {dates.map((date, index) => <button key={date} className={`my-schedule__date${[0, 6].includes(dateValue(date).getDay()) ? ' my-schedule__date--weekend' : ''}${date === selectedDate ? ' my-schedule__date--selected' : ''}`}
        aria-pressed={date === selectedDate} disabled={pendingId !== null} onClick={() => { setSelectedDate(date); setSaveError(null); setSavedMessage(null); }}>
        <span>{index === 0 ? 'Сегодня' : dateValue(date).toLocaleDateString('ru-RU', { weekday: 'short' })}</span>
        <span>{dateValue(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
      </button>)}
    </div>
      <button className="my-schedule__date-arrow" aria-label="Прокрутить даты вперёд" onClick={() => dateStrip.current?.scrollBy({ left: 360, behavior: 'smooth' })}>›</button>
    </div>
    <div className="my-schedule__day-card">
    <div className="my-schedule__day-heading">
      <h2>{dateValue(selectedDate).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
      <div className="my-schedule__legend"><span><i className="my-schedule__dot my-schedule__dot--available" />Могу работать</span><span><i className="my-schedule__dot my-schedule__dot--unavailable" />Не могу работать</span></div>
    </div>
    {loading ? <p role="status">Загружаем расписание...</p> : loadError ? <div role="alert"><p className="my-schedule__error">{loadError}</p><button className="my-schedule__retry" onClick={() => setAttempt(value => value + 1)}>Повторить загрузку</button></div> :
      !currentDay ? <p role="alert">Сервер не вернул расписание на выбранный день.</p> : currentDay.slots.length === 0 ? <p>У этого квеста нет активных слотов. Обратитесь к администратору.</p> :
        <div className="my-schedule__grid">{currentDay.slots.map(slot => <button key={slot.slotId}
          className={`my-schedule__slot my-schedule__slot--${slot.canWork === null ? 'unknown' : slot.canWork ? 'available' : 'unavailable'}`}
          disabled={pendingId !== null} aria-busy={pendingId === slot.slotId}
          aria-label={`${slot.time}: ${labels(slot.canWork)}. Отметить «${labels(slot.canWork !== true)}»`} onClick={() => void toggle(slot)}>
          <time>{slot.time}</time><span>{pendingId === slot.slotId ? 'Сохраняем...' : labels(slot.canWork)}</span>
          <span className="my-schedule__slot-mark" aria-hidden="true">{pendingId === slot.slotId ? '…' : slot.canWork === null ? '−' : slot.canWork ? '✓' : '×'}</span>
        </button>)}</div>}
    {saveError && <p className="my-schedule__error" role="alert">{saveError}</p>}
    {savedMessage && <p className="my-schedule__saved" role="status">{savedMessage}</p>}
    <div className="my-schedule__hint-box"><span className="my-schedule__hint-icon" aria-hidden="true">☀</span><p>Первый клик — «Могу». Следующие клики переключают «Могу» и «Не могу».<br />Изменения сохраняются сразу.</p></div>
    </div>
  </section>;
};

export const MySchedule = () => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [horizon, setHorizon] = useState<number | null>(null);
  const [questId, setQuestId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const today = useScheduleToday();
  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true); setError(null); setQuestId(null);
    Promise.all([getUserQuests(user.id), getScheduleSettings()]).then(([assigned, settings]) => {
      if (!active) return;
      if (!Number.isInteger(settings.availabilityHorizonDays) || settings.availabilityHorizonDays < 1 || settings.availabilityHorizonDays > 90) throw new Error('Сервер вернул некорректный период расписания.');
      setQuests(assigned.quests); setQuestId(assigned.quests[0]?.id ?? null); setHorizon(settings.availabilityHorizonDays);
    }).catch(reason => { if (active) setError(message(reason)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id, attempt]);
  const selectedQuest = quests.find(quest => quest.id === questId);
  const dates = horizon ? makeDates(today, horizon) : [];

  return <main className="my-schedule">
    <div className="my-schedule__topline"><time dateTime={today} className="my-schedule__today">{dateValue(today).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })}</time></div>
    <div className="my-schedule__intro">
    <div className="my-schedule__intro-copy">
    <h1>Моё расписание</h1>
    <p className="my-schedule__subtitle">Отметьте свою доступность на квестах, на которых вы работаете.</p>
    {!loading && !error && quests.length > 0 && <label className="my-schedule__quest">Квест<div className="my-schedule__quest-select"><img src={questImage} alt="" /><select value={questId ?? ''} disabled={busy} onChange={event => setQuestId(event.target.value ? Number(event.target.value) : null)}>
      <option value="">Выберите квест</option>{quests.map(quest => <option key={quest.id} value={quest.id}>{quest.title}</option>)}
    </select></div></label>}
    </div>
    {selectedQuest && <div className="my-schedule__quest-banner" style={{ backgroundImage: `linear-gradient(0deg, #101018d9, #10101808), url("${questImage}")` }}>
      <span className="my-schedule__banner-icon" aria-hidden="true">▦</span><div><h2>{selectedQuest.title}</h2><p>{selectedQuest.description || 'Командная игра, логика, адреналин'}</p></div>
      <a className="my-schedule__photo-credit" href="https://www.pexels.com/photo/a-dark-empty-corridor-18301295/" target="_blank" rel="noreferrer">Фото: Philip Borden / Pexels</a>
    </div>}
    </div>
    {loading ? <p role="status">Загружаем квесты и настройки...</p> : error ? <div role="alert"><p className="my-schedule__error">{error}</p><button className="my-schedule__retry" onClick={() => setAttempt(value => value + 1)}>Повторить загрузку</button></div> :
      quests.length === 0 ? <p>Вы пока не назначены ни на один квест. Обратитесь к администратору.</p> : <>
        {selectedQuest && <QuestAvailability key={`${user?.id}:${selectedQuest.id}:${today}:${horizon}`} quest={selectedQuest} dates={dates} onBusy={setBusy} />}
      </>}
  </main>;
};

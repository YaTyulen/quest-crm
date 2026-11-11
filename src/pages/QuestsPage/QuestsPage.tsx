import { useEffect, useRef, useState } from 'react';
import { createQuest, getQuests, type Quest } from '../../api/quests';
import { getSlots, type SlotTemplate } from '../../api/slots';
import { QuestSlotsEditor } from './QuestSlotsEditor';
import { QuestSettingsForm } from './QuestSettingsForm';
import { SlotsManager } from './SlotsManager';
import { Accordion } from './Accordion';
import { errorMessage, sortSlots } from './slotUtils';
import './QuestsPage.scss';
import { dateValue, useScheduleToday } from '../../hooks/useSchedulePeriod';
import { useAuth } from '../../hooks/useAuth';

const QuestsPage = () => {
  const { user } = useAuth();
  const isOwner = user?.systemRole === 'OWNER';
  const today = useScheduleToday();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [slots, setSlots] = useState<SlotTemplate[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slotAttempt, setSlotAttempt] = useState(0);
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [bindingBusy, setBindingBusy] = useState(false);
  const [bindingDirty, setBindingDirty] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const selectedQuest = quests.find(quest => quest.id === selectedId);
  const busy = creating || catalogBusy || bindingBusy;

  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError(null);
    getQuests().then(data => { if (active) setQuests(data); })
      .catch(reason => { if (active) setLoadError(errorMessage(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  useEffect(() => {
    let active = true;
    setSlotsLoading(true); setSlotsError(null);
    getSlots().then(data => { if (active) setSlots(sortSlots(data)); })
      .catch(reason => { if (active) setSlotsError(errorMessage(reason)); })
      .finally(() => { if (active) setSlotsLoading(false); });
    return () => { active = false; };
  }, [slotAttempt]);

  const canSwitch = () => !bindingDirty || window.confirm('Отменить несохранённые изменения слотов квеста и переключить квест?');
  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isOwner || submitting.current || busy) return;
    setError(null);
    if (!title.trim()) { setError('Введите название квеста.'); return; }
    if (!canSwitch()) return;
    submitting.current = true; setCreating(true);
    try {
      const quest = await createQuest({ title: title.trim(), description: description.trim() || undefined });
      setQuests(previous => [...previous, quest]); setSelectedId(quest.id);
      setTitle(''); setDescription(''); setShowCreate(false);
    } catch (reason) { setError(errorMessage(reason)); }
    finally { submitting.current = false; setCreating(false); }
  };

  return <main className="quests-page">
    <div className="quests-page__topline"><time dateTime={today}>{dateValue(today).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })}</time></div>
    <header className="quests-page__header">
      <div><h1>Квесты</h1><p className="quests-page__hint">Управление квестами, общими слотами и расписанием каждого квеста.</p></div>
      <div className="quests-page__header-actions">
        <select aria-label="Выбрать квест" value={selectedId ?? ''} disabled={busy || loading || Boolean(loadError) || quests.length === 0}
          onChange={event => { if (canSwitch()) setSelectedId(event.target.value ? Number(event.target.value) : null); }}>
          <option value="">{loading ? 'Загружаем квесты…' : quests.length === 0 ? 'Нет квестов' : 'Выберите квест'}</option>
          {quests.map(quest => <option key={quest.id} value={quest.id}>{quest.title}</option>)}
        </select>
        {isOwner && <button type="button" className="quests-page__button" disabled={busy} aria-expanded={showCreate} aria-controls={showCreate ? 'create-quest' : undefined}
          onClick={() => { setShowCreate(value => !value); setError(null); }}>{showCreate ? 'Закрыть форму' : '+ Добавить квест'}</button>}
      </div>
    </header>
    {loadError && <div role="alert"><p className="quests-page__error">{loadError}</p><button className="quests-page__button" onClick={() => setAttempt(value => value + 1)}>Повторить загрузку</button></div>}
    {isOwner && showCreate && <section id="create-quest" className="quests-page__panel" aria-labelledby="create-quest-title"><h2 id="create-quest-title">Новый квест</h2><form className="quests-page__quest-form" onSubmit={handleCreate}>
        <label>Название<input type="text" required autoFocus value={title} disabled={busy} onChange={event => setTitle(event.target.value)} /></label>
        <label>Описание <span className="quests-page__hint">(необязательно)</span><textarea rows={3} value={description} disabled={busy} onChange={event => setDescription(event.target.value)} /></label>
        {error && <p className="quests-page__error" role="alert">{error}</p>}
        <button className="quests-page__button" disabled={busy}>{creating ? 'Создаём...' : 'Создать квест'}</button>
    </form></section>}
    {selectedQuest && <Accordion key={`staffing:${selectedQuest.id}`} title={`Настройки квеста «${selectedQuest.title}»`} defaultOpen>
      <QuestSettingsForm quest={selectedQuest} onSaved={updated => setQuests(previous => previous.map(quest => quest.id === updated.id ? updated : quest))} />
    </Accordion>}
    <Accordion title="Слоты">
      {bindingDirty && <p className="quests-page__hint">Чтобы изменять общий список слотов, сначала сохраните или отмените изменения слотов квеста.</p>}
      <SlotsManager slots={slots} loading={slotsLoading} loadError={slotsError} disabled={creating || bindingBusy || bindingDirty}
        onReload={() => setSlotAttempt(value => value + 1)} onChange={setSlots} onBusy={setCatalogBusy} />
    </Accordion>
    {selectedQuest && <Accordion key={selectedQuest.id} title={`Слоты квеста «${selectedQuest.title}»`} defaultOpen>
      <QuestSlotsEditor quest={selectedQuest} slots={slots} catalogLoading={slotsLoading} catalogError={slotsError} disabled={creating || catalogBusy}
        onBusy={setBindingBusy} onDirty={setBindingDirty} />
    </Accordion>}
  </main>;
};
export default QuestsPage;

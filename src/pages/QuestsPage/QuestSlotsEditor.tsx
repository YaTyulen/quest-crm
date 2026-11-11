import { useEffect, useRef, useState } from 'react';
import { getQuestSlots, replaceQuestSlots, type Quest } from '../../api/quests';
import type { SlotTemplate } from '../../api/slots';
import Pencil from '../../assets/pencil.svg';
import { errorMessage, sortSlots } from './slotUtils';
import { SlotPricesEditor } from './SlotPricesEditor';

interface Props {
  quest: Quest; slots: SlotTemplate[]; catalogLoading: boolean; catalogError: string | null; disabled: boolean;
  onBusy: (value: boolean) => void; onDirty: (value: boolean) => void;
}
const signature = (ids: number[]) => [...ids].sort((a, b) => a - b).join(',');
export const QuestSlotsEditor = ({ quest, slots, catalogLoading, catalogError, disabled, onBusy, onDirty }: Props) => {
  const [attached, setAttached] = useState<SlotTemplate[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [priceSlotId, setPriceSlotId] = useState<number | null>(null);
  const [pricesDirty, setPricesDirty] = useState(false);
  const [pricesSaving, setPricesSaving] = useState(false);
  const submitting = useRef(false);
  const savedIds = attached.map(slot => slot.id);
  const dirty = signature(selected) !== signature(savedIds);
  const busy = saving || pricesSaving || disabled;
  const available = sortSlots([...new Map([...attached, ...slots].map(slot => [slot.id, slot])).values()]);
  const schedule = available.filter(slot => savedIds.includes(slot.id));
  const priceSlot = schedule.find(slot => slot.id === priceSlotId);
  const unselectedSlots = available.filter(slot => !selected.includes(slot.id));
  const selectedSlots = available.filter(slot => selected.includes(slot.id));
  const selectionDisabled = busy || catalogLoading || Boolean(catalogError);
  const hasUnsavedChanges = dirty || pricesDirty;
  useEffect(() => { onDirty(hasUnsavedChanges); return () => onDirty(false); }, [hasUnsavedChanges, onDirty]);
  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError(null);
    getQuestSlots(quest.id).then(result => { if (active) { setAttached(result.slots); setSelected(result.slots.map(slot => slot.id)); } })
      .catch(reason => { if (active) setLoadError(errorMessage(reason)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [quest.id, attempt]);

  const selectPriceSlot = (slotId: number | null) => {
    if (busy || (pricesDirty && !window.confirm('Отменить несохранённые изменения цен?'))) return false;
    setPriceSlotId(slotId);
    setPricesDirty(false);
    return true;
  };
  const save = async () => {
    if (submitting.current || busy || loading || catalogLoading || catalogError || !dirty) return;
    submitting.current = true; setSaving(true); onBusy(true); setError(null); setSuccess(null);
    try {
      const result = await replaceQuestSlots(quest.id, selected);
      setAttached(result.slots); setSelected(result.slots.map(slot => slot.id)); setEditing(false); setSuccess('Расписание слотов сохранено.');
    } catch (reason) { setError(errorMessage(reason)); }
    finally { submitting.current = false; setSaving(false); onBusy(false); }
  };
  return <>
    {loading ? <p role="status">Загружаем расписание...</p> : loadError ? <div role="alert"><p className="quests-page__error">{loadError}</p><button className="quests-page__button" onClick={() => setAttempt(value => value + 1)}>Повторить загрузку</button></div> : <>
      <div className="quests-page__list-heading"><p className="quests-page__hint">{editing ? 'Выберите слоты для этого квеста.' : 'Расписание из привязанных слотов.'}</p>
        {!editing && <button className="quests-page__icon-button" title="Редактировать расписание" aria-label={`Редактировать слоты квеста ${quest.title}`} disabled={busy || catalogLoading || Boolean(catalogError)} onClick={() => { if (selectPriceSlot(null)) { setEditing(true); setSuccess(null); } }}><Pencil aria-hidden="true" /></button>}
      </div>
      {!editing ? schedule.length === 0 ? <p className="quests-page__hint">У квеста пока нет слотов. Нажмите на карандаш, чтобы выбрать их.</p> :
        <>
          <ul className="quests-page__schedule">{schedule.map(slot => <li key={slot.id} className={slot.isActive ? '' : 'quests-page__schedule-inactive'}>
            <time>{slot.time}</time>{!slot.isActive && <span>Неактивен</span>}
            <button type="button" className="quests-page__text-button" aria-label={`Цены для слота ${slot.time}`}
              aria-expanded={priceSlotId === slot.id} aria-controls={priceSlotId === slot.id ? 'quest-slot-prices' : undefined}
              disabled={busy} onClick={() => selectPriceSlot(priceSlotId === slot.id ? null : slot.id)}>Цены</button>
          </li>)}</ul>
          {priceSlot && <SlotPricesEditor key={priceSlot.id} questId={quest.id} slot={priceSlot} disabled={disabled}
            onBusy={value => { setPricesSaving(value); onBusy(value); }} onDirty={setPricesDirty} onClose={() => selectPriceSlot(null)} />}
        </>
        : <>
          <div className="quests-page__slot-selection">
            <section className="quests-page__slot-section" aria-label="Доступные слоты">
              <h3>Доступные слоты <span>{unselectedSlots.length}</span></h3>
              <p className="quests-page__hint">Нажмите на время, чтобы добавить его к квесту.</p>
              {unselectedSlots.length === 0 ? <p className="quests-page__slot-empty">{available.length ? 'Все слоты уже выбраны.' : 'Создайте слоты в разделе «Слоты».'}</p> :
                <ul className="quests-page__slot-tiles">{unselectedSlots.map(slot => <li key={slot.id}>
                  <button type="button" className={`quests-page__slot-tile${!slot.isActive ? ' quests-page__slot-tile--inactive' : ''}`} disabled={selectionDisabled} aria-label={`Добавить слот ${slot.time}${!slot.isActive ? ', неактивен' : ''}`} onClick={() => { setSelected(previous => [...previous, slot.id]); setError(null); }}>
                    <time>{slot.time}</time><span className="quests-page__tile-symbol" aria-hidden="true">+</span>{!slot.isActive && <span className="quests-page__tile-status">Неактивен</span>}
                  </button>
                </li>)}</ul>}
            </section>
            <section className="quests-page__slot-section quests-page__slot-section--selected" aria-label="Выбранные слоты">
              <h3>Слоты квеста <span>{selectedSlots.length}</span></h3>
              <p className="quests-page__hint">Уберите лишнее время крестиком.</p>
              {selectedSlots.length === 0 ? <p className="quests-page__slot-empty">Добавьте время из доступных слотов.</p> :
                <ul className="quests-page__slot-tiles">{selectedSlots.map(slot => <li key={slot.id} className={`quests-page__slot-tile quests-page__slot-tile--selected${!slot.isActive ? ' quests-page__slot-tile--inactive' : ''}`}>
                  <time>{slot.time}</time><button type="button" className="quests-page__tile-remove" disabled={selectionDisabled} aria-label={`Убрать слот ${slot.time}`} onClick={() => { setSelected(previous => previous.filter(id => id !== slot.id)); setError(null); }}>×</button>
                  {!slot.isActive && <span className="quests-page__tile-status">Неактивен</span>}
                </li>)}</ul>}
            </section>
          </div>
          <div className="quests-page__binding-actions">
            <button className="quests-page__button" disabled={busy || !dirty || catalogLoading || Boolean(catalogError)} onClick={() => void save()}>{saving ? 'Сохраняем...' : 'Сохранить привязку'}</button>
            <button className="quests-page__button quests-page__button--secondary" disabled={busy} onClick={() => { setSelected(savedIds); setEditing(false); setError(null); }}>Отмена</button>
            <span className="quests-page__hint">Выбрано: {selected.length}</span>
          </div>
          {dirty && selected.length === 0 && <p className="quests-page__hint">После сохранения у квеста не будет привязанных слотов.</p>}
        </>}
      {catalogError && <p className="quests-page__error" role="alert">Не удалось загрузить общий список слотов. Повторите загрузку в разделе «Слоты».</p>}
      {error && <p className="quests-page__error" role="alert">{error}</p>}
      {success && <p className="quests-page__success" role="status">{success}</p>}
    </>}
  </>;
};

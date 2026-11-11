import { useEffect, useId, useRef, useState } from 'react';
import { createSlot, updateSlot, deleteSlot, type SlotTemplate } from '../../api/slots';
import { ApiError } from '../../api/client';
import Pencil from '../../assets/pencil.svg';
import Trash from '../../assets/trash.svg';
import { errorMessage, sortSlots } from './slotUtils';

interface Props {
  slots: SlotTemplate[]; loading: boolean; loadError: string | null; disabled: boolean;
  onReload: () => void; onChange: (slots: SlotTemplate[]) => void; onBusy: (value: boolean) => void;
}
export const SlotsManager = ({ slots, loading, loadError, disabled, onReload, onChange, onBusy }: Props) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [time, setTime] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const submitting = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const formId = useId();
  const busy = pending || disabled;
  const edited = slots.find(slot => slot.id === editingId);
  const dirty = formOpen && (edited ? time !== edited.time || isActive !== edited.isActive : time !== '' || !isActive);
  useEffect(() => { if (formOpen) input.current?.focus(); }, [formOpen, editingId]);

  const reset = () => { setFormOpen(false); setEditingId(null); setTime(''); setIsActive(true); };
  const open = (slot?: SlotTemplate) => {
    if (formOpen && editingId === (slot?.id ?? null)) { input.current?.focus(); return; }
    if (dirty && !window.confirm('Отменить несохранённые изменения слота?')) return;
    setEditingId(slot?.id ?? null); setTime(slot?.time ?? ''); setIsActive(slot?.isActive ?? true);
    setError(null); setSuccess(null); setFormOpen(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current || busy || loading || loadError) return;
    setError(null); setSuccess(null);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      setError('Укажите время в формате ЧЧ:ММ.'); return;
    }
    if (slots.some(slot => slot.id !== editingId && slot.time === time)) { setError('Слот с таким временем уже существует.'); return; }
    submitting.current = true; setPending(true); onBusy(true);
    try {
      // Keep the positive order required by the API without asking the user for it.
      const [hours, minutes] = time.split(':').map(Number);
      const body = { time, order: hours * 60 + minutes + 1, isActive };
      const result = editingId === null ? await createSlot(body) : await updateSlot(editingId, body);
      onChange(sortSlots([...slots.filter(slot => slot.id !== result.id), result]));
      setSuccess(editingId === null ? `Слот ${result.time} создан.` : `Слот ${result.time} обновлён.`);
      reset();
    } catch (reason) { setError(reason instanceof ApiError && reason.status === 409 ? 'Слот с таким временем уже существует. Выберите другое время.' : errorMessage(reason)); }
    finally { submitting.current = false; setPending(false); onBusy(false); }
  };
  const remove = async (slot: SlotTemplate) => {
    if (submitting.current || busy || !window.confirm(`Удалить слот ${slot.time} из общего списка?`)) return;
    submitting.current = true; setPending(true); onBusy(true); setError(null); setSuccess(null);
    try {
      await deleteSlot(slot.id);
      onChange(slots.filter(item => item.id !== slot.id));
      if (editingId === slot.id) reset();
      setSuccess(`Слот ${slot.time} удалён.`);
    } catch (reason) {
      setError(reason instanceof ApiError && reason.status === 409 ? 'Этот слот используется квестами. Сначала уберите его привязки или сделайте слот неактивным.' : errorMessage(reason));
    } finally { submitting.current = false; setPending(false); onBusy(false); }
  };

  return <>
    <p className="quests-page__hint">Общий список слотов для всех квестов. Изменения слота действуют во всех квестах, где он используется.</p>
    {loading ? <p role="status">Загружаем слоты...</p> : loadError ? <div role="alert"><p className="quests-page__error">{loadError}</p><button className="quests-page__button" onClick={onReload}>Повторить загрузку</button></div> : <>
      <div className="quests-page__list-heading"><span>Всего слотов: {slots.length}</span>
        <button type="button" className="quests-page__button" disabled={busy} aria-expanded={formOpen && editingId === null}
          aria-controls={formOpen && editingId === null ? formId : undefined} onClick={() => open()}>+ Добавить слот</button>
      </div>
      {formOpen && <section id={formId} className={`quests-page__slot-editor${edited ? ' quests-page__slot-editor--edit' : ''}`} aria-labelledby={formId + '-title'}>
        <div className="quests-page__slot-editor-heading">
          <span className="quests-page__slot-editor-mark" aria-hidden="true">{edited ? <Pencil /> : '+'}</span>
          <div>
            <h3 id={formId + '-title'}>{edited ? `Редактирование слота ${edited.time}` : 'Новый слот'}</h3>
            <p className="quests-page__hint">{edited ? 'Изменения применятся ко всем квестам, где используется этот слот.' : 'Добавьте время начала в общий список слотов.'}</p>
          </div>
        </div>
        <form className="quests-page__slot-editor-form" onSubmit={save}>
          <div className="quests-page__slot-editor-fields">
            <label>Время начала<input ref={input} type="time" step="60" required value={time} disabled={busy} onChange={event => setTime(event.target.value)} /></label>
            <label className="quests-page__checkbox"><input type="checkbox" checked={isActive} disabled={busy} onChange={event => setIsActive(event.target.checked)} />Активный слот</label>
          </div>
          <div className="quests-page__binding-actions">
            <button className="quests-page__button" disabled={busy || (editingId !== null && !dirty)}>{pending ? 'Сохраняем…' : edited ? 'Сохранить изменения' : 'Создать слот'}</button>
            <button type="button" className="quests-page__button quests-page__button--secondary" disabled={busy} onClick={() => { reset(); setError(null); setSuccess(null); }}>Отмена</button>
          </div>
        </form>
      </section>}
      {error && <p className="quests-page__error" role="alert">{error}</p>}
      {success && <p className="quests-page__success" role="status">{success}</p>}
      {slots.length === 0 ? <p className="quests-page__hint">Слотов пока нет. Добавьте первое время начала.</p> :
        <ul className="quests-page__slot-chips" aria-label="Общие слоты">{slots.map(slot => <li key={slot.id}
          className={`quests-page__slot-chip${slot.isActive ? '' : ' quests-page__slot-chip--inactive'}${editingId === slot.id ? ' quests-page__slot-chip--editing' : ''}`}>
          <time dateTime={slot.time}>{slot.time}</time>
          <button type="button" className="quests-page__icon-button" aria-label={`Редактировать слот ${slot.time}`} aria-describedby={`slot-status-${slot.id}`}
            aria-expanded={editingId === slot.id} aria-controls={editingId === slot.id ? formId : undefined} disabled={busy} onClick={() => open(slot)}><Pencil aria-hidden="true" /></button>
          <button type="button" className="quests-page__icon-button quests-page__icon-button--danger" aria-label={`Удалить слот ${slot.time}`} aria-describedby={`slot-status-${slot.id}`} disabled={busy} onClick={() => void remove(slot)}><Trash aria-hidden="true" /></button>
          <span id={`slot-status-${slot.id}`} role="tooltip" className="quests-page__slot-chip-status">{slot.isActive ? 'Активный слот' : 'Неактивный слот'}</span>
        </li>)}</ul>}
    </>}
  </>;
};

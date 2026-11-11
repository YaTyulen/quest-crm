import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getQuestSlotPrices, replaceQuestSlotPrices, type SlotPrice } from '../../api/quests';
import type { SlotTemplate } from '../../api/slots';
import { errorMessage } from './slotUtils';

const weekdays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const maxPrice = 2147483647;
const priceFields = (prices: SlotPrice[] = []) => weekdays.map((_, index) => {
  const price = prices.find(item => item.dayOfWeek === index + 1)?.price;
  return price === undefined ? '' : String(price);
});
const validPrice = (value: string) => /^\d+$/.test(value) && Number(value) <= maxPrice;

interface Props {
  questId: number;
  slot: SlotTemplate;
  disabled: boolean;
  onBusy: (value: boolean) => void;
  onDirty: (value: boolean) => void;
  onClose: () => void;
}

export function SlotPricesEditor({ questId, slot, disabled, onBusy, onDirty, onClose }: Props) {
  const [saved, setSaved] = useState(priceFields);
  const [draft, setDraft] = useState(priceFields);
  const [common, setCommon] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const submitting = useRef(false);
  const dirty = draft.some((value, index) => value !== saved[index]);
  const busy = disabled || saving;

  useEffect(() => { onDirty(dirty); return () => onDirty(false); }, [dirty, onDirty]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    getQuestSlotPrices(questId, slot.id).then(({ prices }) => {
      if (active) {
        const fields = priceFields(prices);
        setSaved(fields);
        setDraft(fields);
      }
    }).catch(reason => {
      if (active) setLoadError(errorMessage(reason));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [questId, slot.id, attempt]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current || busy || loading || loadError || !dirty) return;
    setError('');
    setSuccess('');
    const invalid = draft.findIndex(value => value !== '' && !validPrice(value));
    if (invalid !== -1) {
      setError(`${weekdays[invalid]}: введите целую сумму в рублях от 0 до ${maxPrice}.`);
      return;
    }
    const prices = draft.flatMap((value, index) => value === '' ? [] : [{ dayOfWeek: index + 1, price: Number(value) }]);
    submitting.current = true;
    setSaving(true);
    onBusy(true);
    try {
      const result = await replaceQuestSlotPrices(questId, slot.id, prices);
      const fields = priceFields(result.prices);
      setSaved(fields);
      setDraft(fields);
      setSuccess('Цены сохранены. Шаблон применяется к каждой неделе.');
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      submitting.current = false;
      setSaving(false);
      onBusy(false);
    }
  };

  return <section id="quest-slot-prices" className="quests-page__prices" aria-labelledby="quest-slot-prices-heading">
    <div className="quests-page__list-heading">
      <h3 id="quest-slot-prices-heading">Цены для слота {slot.time}</h3>
      <button type="button" className="quests-page__text-button" disabled={busy} onClick={onClose}>Закрыть</button>
    </div>
    <p className="quests-page__hint">Укажите цены с понедельника по воскресенье. После сохранения эта неделя автоматически повторяется: например, цена понедельника действует каждый понедельник.</p>
    {loading ? <p role="status">Загружаем цены…</p> : loadError ? <>
      <p className="quests-page__error" role="alert">{loadError}</p>
      <button type="button" className="quests-page__button" disabled={busy} onClick={() => setAttempt(value => value + 1)}>Повторить загрузку</button>
    </> : <form className="quests-page__prices" onSubmit={save}>
      <div className="quests-page__slot-form">
        <label>Одна цена для всех дней, ₽
          <input inputMode="numeric" value={common} disabled={busy} onChange={event => setCommon(event.target.value)} />
        </label>
        <button type="button" className="quests-page__button quests-page__button--secondary" disabled={busy || !validPrice(common)} onClick={() => {
          setDraft(weekdays.map(() => String(Number(common))));
          setError('');
          setSuccess('');
        }}>Применить ко всем дням</button>
      </div>
      <div className="quests-page__price-grid">
        {weekdays.map((day, index) => <label key={day}>{day}, ₽
          <input inputMode="numeric" value={draft[index]} disabled={busy} onChange={event => {
            const value = event.target.value;
            setDraft(previous => previous.map((price, field) => field === index ? value : price));
            setError('');
            setSuccess('');
          }} />
        </label>)}
      </div>
      <p className="quests-page__hint">Пустое поле — слот недоступен в публичном виджете в этот день. 0 ₽ — бесплатная бронь.</p>
      {error && <p className="quests-page__error" role="alert">{error}</p>}
      {success && <p className="quests-page__success" role="status">{success}</p>}
      <button className="quests-page__button" disabled={busy || !dirty}>{saving ? 'Сохраняем…' : 'Сохранить для всех недель'}</button>
    </form>}
  </section>;
}

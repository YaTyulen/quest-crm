import { useState, type FormEvent } from 'react';
import { updateQuestSettings, type Quest } from '../../api/quests';
import { errorMessage } from './slotUtils';

export function QuestSettingsForm({ quest, onSaved }: { quest: Quest; onSaved: (quest: Quest) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const element = event.currentTarget;
    const form = new FormData(element);
    setError('');
    setSaved(false);
    const title = String(form.get('title') ?? '').trim();
    if (!title) { setError('Введите название квеста.'); return; }
    setSaving(true);
    try {
      onSaved(await updateQuestSettings(quest.id, {
        title,
        description: String(form.get('description') ?? '').trim() || null,
        operatorsNeeded: Number(form.get('operatorsNeeded')),
        actorsNeeded: Number(form.get('actorsNeeded')),
      }));
      setSaved(true);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSaving(false);
    }
  };

  return <>
    <form className="quests-page__quest-form" onSubmit={save} onChange={() => { setSaved(false); setError(''); }}>
      <label>Название<input name="title" type="text" required disabled={saving} defaultValue={quest.title} /></label>
      <label>Описание<textarea name="description" rows={3} disabled={saving} defaultValue={quest.description ?? ''} /></label>
      <h3>Команда на слот</h3>
      <p className="quests-page__hint">Если роль не нужна, поставьте 0.</p>
      <div className="quests-page__slot-form">
        <label>Операторов на слот<input name="operatorsNeeded" type="number" min={0} max={2147483647} step={1} required disabled={saving} defaultValue={quest.operatorsNeeded} /></label>
        <label>Актёров на слот<input name="actorsNeeded" type="number" min={0} max={2147483647} step={1} required disabled={saving} defaultValue={quest.actorsNeeded} /></label>
      </div>
      <button className="quests-page__button" disabled={saving}>{saving ? 'Сохраняем…' : 'Сохранить'}</button>
    </form>
    {error && <p className="quests-page__error" role="alert">{error}</p>}
    {saved && <p className="quests-page__success" role="status">Настройки квеста сохранены.</p>}
  </>;
}

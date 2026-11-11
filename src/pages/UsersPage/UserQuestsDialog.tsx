import { useEffect, useRef, useState } from 'react';
import { getUserQuests } from '../../api/availability';
import { getQuests, type Quest } from '../../api/quests';
import { replaceUserQuests, type QuestAssignment } from '../../api/users';
import type { BusinessRole, UserProfile } from '../../types/roles';

const roleOptions = [
  { role: 'OPERATOR', label: 'Оператор', needed: 'operatorsNeeded' },
  { role: 'ACTOR', label: 'Актёр', needed: 'actorsNeeded' },
] as const;

export function UserQuestsDialog({ user, onClose, onSaved }: { user: UserProfile; onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [assigned, setAssigned] = useState<QuestAssignment[]>([]);
  const [selected, setSelected] = useState<Record<number, BusinessRole[]>>({});
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    Promise.all([getQuests(), getUserQuests(user.id)]).then(([all, current]) => {
      if (!active) return;
      setQuests(all); setAssigned(current.assignments);
      setSelected(Object.fromEntries(all.map(quest => [
        quest.id, roleOptions.filter(option => quest[option.needed] > 0
          && current.assignments.find(item => item.questId === quest.id)?.roles.includes(option.role)).map(option => option.role),
      ])));
      setReady(true);
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Не удалось загрузить квесты.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user.id, attempt]);
  const assignments = quests.flatMap(quest => selected[quest.id]?.length ? [{ questId: quest.id, roles: selected[quest.id] }] : []);
  const removed = assigned.some(item => !assignments.some(next => next.questId === item.questId));
  const changed = removed || assignments.some(item => {
    const before = assigned.find(original => original.questId === item.questId)?.roles ?? [];
    return item.roles.length !== before.length || item.roles.some(role => !before.includes(role));
  });

  return <dialog ref={dialog} className="users-page__quest-dialog" aria-labelledby="user-quest-title"
    onCancel={event => { event.preventDefault(); if (!saving) onClose(); }}>
    <h2 id="user-quest-title">Квесты: {user.name}</h2>
    {loading && <p role="status">Загружаем квесты…</p>}
    {error && <p role="alert" className="users-page__error">{error}</p>}
    {!loading && !ready && <button type="button" className="users-page__refresh" onClick={() => setAttempt(value => value + 1)}>Повторить загрузку</button>}
    {ready && <form onSubmit={async event => {
      event.preventDefault();
      if (saving || !changed) return;
      setSaving(true); setError('');
      try { await replaceUserQuests(user.id, assignments); onSaved(); }
      catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось сохранить назначения.'); }
      finally { setSaving(false); }
    }}>
      {quests.length === 0 ? <p>Квестов пока нет.</p> : <div className="users-page__quest-options">
        {quests.map(quest => <fieldset key={quest.id} className="users-page__quest-role-group">
          <legend>{quest.title}</legend>
          {roleOptions.filter(option => quest[option.needed] > 0).map(({ role, label }) => <label key={role} className="users-page__role">
            <input type="checkbox" checked={selected[quest.id]?.includes(role) ?? false} disabled={saving}
              onChange={event => {
                const checked = event.target.checked;
                setSelected(previous => ({ ...previous, [quest.id]: checked
                  ? [...(previous[quest.id] ?? []), role] : (previous[quest.id] ?? []).filter(item => item !== role) }));
              }} />{label}
          </label>)}
          {roleOptions.every(option => quest[option.needed] === 0) && <p>Квесту не требуются сотрудники.</p>}
        </fieldset>)}
      </div>}
      {removed && <p>При снятии назначения отметки доступности сотрудника на этом квесте будут удалены.</p>}
      <div className="users-page__quest-actions">
        <button type="submit" className="users-page__create" disabled={saving || !changed}>{saving ? 'Сохраняем…' : 'Сохранить'}</button>
        <button type="button" className="users-page__refresh" disabled={saving} onClick={onClose}>Отмена</button>
      </div>
    </form>}
    {!ready && <button type="button" className="users-page__refresh" onClick={onClose}>Закрыть</button>}
  </dialog>;
}

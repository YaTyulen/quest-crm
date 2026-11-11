import { useEffect, useState } from 'react';
import { getUsers, createUser, setSystemRole, setUserActivity } from '../../api/users';
import { useAuth } from '../../hooks/useAuth';
import { systemRoleLabels } from '../../utils/permissions';
import { getMe } from '../../api/auth';
import { useAppDispatch } from '../../hooks/reduxHooks';
import { signInSlice } from '../../store/slices';
import type { BusinessRole, SystemRole, UserProfile } from '../../types/roles';
import './UsersPage.scss';
import { UserQuestsDialog } from './UserQuestsDialog';

const labels: Record<BusinessRole, string> = { OPERATOR: 'Оператор', ACTOR: 'Актёр' };
const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.systemRole === 'OWNER';
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [questUser, setQuestUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [systemRole, setRole] = useState<SystemRole>('USER');
  const dispatch = useAppDispatch();
  useEffect(() => {
    let active = true;
    setLoading(true); setError(null);
    getUsers().then(data => { if (active) setUsers(data); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Не удалось загрузить сотрудников'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const mutate = async (operation: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      await operation();
      setUsers(await getUsers());
      dispatch(signInSlice.actions.setUser(await getMe()));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось сохранить изменения');
    } finally { setBusy(false); }
  };
  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!name.trim()) { setError('Введите имя сотрудника.'); return; }
    await mutate(async () => {
      await createUser({ name: name.trim(), email: email.trim(), password, systemRole: isOwner ? systemRole : 'USER' });
      setName(''); setEmail(''); setPassword(''); setRole('USER');
      setShowCreate(false);
    });
  };
  return <main className="users-page">
    <header className="users-page__header"><h1>Сотрудники</h1><p>Управляйте командой и доступом к работе с квестами.</p></header>
    {error && <p className="users-page__error" role="alert">{error}</p>}
    <section className="users-page__section" aria-labelledby="employees-title">
      <div className="users-page__section-heading"><h2 id="employees-title">Команда {!loading && <span className="users-page__count">{users.length}</span>}</h2>
        <button type="button" className="users-page__refresh" disabled={busy} aria-expanded={showCreate} aria-controls={showCreate ? 'create-employee' : undefined}
          onClick={() => { setShowCreate(value => !value); setPassword(''); }}>{showCreate ? 'Закрыть форму' : '+ Добавить сотрудника'}</button>
      </div>
      {loading ? <p role="status" className="users-page__empty">Загружаем сотрудников…</p> : users.length === 0 ? <p className="users-page__empty">Список пуст. Нажмите «Добавить сотрудника», чтобы создать аккаунт.</p> :
      <div className="users-page__table-wrap"><table className="users-page__table">
        <thead><tr><th scope="col">Сотрудник</th><th scope="col">Почта</th><th scope="col">Системная роль</th><th scope="col">Рабочие роли</th><th scope="col">Квесты</th><th scope="col">Активность</th></tr></thead>
        <tbody>{users.map(user => <tr key={user.id}>
          <th scope="row" className="users-page__person"><span className="users-page__identity"><span className="users-page__avatar" aria-hidden="true">{user.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span><span>{user.name}</span></span></th>
          <td data-label="Почта" className="users-page__email">{user.email}</td>
          <td data-label="Системная роль">{isOwner ? <select aria-label={`Системная роль: ${user.name}`} disabled={busy} value={user.systemRole}
            onChange={event => void mutate(() => setSystemRole(user.id, event.target.value as SystemRole))}>
            {Object.entries(systemRoleLabels).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
          </select> : systemRoleLabels[user.systemRole]}</td>
          <td data-label="Рабочие роли"><div className="users-page__roles">{user.businessRoles.length
            ? user.businessRoles.map(role => <span className="users-page__role users-page__role--active" key={role}>{labels[role]}</span>) : '—'}</div></td>
          <td data-label="Квесты"><button type="button" className="users-page__refresh" aria-haspopup="dialog" disabled={busy}
            aria-label={`Настроить квесты: ${user.name}`} onClick={() => setQuestUser(user)}>Настроить</button></td>
          <td data-label="Активность">
            <button type="button" className={`users-page__activity${user.isActive ? ' users-page__activity--active' : ''}`}
              role="switch" aria-checked={user.isActive} aria-label={`Активность: ${user.name}`}
              disabled={busy || (!isOwner && user.systemRole === 'OWNER')}
              onClick={() => void mutate(() => setUserActivity(user.id, !user.isActive))}>
              <span aria-hidden="true" />{user.isActive ? 'Активен' : 'Неактивен'}
            </button>
          </td>
        </tr>)}</tbody>
      </table></div>}
    </section>
    {showCreate && <section id="create-employee" className="users-page__section" aria-labelledby="create-employee-title">
      <div className="users-page__section-heading"><div><h2 id="create-employee-title">Новый сотрудник</h2><p>{isOwner ? 'Создайте аккаунт и выберите системную роль.' : 'Новые аккаунты создаются с ролью «Сотрудник».'}</p></div></div>
      <form className="users-page__form" onSubmit={handleCreate}>
        <fieldset disabled={busy}>
          <label>Имя<input type="text" autoComplete="name" autoFocus value={name} required onChange={event => setName(event.target.value)} /></label>
          <label>Электронная почта<input type="email" autoComplete="off" value={email} required onChange={event => setEmail(event.target.value)} /></label>
          <label>Пароль<input type="password" autoComplete="new-password" minLength={6} value={password} required onChange={event => setPassword(event.target.value)} /><span className="users-page__field-hint">Не менее 6 символов</span></label>
          {isOwner && <label>Системная роль<select value={systemRole} onChange={event => setRole(event.target.value as SystemRole)}>
            {Object.entries(systemRoleLabels).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
          </select></label>}
        </fieldset>
        <button type="submit" className="users-page__create" disabled={busy}>{busy ? 'Сохраняем…' : '+ Добавить сотрудника'}</button>
      </form>
    </section>}
    {questUser && <UserQuestsDialog user={questUser} onClose={() => setQuestUser(null)} onSaved={() => {
      setQuestUser(null);
      void mutate(async () => {});
    }} />}
  </main>;
};
export default UsersPage;

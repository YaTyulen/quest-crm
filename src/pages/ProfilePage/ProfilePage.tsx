import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch } from '../../hooks/reduxHooks';
import { signInSlice } from '../../store/slices';
import { BASE_PATH } from '../../constants';
import { changeOwnPassword, updateMe } from '../../api/auth';
import { ApiError } from '../../api/client';
import type { UserProfile } from '../../types/roles';
import Pencil from '../../assets/pencil.svg';
import { systemRoleLabels } from '../../utils/permissions';
import './ProfilePage.scss';

const message = (reason: unknown) => {
  if (reason instanceof ApiError && reason.status === 409) return 'Этот адрес электронной почты уже используется.';
  if (reason instanceof Error && reason.message === 'Current password is incorrect') return 'Текущий пароль указан неверно.';
  if (reason instanceof Error && reason.message === 'New password must be different from current password') return 'Новый пароль должен отличаться от текущего.';
  return reason instanceof Error ? reason.message : 'Не удалось сохранить изменения.';
};

function ProfileForms({ user, disabled, onSaved }: { user: UserProfile; disabled: boolean; onSaved: (user: UserProfile) => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [pending, setPending] = useState<'profile' | 'password' | null>(null);
  const [editing, setEditing] = useState<'profile' | 'password' | null>(null);
  const [profileMessage, setProfileMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; error: boolean } | null>(null);
  const emailChanged = email.trim() !== user.email;
  const busy = disabled || pending !== null;

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const nextName = name.trim();
    if (!nextName) { setProfileMessage({ text: 'Введите имя.', error: true }); return; }
    setPending('profile');
    setProfileMessage(null);
    try {
      const updated = await updateMe({
        ...(nextName !== user.name ? { name: nextName } : {}),
        ...(emailChanged ? { email: email.trim(), currentPassword: String(form.get('currentPassword') ?? '') } : {}),
      });
      setName(updated.name);
      setEmail(updated.email);
      onSaved(updated);
      setEditing(null);
      setProfileMessage({ text: 'Данные профиля сохранены.', error: false });
    } catch (reason) { setProfileMessage({ text: message(reason), error: true }); }
    finally { setPending(null); }
  };

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const element = event.currentTarget;
    const form = new FormData(element);
    const currentPassword = String(form.get('currentPassword') ?? '');
    const newPassword = String(form.get('newPassword') ?? '');
    if (newPassword !== form.get('confirmPassword')) {
      setPasswordMessage({ text: 'Новый пароль и его повтор не совпадают.', error: true }); return;
    }
    if (new TextEncoder().encode(newPassword).length > 72) {
      setPasswordMessage({ text: 'Новый пароль слишком длинный (максимум 72 байта).', error: true }); return;
    }
    setPending('password');
    setPasswordMessage(null);
    try {
      await changeOwnPassword({ currentPassword, newPassword });
      element.reset();
      setEditing(null);
      setPasswordMessage({ text: 'Пароль изменён.', error: false });
    } catch (reason) { setPasswordMessage({ text: message(reason), error: true }); }
    finally { setPending(null); }
  };

  const toggleProfile = () => {
    setName(user.name); setEmail(user.email); setProfileMessage(null);
    setEditing(editing === 'profile' ? null : 'profile');
  };
  const togglePassword = () => {
    setPasswordMessage(null);
    setEditing(editing === 'password' ? null : 'password');
  };

  return <div className="profile-page__grid">
    <section className="profile-page__card" aria-labelledby="profile-details-heading">
      <div className="profile-page__card-heading">
        <h2 id="profile-details-heading">Личные данные</h2>
        <button type="button" className="profile-page__edit"
          title={editing === 'profile' ? 'Закрыть редактирование' : 'Редактировать личные данные'}
          aria-label={editing === 'profile' ? 'Закрыть редактирование' : 'Редактировать личные данные'}
          aria-expanded={editing === 'profile'} aria-controls="profile-details-content" disabled={busy} onClick={toggleProfile}>
          {editing === 'profile' ? <span aria-hidden="true">×</span> : <Pencil aria-hidden="true" />}
        </button>
      </div>
      <div id="profile-details-content">
      {editing === 'profile' ? <form className="profile-page__form" onSubmit={saveProfile}>
        <label>Имя<input name="name" autoComplete="name" autoFocus required value={name} disabled={busy} onChange={event => { setName(event.target.value); setProfileMessage(null); }} /></label>
        <label>Электронная почта<input name="email" type="email" autoComplete="email" required value={email} disabled={busy} onChange={event => { setEmail(event.target.value); setProfileMessage(null); }} /></label>
        {emailChanged && <label>Текущий пароль для смены почты<input name="currentPassword" type="password" autoComplete="current-password" required disabled={busy} /></label>}
        <div className="profile-page__actions">
          <button className="profile-page__button" disabled={busy || (name.trim() === user.name && !emailChanged)}>{pending === 'profile' ? 'Сохраняем…' : 'Сохранить данные'}</button>
          <button type="button" className="profile-page__cancel" disabled={busy} onClick={toggleProfile}>Отмена</button>
        </div>
      </form> : <dl>
        <dt>Имя</dt><dd>{user.name}</dd>
        <dt>Электронная почта</dt><dd>{user.email}</dd>
        <dt>Роль в системе</dt><dd>{systemRoleLabels[user.systemRole]}</dd>
        {user.businessRoles.length > 0 && <><dt>Рабочие роли</dt><dd>{user.businessRoles.map(role => role === 'ACTOR' ? 'Актёр' : 'Оператор').join(', ')}</dd></>}
      </dl>}
      {profileMessage && <p role={profileMessage.error ? 'alert' : 'status'}>{profileMessage.text}</p>}
      {editing !== 'profile' && <div className="profile-page__password-action">
        <button type="button" className="profile-page__cancel" disabled={busy || editing === 'password'}
          aria-expanded={editing === 'password'} aria-controls={editing === 'password' ? 'profile-password-card' : undefined}
          onClick={togglePassword}>Сменить пароль</button>
        {editing !== 'password' && passwordMessage && !passwordMessage.error && <p role="status">{passwordMessage.text}</p>}
      </div>}
      </div>
    </section>
    {editing === 'password' && <section id="profile-password-card" className="profile-page__card" aria-labelledby="profile-password-heading">
      <div className="profile-page__card-heading">
        <h2 id="profile-password-heading">Смена пароля</h2>
        <button type="button" className="profile-page__edit" title="Закрыть смену пароля" aria-label="Закрыть смену пароля"
          disabled={busy} onClick={togglePassword}><span aria-hidden="true">×</span></button>
      </div>
      <form className="profile-page__form" onSubmit={savePassword} onChange={() => setPasswordMessage(null)}>
        <label>Текущий пароль<input name="currentPassword" type="password" autoComplete="current-password" autoFocus required disabled={busy} /></label>
        <label>Новый пароль<input name="newPassword" type="password" autoComplete="new-password" required minLength={6} disabled={busy} /></label>
        <label>Повторите новый пароль<input name="confirmPassword" type="password" autoComplete="new-password" required minLength={6} disabled={busy} /></label>
        <div className="profile-page__actions">
          <button className="profile-page__button" disabled={busy}>{pending === 'password' ? 'Сохраняем…' : 'Сменить пароль'}</button>
          <button type="button" className="profile-page__cancel" disabled={busy} onClick={togglePassword}>Отмена</button>
        </div>
      </form>
      {passwordMessage && <p role={passwordMessage.error ? 'alert' : 'status'}>{passwordMessage.text}</p>}
    </section>}
  </div>;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logout = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await signOut();
      dispatch(signInSlice.actions.clearUser());
      navigate(`/${BASE_PATH}`, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось выйти');
    } finally { setPending(false); }
  };
  return <main className="profile-page">
    <header className="profile-page__header">
      <h1>Мой профиль</h1>
      <button className="profile-page__logout" disabled={pending} onClick={() => void logout()}>{pending ? 'Выходим…' : 'Выйти из аккаунта'}</button>
    </header>
    {error && <p role="alert">{error}</p>}
    {user && <ProfileForms key={user.id} user={user} disabled={pending} onSaved={profile => dispatch(signInSlice.actions.setUser(profile))} />}
  </main>;
}

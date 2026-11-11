import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFirstOwner, login } from '../../api/auth';
import { ApiError } from '../../api/client';
import { BASE_PATH } from '../../constants';
import { useAppDispatch } from '../../hooks/reduxHooks';
import { signInSlice } from '../../store/slices';
import './Authorization.scss';

export default function FirstOwnerSetup({ onLoginRequired }: { onLoginRequired: (email: string, notice: string) => void }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    if (!name) { setError('Введите имя владельца.'); return; }
    if (password !== form.get('confirmPassword')) { setError('Пароли не совпадают.'); return; }
    if (new TextEncoder().encode(password).length > 72) { setError('Пароль слишком длинный (максимум 72 байта).'); return; }
    submitting.current = true; setPending(true); setError('');
    try {
      await createFirstOwner({ name, email, password });
      try {
        const user = await login(email, password);
        dispatch(signInSlice.actions.setUser(user));
        navigate(`/${BASE_PATH}/home`, { replace: true });
      } catch {
        onLoginRequired(email, 'Владелец создан. Войдите с указанной почтой и паролем.');
      }
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 409) {
        onLoginRequired('', 'Первый аккаунт уже создан. Войдите в систему.');
      } else setError(reason instanceof Error ? reason.message : 'Не удалось создать владельца.');
    } finally { submitting.current = false; setPending(false); }
  };

  return <main className="auth">
    <form className="auth__setup" onSubmit={submit}>
      <h1>Первый вход в Quest CRM</h1>
      <p>Создайте аккаунт владельца. Он сможет управлять квестами и добавлять сотрудников.</p>
      <label>Имя<input name="name" autoComplete="name" required disabled={pending} /></label>
      <label>Электронная почта<input name="email" type="email" autoComplete="username" required disabled={pending} /></label>
      <label>Пароль<input name="password" type="password" autoComplete="new-password" minLength={6} required disabled={pending} /></label>
      <label>Повторите пароль<input name="confirmPassword" type="password" autoComplete="new-password" minLength={6} required disabled={pending} /></label>
      {error && <p className="auth__error" role="alert">{error}</p>}
      <button className="auth__setup-button" type="submit" disabled={pending}>{pending ? 'Создаём аккаунт…' : 'Создать владельца'}</button>
    </form>
  </main>;
}

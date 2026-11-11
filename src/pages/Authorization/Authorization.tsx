import { useState } from 'react';
import './Authorization.scss';
import { Button, TextInput, PasswordInput } from '../../components/ui-kit';
import { useAppDispatch } from '../../hooks/reduxHooks';
import { signInSlice } from '../../store/slices';
import { useNavigate } from 'react-router-dom';
import { BASE_PATH } from '../../constants';
import { login as loginUser } from '../../api/auth';
import { ApiError } from '../../api/client';

const Authorization = ({ initialEmail = '', notice }: { initialEmail?: string; notice?: string }) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const user = await loginUser(email.trim(), password);
      dispatch(signInSlice.actions.setUser(user));
      navigate(`/${BASE_PATH}/home`, { replace: true });
    } catch (reason) {
      setError(reason instanceof ApiError && reason.status === 401 ? 'Неверный email или пароль'
        : reason instanceof Error ? reason.message : 'Не удалось войти');
    } finally { setPending(false); }
  };
  return (
    <div className="auth">
      <div className="auth__header"><h2>Quest CRM</h2><div className="auth__label">Сказки на ночь</div></div>
      {notice && <p className="auth__setup-notice" role="status">{notice}</p>}
      <form className="auth__form" onSubmit={signIn}>
        <div className="auth__field">
          <TextInput label="Email" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} />
          <PasswordInput label="Пароль" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
        </div>
        {error && <div className="auth__error" role="alert">{error}</div>}
        <Button color="white" disabled={pending} onClick={() => {}}>{pending ? 'Входим...' : 'Войти'}</Button>
      </form>
    </div>
  );
};
export default Authorization;

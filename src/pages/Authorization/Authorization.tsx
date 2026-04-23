import { useState } from 'react';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

import './Authorization.scss';
import { Button, TextInput } from '../../components/ui-kit';
import { PasswordInput } from '../../components/ui-kit';
import { useAppDispatch } from '../../hooks/reduxHooks';
import { signInSlice } from '../../store/slices';
import { useNavigate } from 'react-router-dom';
import { BASE_PATH } from '../../constants';
import { getUserProfile } from '../../utils/userUtils';


const Authorization = () => {
  const [login, setLogin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { setIsAuth, setRole } = signInSlice.actions;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await signInWithEmailAndPassword(auth, login, password);
      const profile = await getUserProfile(res.user.uid);
      dispatch(setRole(profile?.role ?? 'operator'));
      dispatch(setIsAuth(true));
      localStorage.setItem('isAuth', 'true');
      navigate(`/${BASE_PATH}/home`);
    } catch {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className='auth'>
      <div className='auth__header'>
        <h2>Quest CRM</h2>
        <div className='auth__label'>Сказки на ночь</div>
      </div>

      <form className='auth__form'>
        <div className='auth__field'>
          <TextInput
            label='Логин'
            value={login}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setLogin(event.target.value)
            }
          />
          <PasswordInput
            label='Пароль'
            value={password}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(event.target.value)
            }
          />
        </div>

        {error && <div className='auth__error'>{error}</div>}

        <Button color='white' onClick={(e: React.FormEvent) => signIn(e)}>
          Войти
        </Button>
      </form>
    </div>
  );
};

export default Authorization;

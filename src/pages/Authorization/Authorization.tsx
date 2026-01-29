import { useState } from 'react';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

import './Authorization.scss';
import { Button, TextInput } from '../../components/ui-kit';
import { PasswordInput } from '../../components/ui-kit'; 
import { useAppDispatch } from '../../hooks/reduxHooks';
import { signInSlice } from '../../store/slices';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';


const Authorization = () => {
    const [login, setLogin] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const { setIsAuth, setRole } = signInSlice.actions;
    const dispatch = useAppDispatch();
    const { getRoles } = useAuth()
    const navigate = useNavigate();


    const signIn = async(e: React.FormEvent) => {
      e.preventDefault();
      await signInWithEmailAndPassword(auth, login, password).then(async (res) => {            
          dispatch(setIsAuth(true))
          navigate(`/${import.meta.env.VITE_BASE_URL}/home`)
          localStorage.setItem('isAuth', 'true')
          const roles = await getRoles();      

          if(roles && roles[0].role === 'admin' && roles[0].usersID.find((item) => item === res.user.uid)) {
            dispatch(setRole('admin'))
          } else {
            dispatch(setRole('user'))
          }
      });
    }

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

        <Button color='white' onClick={(e: React.FormEvent) => signIn(e)}>
          Войти
        </Button>
      </form>
    </div>
  );
};

export default Authorization;

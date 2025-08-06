import { useState } from 'react'
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

import './Authorization.scss'

interface AuthProps {
    setAuth: (value: boolean) => void;
}

const Authorization = ({setAuth}:AuthProps) => {
    const [login, setLogin] = useState<string>('')
    const [password, setPassword] = useState<string>('')

    const signIn = async(e: React.FormEvent) => {
        e.preventDefault();
        await signInWithEmailAndPassword(auth, login, password).then(() => {
            setAuth(true)
        });
    }

  return (
    <form>
        <label>
            <span>Логин</span>
            <input type='text' value={login} onChange={(e) => setLogin(e.target.value)}/>
        </label>
        <label>
            <span>Пароль</span>
            <input type='password' value={password} onChange={(e) => setPassword(e.target.value)}/>
        </label>

        <button onClick={signIn}>Войти</button>
        
    </form>
  )
}

export default Authorization
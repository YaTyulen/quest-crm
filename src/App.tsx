import { useEffect, useState } from 'react';
import './App.scss';
import PrivateApp from './layout/PrivateApp';
import PublicApp from './layout/PublicApp';
import { useAppDispatch, useAppSelector } from './hooks/reduxHooks';
import { signInSlice } from './store/slices';
import { restoreSession } from './api/auth';
import { ApiError, onSessionExpired } from './api/client';

function App() {
  const { isAuth, loading } = useAppSelector(state => state.signIn);
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    localStorage.removeItem('isAuth');
    localStorage.removeItem('role');
    const unsubscribe = onSessionExpired(() => dispatch(signInSlice.actions.clearUser()));
    dispatch(signInSlice.actions.setLoading(true));
    restoreSession().then(user => {
      if (active) dispatch(signInSlice.actions.setUser(user));
    }).catch(reason => {
      if (!active) return;
      dispatch(signInSlice.actions.clearUser());
      if (!(reason instanceof ApiError && reason.status === 401)) {
        setError(reason instanceof Error ? reason.message : 'Не удалось восстановить сессию');
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [dispatch, attempt]);
  if (error) return <div role="alert"><p>{error}</p><button onClick={() => { setError(null); setAttempt(value => value + 1); }}>Повторить подключение</button></div>;
  if (loading) return <div role="status">Проверяем сессию...</div>;
  return isAuth ? <PrivateApp /> : <PublicApp />;
}
export default App;

import { useEffect, useState } from 'react';
import { getSetupStatus } from '../api/auth';
import Authorization from '../pages/Authorization/Authorization';
import FirstOwnerSetup from '../pages/Authorization/FirstOwnerSetup';

export default function PublicApp() {
  const [required, setRequired] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [loginInfo, setLoginInfo] = useState<{ email: string; notice: string } | null>(null);

  useEffect(() => {
    let active = true;
    setError('');
    getSetupStatus().then(result => {
      if (typeof result?.setupRequired !== 'boolean') throw new Error('Сервер не вернул статус настройки.');
      if (active) setRequired(result.setupRequired);
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Не удалось проверить статус настройки.');
    });
    return () => { active = false; };
  }, [attempt]);

  if (error) return <div className="auth"><div role="alert" className="auth__error">{error}</div>
    <button type="button" className="auth__setup-button" onClick={() => setAttempt(value => value + 1)}>Повторить проверку</button></div>;
  if (required === null) return <div className="auth" role="status">Проверяем настройки системы…</div>;
  return required
    ? <FirstOwnerSetup onLoginRequired={(email, notice) => { setLoginInfo({ email, notice }); setRequired(false); }} />
    : <Authorization initialEmail={loginInfo?.email} notice={loginInfo?.notice} />;
}

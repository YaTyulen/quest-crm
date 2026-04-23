import { useEffect, useState } from 'react';
import { Button, TextInput, PasswordInput, Select } from '../../components/ui-kit';
import { getAllUsers, updateUserRole, createUserWithRole, updateUserVkId } from '../../utils/userUtils';
import type { Role, UserProfile } from '../../types/roles';
import './UsersPage.scss';

const ROLES: Role[] = ['admin', 'actor', 'operator'];

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Администратор',
  actor: 'Актёр',
  operator: 'Оператор',
};

const UsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<Role>('operator');

  const [vkIdEdits, setVkIdEdits] = useState<Record<string, string>>({});
  const [savingVkId, setSavingVkId] = useState<string | null>(null);

  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderStatus, setReminderStatus] = useState<'success' | 'error' | null>(null);

  const [sendingGameReminders, setSendingGameReminders] = useState(false);
  const [gameReminderStatus, setGameReminderStatus] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    getAllUsers()
      .then(data => {
        setUsers(data);
        setVkIdEdits(Object.fromEntries(data.map(u => [u.uid, u.vkId ?? ''])));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (uid: string, role: Role) => {
    await updateUserRole(uid, role);
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
  };

  const handleVkIdSave = async (uid: string) => {
    setSavingVkId(uid);
    try {
      const vkId = vkIdEdits[uid] ?? '';
      await updateUserVkId(uid, vkId);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, vkId: vkId || undefined } : u));
    } finally {
      setSavingVkId(null);
    }
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    setReminderStatus(null);
    try {
      const res = await fetch(
        'https://api.github.com/repos/YaTyulen/quest-crm/actions/workflows/weekly-reminder.yml/dispatches',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ref: 'main' }),
        }
      );
      setReminderStatus(res.status === 204 ? 'success' : 'error');
    } catch {
      setReminderStatus('error');
    } finally {
      setSendingReminders(false);
    }
  };

  const handleSendGameReminders = async () => {
    setSendingGameReminders(true);
    setGameReminderStatus(null);
    try {
      const res = await fetch(
        'https://api.github.com/repos/YaTyulen/quest-crm/actions/workflows/game-reminders.yml/dispatches',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ref: 'main' }),
        }
      );
      setGameReminderStatus(res.status === 204 ? 'success' : 'error');
    } catch {
      setGameReminderStatus('error');
    } finally {
      setSendingGameReminders(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword || !newDisplayName) {
      setError('Заполните все поля');
      return;
    }
    setError(null);
    setCreating(true);
    try {
      await createUserWithRole(newEmail, newPassword, newDisplayName, newRole);
      const updated = await getAllUsers();
      setUsers(updated);
      setVkIdEdits(prev => {
        const next = { ...prev };
        for (const u of updated) {
          if (!(u.uid in next)) next[u.uid] = u.vkId ?? '';
        }
        return next;
      });
      setNewEmail('');
      setNewPassword('');
      setNewDisplayName('');
      setNewRole('operator');
    } catch {
      setError('Ошибка при создании пользователя');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className='users-page'>
      <section className='users-page__section'>
        <h2 className='users-page__title'>VK-уведомления</h2>
        <div className='users-page__form'>
          <Button color='dark' onClick={handleSendReminders} disabled={sendingReminders}>
            {sendingReminders ? 'Запускаем...' : 'Отправить напоминания сейчас'}
          </Button>
          {reminderStatus === 'success' && (
            <div className='users-page__success'>Рассылка запущена — сообщения придут в течение минуты</div>
          )}
          {reminderStatus === 'error' && (
            <div className='users-page__error'>Ошибка запуска — проверь VITE_GITHUB_TOKEN в .env</div>
          )}
          <Button color='dark' onClick={handleSendGameReminders} disabled={sendingGameReminders}>
            {sendingGameReminders ? 'Запускаем...' : 'Напомнить об играх завтра'}
          </Button>
          {gameReminderStatus === 'success' && (
            <div className='users-page__success'>Рассылка запущена — сообщения придут в течение минуты</div>
          )}
          {gameReminderStatus === 'error' && (
            <div className='users-page__error'>Ошибка запуска — проверь VITE_GITHUB_TOKEN в .env</div>
          )}
        </div>
      </section>

      <section className='users-page__section'>
        <h2 className='users-page__title'>Создать пользователя</h2>
        <div className='users-page__form'>
          <TextInput
            label='Email'
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            autoComplete='off'
          />
          <TextInput
            label='Имя'
            value={newDisplayName}
            onChange={e => setNewDisplayName(e.target.value)}
            autoComplete='off'
          />
          <PasswordInput
            label='Пароль'
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            autoComplete='new-password'
          />
          <Select
            label='Роль'
            value={newRole}
            options={ROLES}
            onChange={e => setNewRole(e.target.value as Role)}
          />
          {error && <div className='users-page__error'>{error}</div>}
          <Button color='dark' onClick={handleCreateUser}>
            {creating ? 'Создание...' : 'Создать'}
          </Button>
        </div>
      </section>

      <section className='users-page__section'>
        <h2 className='users-page__title'>Пользователи</h2>
        {loading ? (
          <p>Загрузка...</p>
        ) : (
          <table className='users-page__table'>
            <thead>
              <tr>
                <th>Имя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>VK ID</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.uid}>
                  <td>{user.displayName}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      className='users-page__role-select'
                      value={user.role}
                      onChange={e => handleRoleChange(user.uid, e.target.value as Role)}
                    >
                      {ROLES.map(r => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className='users-page__vk-cell'>
                      <input
                        className='users-page__vk-input'
                        type='text'
                        placeholder='123456789'
                        value={vkIdEdits[user.uid] ?? ''}
                        onChange={e => setVkIdEdits(prev => ({ ...prev, [user.uid]: e.target.value }))}
                      />
                      <button
                        className='users-page__vk-save'
                        onClick={() => handleVkIdSave(user.uid)}
                        disabled={savingVkId === user.uid}
                      >
                        {savingVkId === user.uid ? '…' : 'OK'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default UsersPage;

import { useEffect, useState } from 'react';
import './Home.scss';
import { useClientsData } from '../../hooks/useClientsData';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatDate';
import { getUserProfile } from '../../utils/userUtils';
import { useAppSelector } from '../../hooks/reduxHooks';
import { timeSlots } from '../../utils/scheduleUtils';
import {
  getPendingRequests,
  getUserRequests,
  resolveChangeRequest,
  applyApprovedRequest,
} from '../../utils/scheduleChangeRequests';
import type { ScheduleChangeRequest } from '../../types/scheduleChangeRequest';

const isToday = (timestampMs: number): boolean => {
  const gameDate = new Date(timestampMs);
  const today = new Date();
  return (
    gameDate.getDate() === today.getDate() &&
    gameDate.getMonth() === today.getMonth() &&
    gameDate.getFullYear() === today.getFullYear()
  );
};

const formatRequestDate = (date: string) =>
  new Date(date).toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

const formatRequestValue = (value: boolean | undefined) =>
  value === true ? 'могу' : value === false ? 'не могу' : '—';

const roleLabel: Record<string, string> = {
  actor: 'Актёр',
  operator: 'Оператор',
  admin: 'Администратор',
};

const statusLabel: Record<ScheduleChangeRequest['status'], string> = {
  pending: 'Ожидает решения',
  approved: 'Одобрен',
  rejected: 'Отклонен',
};

const statusClassName: Record<ScheduleChangeRequest['status'], string> = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
};

const formatStatusTime = (request: ScheduleChangeRequest) => {
  const stamp =
    request.status === 'pending' ? request.createdAt : request.resolvedAt ?? request.createdAt;

  if (!stamp?.toDate) return '—';

  return stamp.toDate().toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Home = () => {
  const { user } = useAuth();
  const { upcoming, loading } = useClientsData();
  const role = useAppSelector((state) => state.signIn.role);
  const [userName, setUserName] = useState<string | null>(null);
  const [changeRequests, setChangeRequests] = useState<ScheduleChangeRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [userRequests, setUserRequests] = useState<ScheduleChangeRequest[]>([]);
  const [userRequestsLoading, setUserRequestsLoading] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((profile) => {
      setUserName(profile?.displayName ?? null);
    });
  }, [user]);

  useEffect(() => {
    if (role !== 'admin') return;
    setRequestsLoading(true);
    getPendingRequests()
      .then(setChangeRequests)
      .catch(console.error)
      .finally(() => setRequestsLoading(false));
  }, [role]);

  useEffect(() => {
    if (!user || (role !== 'actor' && role !== 'operator')) return;
    setUserRequestsLoading(true);
    getUserRequests(user.uid)
      .then(setUserRequests)
      .catch(console.error)
      .finally(() => setUserRequestsLoading(false));
  }, [user, role]);

  const handleResolve = async (
    request: ScheduleChangeRequest,
    resolution: 'approved' | 'rejected'
  ) => {
    if (!user) return;
    setResolving(request.id);
    try {
      await resolveChangeRequest(request.id, resolution, user.uid);
      if (resolution === 'approved') {
        await applyApprovedRequest(request);
      }
      setChangeRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error) {
      console.error('Ошибка при обработке запроса:', error);
    } finally {
      setResolving(null);
    }
  };

  const myGames = upcoming.filter(
    (c) => userName && (c.actor === userName || c.admin === userName)
  );

  const greetingName = userName || user?.email?.split('@')[0] || 'коллега';
  const greetingRole = role ? roleLabel[role] ?? role : null;

  return (
    <div className="home">
      <section className="home__welcome">
        <div className="home__welcome-text">
          <span className="home__welcome-label">Quest CRM</span>
          <h2>Привет, {greetingName}!</h2>
          <p>
            {greetingRole ? `${greetingRole} в системе.` : 'Добро пожаловать в систему.'}{' '}
            Здесь можно быстро посмотреть ближайшие игры и статус запросов по расписанию.
          </p>
        </div>
        {greetingRole && <span className="home__welcome-role">{greetingRole}</span>}
      </section>

      <h3>Мои предстоящие игры</h3>
      {loading ? (
        <div className="home__loading">Загрузка...</div>
      ) : myGames.length === 0 ? (
        <div className="home__empty">Нет предстоящих игр</div>
      ) : (
        <div className="home__games">
          {myGames.map((game) => {
            const isActor = game.actor === userName;
            const today = isToday(Number(game.data));
            return (
              <div key={game.id} className={`game-card${today ? ' game-card--today' : ''}`}>
                <span className="game-card__quest">{game.quest}</span>
                <span className="game-card__date">{formatDate(Number(game.data) / 1000)}</span>
                {today && <span className="game-card__today-badge">Сегодня!</span>}
                <span className="game-card__role">{isActor ? 'Актёр' : 'Оператор'}</span>
                {game.note && <span className="game-card__note">{game.note}</span>}
              </div>
            );
          })}
        </div>
      )}

      {role === 'admin' && (
        <section className="home__change-requests">
          <h3>Запросы на изменение расписания</h3>
          {requestsLoading ? (
            <div className="home__loading">Загрузка...</div>
          ) : changeRequests.length === 0 ? (
            <div className="home__empty">Нет ожидающих запросов</div>
          ) : (
            <div className="home__request-list">
              {changeRequests.map((req) => (
                <div key={req.id} className="request-card">
                  <div className="request-card__header">
                    <span className="request-card__user">{req.userName}</span>
                    <span className="request-card__role-badge">
                      {roleLabel[req.userRole] ?? req.userRole}
                    </span>
                    <span className="request-card__date">{formatRequestDate(req.date)}</span>
                  </div>
                  <div className="request-card__slots">
                    {timeSlots.map((time) => {
                      const current = req.currentAvailability[time];
                      const requested = req.requestedAvailability[time];
                      const changed = current !== requested;
                      return (
                        <div
                          key={time}
                          className={`request-slot${changed ? ' request-slot--changed' : ''}`}
                        >
                          <span className="request-slot__time">{time}</span>
                          <span className="request-slot__current">{formatRequestValue(current)}</span>
                          <span className="request-slot__arrow">→</span>
                          <span
                            className={`request-slot__requested ${
                              requested === true ? 'yes' : requested === false ? 'no' : 'neutral'
                            }`}
                          >
                            {formatRequestValue(requested)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="request-card__actions">
                    <button
                      className="request-card__btn request-card__btn--approve"
                      disabled={resolving === req.id}
                      onClick={() => handleResolve(req, 'approved')}
                    >
                      {resolving === req.id ? '...' : 'Одобрить'}
                    </button>
                    <button
                      className="request-card__btn request-card__btn--reject"
                      disabled={resolving === req.id}
                      onClick={() => handleResolve(req, 'rejected')}
                    >
                      {resolving === req.id ? '...' : 'Отклонить'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {(role === 'actor' || role === 'operator') && (
        <section className="home__change-requests">
          <h3>История запросов на изменение расписания</h3>
          {userRequestsLoading ? (
            <div className="home__loading">Загрузка...</div>
          ) : userRequests.length === 0 ? (
            <div className="home__empty">Вы еще не отправляли запросы</div>
          ) : (
            <div className="home__request-list">
              {userRequests.map((req) => (
                <div key={req.id} className="request-card request-card--history">
                  <div className="request-card__header">
                    <span className="request-card__user">{req.userName}</span>
                    <span
                      className={`request-card__status request-card__status--${statusClassName[req.status]}`}
                    >
                      {statusLabel[req.status]}
                    </span>
                    <span className="request-card__date">{formatRequestDate(req.date)}</span>
                  </div>
                  <div className="request-card__meta">
                    {req.status === 'pending' ? 'Отправлен' : 'Обработан'}: {formatStatusTime(req)}
                  </div>
                  <div className="request-card__slots">
                    {timeSlots.map((time) => {
                      const current = req.currentAvailability[time];
                      const requested = req.requestedAvailability[time];
                      const changed = current !== requested;
                      return (
                        <div
                          key={time}
                          className={`request-slot${changed ? ' request-slot--changed' : ''}`}
                        >
                          <span className="request-slot__time">{time}</span>
                          <span className="request-slot__current">{formatRequestValue(current)}</span>
                          <span className="request-slot__arrow">→</span>
                          <span
                            className={`request-slot__requested ${
                              requested === true ? 'yes' : requested === false ? 'no' : 'neutral'
                            }`}
                          >
                            {formatRequestValue(requested)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Home;

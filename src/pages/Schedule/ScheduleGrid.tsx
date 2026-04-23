// src/components/ScheduleGrid/ScheduleGrid.tsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { useAppSelector } from '../../hooks/reduxHooks';
import { timeSlots } from '../../utils/scheduleUtils';
import './ScheduleGrid.scss';
import type { UserSchedule } from '../../types/schedule';

export const ScheduleGrid: React.FC = () => {
  const { user } = useAuth();
  const { role } = useAppSelector((state) => state.signIn);
  const isAdmin = role === 'admin';
  const [schedules, setSchedules] = useState<UserSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Подписываемся на изменения расписания
    const q = query(collection(db, 'schedules'), where('isActive', '==', true));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        
        const scheduleData: UserSchedule[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // Создаем полный объект
          const fullSchedule: UserSchedule = {
            userId: data.userId || '',
            userName: data.userName || 'Неизвестный',
            userEmail: data.userEmail || '',
            availability: data.availability || {},
            updatedAt: data.updatedAt?.toDate() || new Date(),
            isActive: data.isActive !== undefined ? data.isActive : true,
            role: data.role || undefined,
          };
          scheduleData.push(fullSchedule);
        });
        setSchedules(scheduleData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching schedules:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Генерация дат на неделю вперед
  const generateWeekDates = (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const weekDates = generateWeekDates();

  const getAvailableUsers = (date: string, time: string) => {
    return schedules
      .filter(schedule => schedule.availability?.[date]?.[time] === true)
      .map(schedule => ({ userId: schedule.userId, userName: schedule.userName, role: schedule.role }));
  };

  const getUnavailableUsers = (date: string, time: string) => {
    return schedules
      .filter(schedule => schedule.availability?.[date]?.[time] === false)
      .map(schedule => ({ userId: schedule.userId, userName: schedule.userName }));
  };

  const getUsersNotFilled = (date: string) => {
    return schedules.filter(schedule => {
      if (schedule.role === 'admin') return false;
      const dayData = schedule.availability?.[date];
      return !dayData || Object.keys(dayData).length === 0;
    });
  };

  if (loading) {
    return <div>Загрузка расписания...</div>;
  }


  const notFilledUsers = getUsersNotFilled(selectedDate);

  return (
    <div className="schedule-container">
      <h2>Расписание персонала</h2>

      {/* Выбор даты */}
      <div className="date-selector">
        {weekDates.map(date => (
          <button
            key={date}
            className={`date-btn ${date === selectedDate ? 'active' : ''}`}
            onClick={() => setSelectedDate(date)}
          >
            {new Date(date).toLocaleDateString('ru-RU', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            })}
          </button>
        ))}
      </div>

      {isAdmin && notFilledUsers.length > 0 && (
        <div className="not-filled-banner">
          <span className="not-filled-banner__title">Не заполнили расписание:</span>
          <span className="not-filled-banner__names">
            {notFilledUsers.map(u => u.userName).join(', ')}
          </span>
        </div>
      )}

      {/* Сетка расписания */}
      <div className="time-slots">
        {timeSlots.map(time => {
          const availableUsers = getAvailableUsers(selectedDate, time);
          const unavailableUsers = getUnavailableUsers(selectedDate, time);
          const hasActor = availableUsers.some(u => u.role === 'actor');
          const hasOperator = availableUsers.some(u => u.role === 'operator');
          const understaffed = !hasActor || !hasOperator;
          return (
            <div key={time} className={`time-slot ${isAdmin && understaffed ? 'understaffed' : ''}`}>
              <div className="time-label">{time}</div>
              <div className='time-users'>
                {availableUsers.length === 0 && unavailableUsers.length === 0 && (
                  <div className='users-count no-users'>Нет сотрудников</div>
                )}
                {availableUsers.map(u => (
                  <div key={u.userId} className='users-count has-users'>{u.userName}</div>
                ))}
                {unavailableUsers.length > 0 && (
                  <div
                    className="cannot-work-indicator"
                    data-tooltip={unavailableUsers.map(u => u.userName).join(', ')}
                  >
                    −{unavailableUsers.length}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
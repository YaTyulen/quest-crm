// src/components/ScheduleGrid/ScheduleGrid.tsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { timeSlots } from '../../utils/scheduleUtils';
import './ScheduleGrid.scss';
import type { UserSchedule } from '../../types/schedule';

export const ScheduleGrid: React.FC = () => {
  const { user } = useAuth();
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
            isActive: data.isActive !== undefined ? data.isActive : true
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
    const available = schedules
      .filter(schedule => {
        const daySchedule = schedule.availability?.[date];
        return daySchedule?.[time] === true;
      })
      .map(schedule => ({
        userId: schedule.userId,
        userName: schedule.userName,
      }));
    
    return available;
  };

  if (loading) {
    return <div>Загрузка расписания...</div>;
  }


  // отображение доступного сотрудника
  const userNameBuild = (user: {userId: string, userName: string}) => {
    return <div className='users-count has-users'>
      {user.userName}
    </div>
  }

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

      {/* Сетка расписания */}
      <div className="time-slots">
        {timeSlots.map(time => {
          const availableUsers = getAvailableUsers(selectedDate, time);
          return (
            <div 
              key={time} 
              className="time-slot"
            >
              <div className="time-label">{time}</div>
              <div className='time-users'>
                {availableUsers.length > 0 
                    ? availableUsers.map((user) => userNameBuild(user))
                    : <div className='users-count no-users'>Нет сотрудников</div>
                }
                
              </div>
              
            </div>
          );
        })}
      </div>
      
    </div>
  );
};
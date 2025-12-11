// components/MySchedule/MySchedule.tsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './MySchedule.scss';
import { useAuth } from '../../hooks/useAuth';
import { generateWeekDates, timeSlots } from '../../utils/scheduleUtils';

export const MySchedule: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availability, setAvailability] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [weekDates, setWeekDates] = useState<string[]>([]);
  
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    // Генерируем даты на текущую неделю
    const dates = generateWeekDates(14);
    setWeekDates(dates);
    
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0]);
    }
    
    loadSchedule();
  }, [user, selectedDate]);
  
  const loadSchedule = async () => {
    if (!user) return;
    
    try {
      const scheduleRef = doc(db, 'schedules', user.uid);
      const scheduleSnap = await getDoc(scheduleRef);
      
      if (scheduleSnap.exists()) {
        const data = scheduleSnap.data();
        setAvailability(data.availability || {});
      } else {
        console.log('Расписание не найдено, создаю новое');
        // Создаем новый документ, если его нет
        const initialData = {
          userId: user.uid,
          userName: user.displayName || user.email?.split('@')[0] || 'Сотрудник',
          userEmail: user.email || '',
          availability: {},
          updatedAt: new Date(),
          isActive: true
        };
        await setDoc(scheduleRef, initialData);
        console.log('Создано новое расписание');
        setAvailability({});
      }
    } catch (error) {
      console.error('Ошибка при загрузке расписания:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleSlot = async (date: string, time: string) => {
    if (!user) return;
    
    try {
      const scheduleRef = doc(db, 'schedules', user.uid);
      const currentAvailability = { ...availability };
      
      // Инициализируем день, если его нет
      if (!currentAvailability[date]) {
        currentAvailability[date] = {};
      }
      
      // Получаем текущее значение (может быть undefined, true или false)
      const currentValue = currentAvailability[date][time];
      
      // Определяем новое значение:
      // undefined -> true -> false -> undefined -> ...
      let newValue;
      if (currentValue === undefined) {
        newValue = true;
      } else if (currentValue === true) {
        newValue = false;
      } else {
        newValue = undefined; // или можно удалить поле
        delete currentAvailability[date][time];
      }
      
      // Если не удаляем поле, устанавливаем значение
      if (newValue !== undefined) {
        currentAvailability[date][time] = newValue;
      }
      
      console.log('Обновляю расписание:', currentAvailability);
      
      // Обновляем в Firestore
      await updateDoc(scheduleRef, {
        availability: currentAvailability,
        updatedAt: new Date()
      });
      
      setAvailability(currentAvailability);
    } catch (error) {
      console.error('Ошибка при обновлении расписания:', error);
    }
  };
  
  const getSlotStatus = (date: string, time: string): 'available' | 'unavailable' | 'unknown' => {
    if (!availability[date] || availability[date][time] === undefined) {
      return 'unknown';
    }
    return availability[date][time] ? 'available' : 'unavailable';
  };
  
  if (loading) {
    return <div>Загрузка вашего расписания...</div>;
  }

  return (
    <div className="my-schedule">
      <h2>Мое расписание</h2>
      
      <div className="week-selector">
        
        {weekDates.map(date => (
          <button
            key={date}
            className={`day-button ${date === selectedDate ? 'active' : ''}`}
            onClick={() => setSelectedDate(date)}
          >
            {new Date(date).toLocaleDateString('ru-RU', { 
              weekday: 'short', 
              day: 'numeric' 
            })}
          </button>
        ))}
      </div>
      
      {selectedDate && (
        <div className="slots-grid">
          {timeSlots.map(time => {
            const status = getSlotStatus(selectedDate, time);
            return (
              <div
                key={time}
                className={`slot ${status}`}
                onClick={() => toggleSlot(selectedDate, time)}
              >
                <span className="slot-time">{time}</span>
                <span className="slot-status">
                  {status === 'available' ? '✓ Могу' : 
                   status === 'unavailable' ? '✗ Не могу' : '? Не указано'}
                </span>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="legend">
        <div className="legend-item">
          <div className="legend-box available"></div>
          <span>Могу взять игру</span>
        </div>
        <div className="legend-item">
          <div className="legend-box unavailable"></div>
          <span>Не могу взять игру</span>
        </div>
        <div className="legend-item">
          <div className="legend-box unknown"></div>
          <span>Не указано</span>
        </div>
      </div>
      

        <div className="instructions">
        <p>Кликните на любой слот, чтобы изменить его статус: доступен → недоступен → не указано</p>
        </div>
    </div>
  );
};
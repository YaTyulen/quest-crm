import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import './ScheduleGrid.scss';
import { db } from '../../firebase';

const days = [
  { key: 'monday', label: 'Понедельник' },
  { key: 'tuesday', label: 'Вторник' },
  { key: 'wednesday', label: 'Среда' },
  { key: 'thursday', label: 'Четверг' },
  { key: 'friday', label: 'Пятница' },
  { key: 'saturday', label: 'Суббота' },
  { key: 'sunday', label: 'Воскресенье' },
];

const timeSlots = [
  '10:00',
  '12:00',
  '14:00',
  '16:00',
  '18:00',
  '20:00',
  '22:00',
];

function getISOWeek(date: Date): { year: number; week: number } {
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((tmp.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    );
  return { year: tmp.getFullYear(), week };
}

function getWeekDates(year: number, week: number): Date[] {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(ISOweekStart);
    d.setDate(ISOweekStart.getDate() + i);
    return d;
  });
}

function generateEmptyWeek() {
  const week: Record<string, any> = {};
  days.forEach(({ key }) => {
    week[key] = {};
    timeSlots.forEach((slot) => {
      week[key][slot] = { booked: false, userId: null };
    });
  });
  return week;
}

export default function ScheduleGrid() {
  const [schedule, setSchedule] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState<{
    year: number;
    week: number;
  }>(getISOWeek(new Date()));

  const fetchSchedule = async (year: number, week: number) => {
    setLoading(true);
    try {
      const weekId = `${year}-${week}`;
      const docRef = doc(db, 'schedule', weekId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setSchedule(docSnap.data());
      } else {
        const emptyWeek = generateEmptyWeek();
        await setDoc(docRef, emptyWeek);
        setSchedule(emptyWeek);
      }
    } catch (err) {
      console.error('Ошибка загрузки расписания:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(currentWeek.year, currentWeek.week);
  }, [currentWeek]);

  const handleAssignUser = async (dayKey: string, slot: string) => {
    const userId = prompt('Введите ID пользователя:');
    if (!userId) return;

    const weekId = `${currentWeek.year}-${currentWeek.week}`;
    const slotRef = doc(db, 'schedule', weekId);

    await setDoc(
      slotRef,
      {
        [dayKey]: {
          [slot]: {
            booked: true,
            userId,
          },
        },
      },
      { merge: true }
    );

    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        reservations: {
          [weekId]: {
            [dayKey]: { [slot]: true },
          },
        },
      },
      { merge: true }
    );

    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [slot]: { booked: true, userId },
      },
    }));
  };

  const handlePrevWeek = () => {
    const date = new Date();
    date.setFullYear(currentWeek.year);
    date.setMonth(0);
    date.setDate(1 + (currentWeek.week - 1) * 7 - 7);
    setCurrentWeek(getISOWeek(date));
  };

  const handleNextWeek = () => {
    const date = new Date();
    date.setFullYear(currentWeek.year);
    date.setMonth(0);
    date.setDate(1 + (currentWeek.week - 1) * 7 + 7);
    setCurrentWeek(getISOWeek(date));
  };

  const weekDates = getWeekDates(currentWeek.year, currentWeek.week);

  if (loading)
    return <p className='schedule-loading'>Загрузка расписания...</p>;

  return (
    <div className='schedule-container'>
      <div className='schedule-header'>
        <button onClick={handlePrevWeek} className='nav-btn'>
          ◀ Предыдущая
        </button>
        <h1>
          Неделя {currentWeek.week}, {currentWeek.year}
        </h1>
        <button onClick={handleNextWeek} className='nav-btn'>
          Следующая ▶
        </button>
      </div>

      <div className='schedule-grid'>
        <div></div>
        {days.map((day, idx) => (
          <div key={day.key} className='day-header'>
            {day.label}
            <div className='day-date'>
              {weekDates[idx].toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
              })}
            </div>
          </div>
        ))}

        {timeSlots.map((slot) => (
          <React.Fragment key={slot}>
            <div className='time-slot'>{slot}</div>
            {days.map((day) => (
              <div
                key={day.key + slot}
                className={`slot ${
                  schedule[day.key]?.[slot]?.booked ? 'booked' : 'free'
                }`}
                onClick={() => handleAssignUser(day.key, slot)}
              >
                {schedule[day.key]?.[slot]?.booked
                  ? `Занято (${schedule[day.key][slot].userId})`
                  : 'Свободно'}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

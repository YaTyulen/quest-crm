// components/MySchedule/MySchedule.tsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import './MySchedule.scss';
import { useAuth } from '../../hooks/useAuth';
import { generateWeekDates, timeSlots } from '../../utils/scheduleUtils';
import { useAppSelector } from '../../hooks/reduxHooks';
import { LOCK_DELAY_HOURS } from '../../config/scheduleConfig';
import {
  submitChangeRequest,
  getUserPendingRequestForDate,
} from '../../utils/scheduleChangeRequests';
import type { ScheduleChangeRequest } from '../../types/scheduleChangeRequest';

export const MySchedule: React.FC = () => {
  const { user } = useAuth();
  const role = useAppSelector((state) => state.signIn.role);
  const [scheduleUserName, setScheduleUserName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availability, setAvailability] = useState<Record<string, Record<string, boolean>>>({});
  const [firstFilledAt, setFirstFilledAt] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [weekDates, setWeekDates] = useState<string[]>([]);

  const [requestDraft, setRequestDraft] = useState<Record<string, boolean> | null>(null);
  const [isRequestMode, setIsRequestMode] = useState(false);
  const [existingRequest, setExistingRequest] = useState<ScheduleChangeRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

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
        setFirstFilledAt(data.firstFilledAt || {});
        setScheduleUserName(data.userName || user.displayName || user.email?.split('@')[0] || '');

        if (selectedDate) {
          const pending = await getUserPendingRequestForDate(user.uid, selectedDate);
          setExistingRequest(pending);
        }
      } else {
        const fallbackUserName = user.displayName || user.email?.split('@')[0] || 'Сотрудник';
        const initialData = {
          userId: user.uid,
          userName: user.displayName || user.email?.split('@')[0] || 'Сотрудник',
          userEmail: user.email || '',
          availability: {},
          updatedAt: new Date(),
          isActive: true,
          role: role ?? 'operator',
        };
        initialData.userName = fallbackUserName;
        await setDoc(scheduleRef, initialData);
        setAvailability({});
        setFirstFilledAt({});
        setScheduleUserName(fallbackUserName);
        setExistingRequest(null);
      }
    } catch (error) {
      console.error('Ошибка при загрузке расписания:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDayLocked = (date: string): boolean => {
    if (role === 'admin') return false;
    const filled = firstFilledAt[date];
    if (!filled) return false;
    const filledMs =
      filled instanceof Timestamp ? filled.toMillis() : new Date(filled).getTime();
    console.log(Date.now() - filledMs, LOCK_DELAY_HOURS * 3600000);
    
    return Date.now() - filledMs >= LOCK_DELAY_HOURS * 3600000;
  };

  const toggleSlot = async (date: string, time: string) => {
    if (!user) return;

    try {
      const scheduleRef = doc(db, 'schedules', user.uid);
      const currentAvailability = { ...availability };

      if (!currentAvailability[date]) {
        currentAvailability[date] = {};
      }

      const currentValue = currentAvailability[date][time];
      console.log('currentValue', currentValue);
      

      let newValue;
      if (currentValue === undefined) {
        newValue = true;
      } else if (currentValue === true) {
        newValue = false;
      } else {
        newValue = undefined;
        delete currentAvailability[date][time];
      }

      if (newValue !== undefined) {
        currentAvailability[date][time] = newValue;
      }

      const isFirstFill =
        role !== 'admin' &&
        !firstFilledAt[date] &&
        newValue === true &&
        !Object.values(availability[date] || {}).some((v) => v === true);

      console.log('isFirstFill', isFirstFill);
      

      const updatePayload: Record<string, any> = {
        availability: currentAvailability,
        updatedAt: new Date(),
      };

      if (isFirstFill) {
        updatePayload[`firstFilledAt.${date}`] = serverTimestamp();
      }

      await updateDoc(scheduleRef, updatePayload);
      setAvailability(currentAvailability);

      if (isFirstFill) {
        setFirstFilledAt((prev) => ({ ...prev, [date]: new Date() }));
      }
    } catch (error) {
      console.error('Ошибка при обновлении расписания:', error);
    }
  };

  const setAllDayStatus = async (date: string, value: boolean) => {
    if (!user) return;
    try {
      const scheduleRef = doc(db, 'schedules', user.uid);
      const currentAvailability = { ...availability };
      currentAvailability[date] = {};
      timeSlots.forEach((time) => {
        currentAvailability[date][time] = value;
      });

      const isFirstFill =
        role !== 'admin' &&
        value === true &&
        !firstFilledAt[date] &&
        !Object.values(availability[date] || {}).some((v) => v === true);

      const updatePayload: Record<string, any> = {
        availability: currentAvailability,
        updatedAt: new Date(),
      };

      if (isFirstFill) {
        updatePayload[`firstFilledAt.${date}`] = serverTimestamp();
      }

      await updateDoc(scheduleRef, updatePayload);
      setAvailability(currentAvailability);

      if (isFirstFill) {
        setFirstFilledAt((prev) => ({ ...prev, [date]: new Date() }));
      }
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

  const getDraftSlotStatus = (time: string): 'available' | 'unavailable' | 'unknown' => {
    if (!requestDraft || requestDraft[time] === undefined) return 'unknown';
    return requestDraft[time] ? 'available' : 'unavailable';
  };

  const toggleDraftSlot = (time: string) => {
    setRequestDraft((prev) => {
      const current = prev ? { ...prev } : {};
      if (current[time] === undefined) {
        current[time] = true;
      } else if (current[time] === true) {
        current[time] = false;
      } else {
        delete current[time];
      }
      return current;
    });
  };

  const handleOpenRequestMode = () => {
    setRequestDraft({ ...(availability[selectedDate] || {}) });
    setIsRequestMode(true);
    setSubmitSuccess(false);
  };

  const handleCancelRequest = () => {
    setIsRequestMode(false);
    setRequestDraft(null);
  };

  const handleSubmitRequest = async () => {
    if (!user || !requestDraft) return;

    const current = availability[selectedDate] || {};
    const isDifferent = timeSlots.some((t) => (current[t] ?? undefined) !== (requestDraft[t] ?? undefined));
    if (!isDifferent) return;

    setSubmitting(true);
    try {
      const requestUserName =
        scheduleUserName || user.displayName || user.email?.split('@')[0] || 'Сотрудник';
      await submitChangeRequest({
        userId: user.uid,
        userName: requestUserName,
        userRole: (role as any) ?? 'operator',
        date: selectedDate,
        requestedAvailability: requestDraft,
        currentAvailability: current,
      });
      setIsRequestMode(false);
      setRequestDraft(null);
      setSubmitSuccess(true);
      const pending = await getUserPendingRequestForDate(user.uid, selectedDate);
      setExistingRequest(pending);
    } catch (error) {
      console.error('Ошибка при отправке запроса:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setIsRequestMode(false);
    setRequestDraft(null);
    setExistingRequest(null);
    setSubmitSuccess(false);
  };

  if (loading) {
    return <div>Загрузка вашего расписания...</div>;
  }

  const locked = selectedDate ? isDayLocked(selectedDate) : false;

  return (
    <div className="my-schedule">
      <h2>Мое расписание</h2>

      <div className="week-selector">
        {weekDates.map((date) => (
          <button
            key={date}
            className={`day-button ${date === selectedDate ? 'active' : ''}${isDayLocked(date) ? ' locked' : ''}`}
            onClick={() => handleSelectDate(date)}
          >
            {new Date(date).toLocaleDateString('ru-RU', {
              weekday: 'short',
              day: 'numeric',
            })}
          </button>
        ))}
      </div>

      {selectedDate && !locked && (
        <div className="day-actions">
          <button className="day-action-btn available" onClick={() => setAllDayStatus(selectedDate, true)}>
            Могу весь день
          </button>
          <button className="day-action-btn unavailable" onClick={() => setAllDayStatus(selectedDate, false)}>
            Не могу в этот день
          </button>
        </div>
      )}

      {selectedDate && locked && (
        <>
          {isRequestMode ? (
            <>
              <div className="request-draft-label">Желаемое расписание:</div>
              <div className="request-draft-grid">
                {timeSlots.map((time) => {
                  const status = getDraftSlotStatus(time);
                  return (
                    <div
                      key={time}
                      className={`slot ${status}`}
                      onClick={() => toggleDraftSlot(time)}
                    >
                      <span className="slot-time">{time}</span>
                      <span className="slot-status">
                        {status === 'available'
                          ? '✓ Могу'
                          : status === 'unavailable'
                          ? '✗ Не могу'
                          : '? Не указано'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="request-actions">
                <button
                  className="day-action-btn available"
                  onClick={handleSubmitRequest}
                  disabled={submitting}
                >
                  {submitting ? 'Отправка...' : 'Отправить запрос'}
                </button>
                <button className="day-action-btn unavailable" onClick={handleCancelRequest}>
                  Отмена
                </button>
              </div>
            </>
          ) : existingRequest ? (
            <div className="pending-request-banner">
              <strong>Запрос на изменение уже отправлен</strong>
              <span>Ожидается решение администратора</span>
            </div>
          ) : (
            <>
              {submitSuccess && (
                <div className="submit-success-banner">Запрос успешно отправлен!</div>
              )}
              <div className="locked-banner">
                <strong>🔒 Расписание заблокировано</strong>
                <span>
                  Прошло более {LOCK_DELAY_HOURS} ч. с момента первого заполнения. Для изменения
                  отправьте запрос на согласование.
                </span>
                <button className="day-action-btn available lock-request-btn" onClick={handleOpenRequestMode}>
                  Запросить изменение
                </button>
              </div>
            </>
          )}

          <div className="slots-grid">
            {timeSlots.map((time) => {
              const status = getSlotStatus(selectedDate, time);
              return (
                <div key={time} className={`slot ${status} locked`}>
                  <span className="slot-time">{time}</span>
                  <span className="slot-status">
                    {status === 'available'
                      ? '✓ Могу'
                      : status === 'unavailable'
                      ? '✗ Не могу'
                      : '? Не указано'}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectedDate && !locked && (
        <div className="slots-grid">
          {timeSlots.map((time) => {
            const status = getSlotStatus(selectedDate, time);
            console.log('status', status);
            
            return (
              <div
                key={time}
                className={`slot ${status}`}
                onClick={() => toggleSlot(selectedDate, time)}
              >
                <span className="slot-time">{time}</span>
                <span className="slot-status">
                  {status === 'available'
                    ? '✓ Могу'
                    : status === 'unavailable'
                    ? '✗ Не могу'
                    : '? Не указано'}
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

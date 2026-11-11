import { useEffect, useState } from 'react';

export const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const dateValue = (date: string) => new Date(date + 'T12:00:00');
export function monthAhead(from: string) {
  const date = dateValue(from);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + 1);
  date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
  return localDate(date);
}
export const makeDates = (today: string, count: number) => Array.from({ length: count }, (_, index) => {
  const date = dateValue(today); date.setDate(date.getDate() + index); return localDate(date);
});
export const useScheduleToday = () => {
  const [today, setToday] = useState(() => localDate(new Date()));
  useEffect(() => {
    const refreshToday = () => setToday(localDate(new Date()));
    const timer = window.setInterval(refreshToday, 60000);
    window.addEventListener('focus', refreshToday);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refreshToday); };
  }, []);
  return today;
};

const bookingClock = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tomsk', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const readBookingClock = () => {
  const parts = Object.fromEntries(bookingClock.formatToParts(new Date()).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
};
export function useBookingClock() {
  const [now, setNow] = useState(readBookingClock);
  useEffect(() => {
    const refresh = () => setNow(readBookingClock());
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  const [today, time] = now.split(' ');
  return { today, time };
}

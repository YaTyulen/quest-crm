// utils/scheduleUtils.ts
export const timeSlots = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

export const generateWeekDates = (daysAhead: number): string[] => {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};

// Хелпер для проверки правильности времени
export const isValidTimeSlot = (time: string): boolean => {
  return timeSlots.includes(time);
};
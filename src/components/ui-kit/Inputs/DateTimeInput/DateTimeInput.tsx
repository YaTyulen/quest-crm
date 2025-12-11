import './DateTimeInput.scss';

interface DateTimeInputProps {
  label: string;
  value: number | null; // timestamp (ms)
  onChange: (value: number | null) => void;
}

export const DateTimeInput = ({
  label,
  value,
  onChange,
}: DateTimeInputProps) => {
  const dateObj = value ? new Date(value) : null;

  // Дата в формате yyyy-MM-dd для <input type="date">
  const datePart = dateObj
    ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(dateObj.getDate()).padStart(2, '0')}`
    : '';

  // Время в формате HH:mm для <input type="time">
  const timePart = dateObj
    ? `${String(dateObj.getHours()).padStart(2, '0')}:${String(
        dateObj.getMinutes()
      ).padStart(2, '0')}`
    : '';

  const handleChange = (date: string, time: string) => {
    if (!date && !time) {
      onChange(null);
      return;
    }

    const [year, month, day] = (date || datePart).split('-').map(Number);
    const [hours, minutes] = (time || timePart || '00:00')
      .split(':')
      .map(Number);

    const combined = new Date(year, month - 1, day, hours, minutes);

    onChange(isNaN(combined.getTime()) ? null : combined.getTime());
  };

  return (
    <div className='date-time-input__container'>
      <div className='date-time-input__group'>
        <input
          name={`${label}-date`}
          className='date-time-input__input'
          type='date'
          value={datePart}
          onChange={(e) => handleChange(e.target.value, timePart)}
        />
        <label className='date-time-input__label'>Дата</label>
      </div>
      <div className='date-time-input__group'>
        <input
          name={`${label}-time`}
          className='date-time-input__input'
          type='time'
          value={timePart}
          onChange={(e) => handleChange(datePart, e.target.value)}
        />
        <label className='date-time-input__label'>Время</label>
      </div>
    </div>
  );
};

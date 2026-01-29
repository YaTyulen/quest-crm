import './DateRangePicker.scss';

interface DateRange {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const DateRangePicker = ({ value, onChange }: DateRangePickerProps) => {
  return (
    <div className="date-range-picker">
      <input
        type="date"
        value={value.from}
        onChange={(e) =>
          onChange({ ...value, from: e.target.value })
        }
      />

      <span className="date-range-picker__separator">—</span>

      <input
        className='date-range-picker__input'
        type="date"
        value={value.to}
        onChange={(e) =>
          onChange({ ...value, to: e.target.value })
        }
      />
    </div>
  );
};

export default DateRangePicker;

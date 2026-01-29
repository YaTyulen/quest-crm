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
    <div style={{ display: 'flex', gap: 8 }}>
      <input
        type="date"
        value={value.from}
        onChange={(e) =>
          onChange({ ...value, from: e.target.value })
        }
      />
      <span>—</span>
      <input
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

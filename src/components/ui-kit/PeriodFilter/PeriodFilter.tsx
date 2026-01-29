import { useState } from 'react';

import './PeriodFilter.scss';
import DateRangePicker from '../DateRangePicker/DateRangePicker';

type Preset = '7d' | '30d' | 'all' | 'custom';

interface DateRange {
  from: string;
  to: string;
}

interface PeriodFilterProps {
  onChange: (range: DateRange | null) => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const PeriodFilter = ({ onChange }: PeriodFilterProps) => {
  const [preset, setPreset] = useState<Preset>('30d');
  const [customRange, setCustomRange] = useState<DateRange>({
    from: '',
    to: '',
  });

  const applyPreset = (type: Preset) => {
    const now = new Date();
    setPreset(type);

    if (type === '7d') {
      onChange({
        from: new Date(now.getTime() - 7 * 86400000)
          .toISOString()
          .slice(0, 10),
        to: todayISO(),
      });
    }

    if (type === '30d') {
      onChange({
        from: new Date(now.getTime() - 30 * 86400000)
          .toISOString()
          .slice(0, 10),
        to: todayISO(),
      });
    }

    if (type === 'all') {
      onChange(null);
    }
  };

  const openCustom = () => {
    const to = todayISO();
    const from = new Date(
      new Date().getTime() - 30 * 86400000
    )
      .toISOString()
      .slice(0, 10);

    const range = { from, to };

    setCustomRange(range);
    setPreset('custom');
    onChange(range);
  };

  return (
    <div className="period-filter">
      <div className="period-filter__buttons">
        <button
          className={preset === 'all' ? 'active' : ''}
          onClick={() => applyPreset('all')}
        >
          Весь период
        </button>

        <button
          className={preset === '7d' ? 'active' : ''}
          onClick={() => applyPreset('7d')}
        >
          7 дней
        </button>

        <button
          className={preset === '30d' ? 'active' : ''}
          onClick={() => applyPreset('30d')}
        >
          30 дней
        </button>

        <button
          className={preset === 'custom' ? 'active' : ''}
          onClick={openCustom}
        >
          Свой период
        </button>

      </div>

      {preset === 'custom' && (
        <div className="period-filter__range">
          <DateRangePicker
            value={customRange}
            onChange={(range) => {
              setCustomRange(range);
              onChange(range);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PeriodFilter;

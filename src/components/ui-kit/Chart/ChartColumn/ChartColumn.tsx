import './ChartColumn.scss'

interface ChartColumnProps {
    value: number,
    name: string,
    maxValue: number,
}

const ChartColumn = ({ value, name, maxValue }: ChartColumnProps) => {
  const height = maxValue
    ? `${(value * 100) / maxValue}%`
    : '0%';

  return (
    <div className="column">
      <div className="column__bar-wrapper">
        <div className="column__value">{value}</div>
        <div
          className="column__bar"
          style={{ height }}
        />
      </div>
      <div className="column__label">{name}</div>
    </div>
  );
};


export default ChartColumn;

import ChartColumn from "./ChartColumn/ChartColumn";
import './Chart.scss'

interface ChartProps {
  data?: { [key: string]: number };
  maxValue: number;
}

const Chart = ({ data, maxValue }: ChartProps) => {
  if (!data) return null;

  return (
    <div className="chart">
      {Object.entries(data).map(([key, value]) => (
        <ChartColumn
          key={key}
          value={value}
          name={key}
          maxValue={maxValue}
        />
      ))}
    </div>
  );
};

export default Chart;

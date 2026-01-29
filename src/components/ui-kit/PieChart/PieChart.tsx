import './PieChart.scss'

interface PieChartProps {
    data: {[key: string]: number}
}

const COLORS = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'];

const PieChart = ({ data }: PieChartProps) => {
    const entries = Object.entries(data);   
    const total = Object.values(data).reduce((sum, v) => sum + v, 0);

    let currentAngle = 0;

    const gradient = entries.map(([, value], index) => {
      const percentage = (value / total) * 100;
      const start = currentAngle;
      const end = currentAngle + percentage;
      currentAngle = end;

      return `${COLORS[index % COLORS.length]} ${start}% ${end}%`;
    }).join(', ');

  return (
    <div className="pie-chart">
      <div
        className="pie-chart__diagram"
        style={{ background: `conic-gradient(${gradient})` }}
      />

      <ul className="pie-chart__legend">
        {entries.map(([label, value], index) => {
          const percent = ((value / total) * 100).toFixed(1);

          return (
            <li key={label} className="pie-chart__legend-item">
              <span
                className="pie-chart__legend-color"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="pie-chart__legend-label">{label}</span>
              <span className="pie-chart__legend-value">({percent}%)</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PieChart;

import "./chart.css";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface LanguagesChartProps {
  languages: Array<{
    name: string;
    percentage: number;
  }>;
}

const COLORS = [
  "#FF6F61",
  "#FFD95F",
  "#FFA552",
  "#111111",
  "#F6D7CF",
];

type PieLabelProps = {
  name?: string;
  percent?: number;
};

const renderCustomLabel = ({ name, percent }: PieLabelProps) => {
  if (!name || !percent || percent < 0.05) return null;
  return `${name} ${Math.round(percent * 100)}%`;
};

const LanguagesChart = ({ languages }: LanguagesChartProps) => {
  const data = languages.map((lang) => ({
    name: lang.name,
    value: lang.percentage,
  }));

  return (
    <div className="languages-container">
      <div className="chart-card">
        <h3 className="chart-title">Languages Used</h3>

        {data.length === 0 ? (
          <p>Language data unavailable for this repository.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={105}
                  innerRadius={55}
                  paddingAngle={3}
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {data.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, "Usage"]} />
              </PieChart>
            </ResponsiveContainer>

            <div className="chart-legend">
              {data.map((item, index) => (
                <div key={item.name} className="chart-legend-item">
                  <span
                    className="chart-legend-color"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="chart-legend-text">
                    {item.name} — {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LanguagesChart;
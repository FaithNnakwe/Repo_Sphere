import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

type PullRequestItem = {
  name: string;
  value: number;
};

type PullRequestProps = {
  data: PullRequestItem[];
};

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function PullRequest({ data }: PullRequestProps) {
  return (
    <div className="reports-chart-card">
      <div className="reports-card-header">
        <h3>Pull Request Breakdown</h3>
      </div>

      <div className="reports-chart-wrap">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={90}
              dataKey="value"
              nameKey="name"
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
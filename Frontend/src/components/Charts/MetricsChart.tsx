import "./chart.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LabelList,
} from "recharts";

interface MetricsChartProps {
  repository: string;
  commitCount: number;
  pullRequestCount: number;
  latestCommitMessage: string;
  issueCount?: number;
}
const tooltipFormatter = (value: unknown) => [`${value}`, "Count"];
const MetricsChart = ({
  repository,
  commitCount,
  pullRequestCount,
  latestCommitMessage,
  issueCount = 0,
}: MetricsChartProps) => {
  const data = [
    { name: "Commits", value: commitCount, fill: "#FF6F61" },
    { name: "Pull Requests", value: pullRequestCount, fill: "#FFD95F" },
    { name: "Issues", value: issueCount, fill: "#FFA552" },
  ];

  const tooltipFormatter = (value: number) => [`${value}`, "Count"];

  return (
    <div className="metrics-container">
      <div className="chart-card">
        <div className="chart-heading">
          <h3 className="chart-title">Metrics Overview</h3>
          <p className="chart-subtitle">
            {repository ? repository : "No repository selected"}
          </p>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            barCategoryGap="22%"
            margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value: unknown) => [`${value}`, "Count"]}
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #eaeaea",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              }}
            />
            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
              <LabelList dataKey="value" position="top" />
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <p className="latest-commit">
          <strong>Latest Commit:</strong> {latestCommitMessage}
        </p>
      </div>
    </div>
  );
};

export default MetricsChart;

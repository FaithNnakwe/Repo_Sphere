import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type IssueOverviewItem = {
  week: string;
  opened: number;
  closed: number;
};

type IssueOverviewProps = {
  data: IssueOverviewItem[];
};

export default function IssueOverview({ data }: IssueOverviewProps) {
  return (
    <div className="reports-chart-card reports-chart-card-wide">
      <div className="reports-card-header">
        <h3>Issue Overview</h3>
      </div>

      <div className="reports-chart-wrap">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="2 2" vertical={false} />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="opened"
              stroke="var(--chart-1)"
              strokeWidth={3}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="closed"
              stroke="var(--chart-4)"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
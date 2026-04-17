import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type CommitActivityItem = {
  week: string;
  commits: number;
};

type CommitActivityProps = {
  data: CommitActivityItem[];
};

export default function CommitActivity({ data }: CommitActivityProps) {
  return (
    <div className="reports-chart-card">
      <div className="reports-card-header">
        <h3>Commit Activity</h3>
      </div>

      <div className="reports-chart-wrap">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="2 2" vertical={false} />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="commits" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
import "./chart.css";

interface MetricsChartProps {
  repository: string;
  commitCount: number;
  pullRequestCount: number;
  latestCommitMessage: string;
}

const MetricsChart = ({
  repository,
  commitCount,
  pullRequestCount,
  latestCommitMessage,
}: MetricsChartProps) => {
  return (
    <div className="metrics-container">
      <div className="chart-card">
        <h3 className="chart-title">Metrics Overview</h3>
        <div className="chart-placeholder metrics-summary">
          <p><strong>Repository:</strong> {repository || "Not selected"}</p>
          <p><strong>Recent Commits:</strong> {commitCount}</p>
          <p><strong>Open Pull Requests:</strong> {pullRequestCount}</p>
          <p><strong>Latest Commit message:</strong> {latestCommitMessage}</p>
        </div>
      </div>
    </div>
  );
};

export default MetricsChart;

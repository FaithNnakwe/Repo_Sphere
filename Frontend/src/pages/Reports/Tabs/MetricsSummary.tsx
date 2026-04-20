import { BarChart3, GitPullRequest, ShieldCheck, Users } from "lucide-react";

type SummaryData = {
  totalCommits: number;
  commitGrowth: string;
  pullRequests: number;
  pullRequestGrowth: string;
  activeContributors: number;
  contributorGrowth: string;
  codeCoverage: number;
  coverageGrowth: string;
};

type MetricCardProps = {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
};

type MetricsSummaryProps = {
  summary: SummaryData;
};

function MetricCard({ title, value, change, icon }: MetricCardProps) {
  return (
    <div className="reports-metric-card">
      <div className="reports-metric-top">
        <div className="reports-metric-icon">{icon}</div>
        <span className="reports-metric-title">{title}</span>
      </div>

      <div className="reports-metric-value">{value}</div>
      <div className="reports-metric-change">{change}</div>
    </div>
  );
}

export default function MetricsSummary({ summary }: MetricsSummaryProps) {
  return (
    <section className="reports-section-card">
      <div className="reports-section-card-header">
        <div className="reports-section-card-title-wrap">
          <h2 className="reports-section-title">Metrics Summary</h2>
          <p>Quick snapshot of repository performance for the selected timeframe.</p>
        </div>

        <div className="reports-section-card-icon">
          <BarChart3 size={18} />
        </div>
      </div>

      <div className="reports-metrics-grid">
        <MetricCard
          title="Total Commits"
          value={summary.totalCommits.toLocaleString()}
          change={summary.commitGrowth}
          icon={<BarChart3 size={20} />}
        />

        <MetricCard
          title="Pull Requests"
          value={summary.pullRequests.toLocaleString()}
          change={summary.pullRequestGrowth}
          icon={<GitPullRequest size={20} />}
        />

        <MetricCard
          title="Active Contributors"
          value={summary.activeContributors.toLocaleString()}
          change={summary.contributorGrowth}
          icon={<Users size={20} />}
        />

        <MetricCard
          title="Code Coverage"
          value={`${summary.codeCoverage}%`}
          change={summary.coverageGrowth}
          icon={<ShieldCheck size={20} />}
        />
      </div>
    </section>
  );
}
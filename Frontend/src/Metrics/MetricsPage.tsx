import React, { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { format, subMonths, parseISO } from 'date-fns';
import {
  getCommitActivity, getPullRequestActivity, getIssueActivity,
  getCodeFrequency, getContributorStats, getWeeklyCommitData,
  getDailyActivityHeatmap, type CommitActivity, type PullRequestActivity,
  type IssueActivity, type CodeFrequency, type ContributorStats,
  type WeeklyCommitData, type DailyActivity, type MetricsTimeRange
} from '../api';
import './MetricsPage.css';

interface MetricsPageProps {
  owner: string;
  repo: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const CHART_COLORS = {
  commits: '#8884d8',
  additions: '#82ca9d',
  deletions: '#ff6b6b',
  opened: '#4ecdc4',
  closed: '#ff6b6b',
  merged: '#45b7d1'
};

interface CalendarValue {
  date: string;
  count: number;
}

const MetricsPage: React.FC<MetricsPageProps> = ({ owner, repo }) => {
  const [timeRange, setTimeRange] = useState<MetricsTimeRange>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'commits' | 'pulls' | 'issues' | 'contributors'>('overview');
  
  const [commitData, setCommitData] = useState<CommitActivity[]>([]);
  const [prData, setPrData] = useState<PullRequestActivity[]>([]);
  const [issueData, setIssueData] = useState<IssueActivity[]>([]);
  const [codeFreqData, setCodeFreqData] = useState<CodeFrequency[]>([]);
  const [contributors, setContributors] = useState<ContributorStats[]>([]);
  const [, setWeeklyData] = useState<WeeklyCommitData[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarValue[]>([]);

  useEffect(() => {
    const fetchAllMetrics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [
          commits, pulls, issues, codeFreq, contributorsData, weeklyCommits, dailyHeatmap
        ] = await Promise.all([
          getCommitActivity(owner, repo, timeRange),
          getPullRequestActivity(owner, repo, timeRange),
          getIssueActivity(owner, repo, timeRange),
          getCodeFrequency(owner, repo, timeRange),
          getContributorStats(owner, repo),
          getWeeklyCommitData(owner, repo),
          getDailyActivityHeatmap(owner, repo)
        ]);
        
        setCommitData(commits);
        setPrData(pulls);
        setIssueData(issues);
        setCodeFreqData(codeFreq);
        setContributors(contributorsData);
        setWeeklyData(weeklyCommits);
        setDailyActivity(dailyHeatmap);
        
        const calendarMap = new Map<string, number>();
        weeklyCommits.forEach((week: WeeklyCommitData) => {
          const weekDate = new Date(week.week * 1000);
          for (let i = 0; i < week.days.length; i++) {
            const date = new Date(weekDate);
            date.setDate(weekDate.getDate() + i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const count = week.days[i];
            if (count > 0) {
              calendarMap.set(dateStr, (calendarMap.get(dateStr) || 0) + count);
            }
          }
        });
        
        const calendarArray = Array.from(calendarMap.entries()).map(([date, count]) => ({
          date,
          count
        }));
        setCalendarData(calendarArray);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (owner && repo) {
      fetchAllMetrics();
    }
  }, [owner, repo, timeRange]);

  const commitChartData = useMemo(() => {
    return commitData.map(item => ({
      date: format(parseISO(item.date), 'MMM dd'),
      commits: item.count,
      fullDate: item.date
    }));
  }, [commitData]);

  const prChartData = useMemo(() => {
    return prData.map(item => ({
      date: format(parseISO(item.date), 'MMM dd'),
      opened: item.opened,
      closed: item.closed,
      merged: item.merged,
      fullDate: item.date
    }));
  }, [prData]);

  const issueChartData = useMemo(() => {
    return issueData.map(item => ({
      date: format(parseISO(item.date), 'MMM dd'),
      opened: item.opened,
      closed: item.closed,
      fullDate: item.date
    }));
  }, [issueData]);

  const codeFreqChartData = useMemo(() => {
    return codeFreqData.map(item => ({
      date: format(parseISO(item.date), 'MMM dd'),
      additions: item.additions,
      deletions: item.deletions,
      net: item.net,
      fullDate: item.date
    }));
  }, [codeFreqData]);

  const activityMatrix = useMemo(() => {
    const matrix: { [key: string]: number } = {};
    dailyActivity.forEach(activity => {
      matrix[`${activity.day}-${activity.hour}`] = activity.count;
    });
    return matrix;
  }, [dailyActivity]);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hoursOfDay = Array.from({ length: 24 }, (_, i) => i);

  const contributorPieData = useMemo(() => {
    const topContributors = contributors.slice(0, 5);
    const others = contributors.slice(5);
    const othersTotal = others.reduce((sum, c) => sum + c.commits, 0);
    
    const data = topContributors.map(c => ({
      name: c.name || c.login,
      value: c.commits,
      commits: c.commits,
      additions: c.additions,
      deletions: c.deletions
    }));
    
    if (othersTotal > 0) {
      data.push({ name: 'Others', value: othersTotal, commits: othersTotal, additions: 0, deletions: 0 });
    }
    
    return data;
  }, [contributors]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {data.commits !== undefined && (
            <p className="tooltip-commits">Commits: {data.commits}</p>
          )}
          {data.additions !== undefined && (
            <p className="tooltip-additions">+{data.additions} lines</p>
          )}
          {data.deletions !== undefined && (
            <p className="tooltip-deletions">-{data.deletions} lines</p>
          )}
          {data.net !== undefined && (
            <p className="tooltip-net">Net: {data.net} lines</p>
          )}
          {data.opened !== undefined && (
            <>
              <p className="tooltip-opened">Opened: {data.opened}</p>
              <p className="tooltip-closed">Closed: {data.closed}</p>
              {data.merged !== undefined && (
                <p className="tooltip-merged">Merged: {data.merged}</p>
              )}
            </>
          )}
          <p className="tooltip-date">
            {data.fullDate && format(parseISO(data.fullDate), 'MMMM d, yyyy')}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading repository metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="metrics-container">
      {/* Header */}
      <div className="metrics-header">
        <div className="metrics-header-content">
          <div className="metrics-title">
            <h1>Repository Insights</h1>
            <p>{owner}/{repo}</p>
          </div>
          <div className="time-range-selector">
            {(['7d', '30d', '90d', '1y', 'all'] as MetricsTimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`time-range-btn ${timeRange === range ? 'active' : ''}`}
              >
                {range === 'all' ? 'All' : range}
              </button>
            ))}
          </div>
        </div>
        
        <div className="metrics-tabs">
          {(['overview', 'commits', 'pulls', 'issues', 'contributors'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`metrics-tab ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Commits</div>
              <div className="stat-value">
                {commitData.reduce((sum, d) => sum + d.count, 0)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pull Requests</div>
              <div className="stat-value">
                {prData.reduce((sum, d) => sum + d.opened, 0)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Issues</div>
              <div className="stat-value">
                {issueData.reduce((sum, d) => sum + d.opened, 0)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Lines Changed</div>
              <div className="stat-value">
                {codeFreqData.reduce((sum, d) => sum + d.additions + d.deletions, 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h2 className="chart-title">Contribution Calendar</h2>
            <div className="heatmap-container">
              <CalendarHeatmap
                startDate={subMonths(new Date(), 11)}
                endDate={new Date()}
                values={calendarData}
                classForValue={(value: any) => {
                  if (!value || !value.count || value.count === 0) return 'color-empty';
                  if (value.count < 3) return 'color-scale-1';
                  if (value.count < 6) return 'color-scale-2';
                  if (value.count < 9) return 'color-scale-3';
                  return 'color-scale-4';
                }}
                titleForValue={(value: any) => {
                  if (!value || !value.date) return 'No contributions';
                  return `${value.count} contributions on ${format(parseISO(value.date), 'MMM d, yyyy')}`;
                }}
                showWeekdayLabels={true}
              />
            </div>
          </div>

          <div className="chart-card">
            <h2 className="chart-title">Commit Activity Timeline</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={commitChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="commits" stroke={CHART_COLORS.commits} fill={CHART_COLORS.commits} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h2 className="chart-title">Code Changes Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={codeFreqChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="additions" stroke={CHART_COLORS.additions} fill={CHART_COLORS.additions} fillOpacity={0.3} />
                <Area type="monotone" dataKey="deletions" stroke={CHART_COLORS.deletions} fill={CHART_COLORS.deletions} fillOpacity={0.3} />
                <Line type="monotone" dataKey="net" stroke={CHART_COLORS.merged} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h2 className="chart-title">Activity Heatmap (by day & hour)</h2>
            <div className="heatmap-container">
              <table className="heatmap-table">
                <thead>
                  <tr>
                    <th></th>
                    {hoursOfDay.map(hour => (
                      <th key={hour}>{hour.toString().padStart(2, '0')}:00</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {daysOfWeek.map(day => (
                    <tr key={day}>
                      <td className="heatmap-day-label">{day}</td>
                      {hoursOfDay.map(hour => {
                        const count = activityMatrix[`${day}-${hour}`] || 0;
                        return (
                          <td
                            key={`${day}-${hour}`}
                            className="heatmap-cell"
                            style={{
                              backgroundColor: count === 0 ? '#ebedf0' :
                                count < 5 ? '#9be9a8' :
                                count < 10 ? '#40c463' :
                                count < 20 ? '#30a14e' : '#216e39',
                              color: count > 5 ? 'white' : '#1f2937'
                            }}
                          >
                            <div className="heatmap-cell-content">
                              {count > 0 && count}
                            </div>
                            {count > 0 && (
                              <div className="heatmap-tooltip">
                                {count} commits on {day}s at {hour}:00
                              </div>
                            )}
                           </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Commits Tab */}
      {activeTab === 'commits' && (
        <>
          <div className="chart-card">
            <h2 className="chart-title">Commit History</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={commitChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="commits" fill={CHART_COLORS.commits} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h2 className="chart-title">Recent Commits</h2>
            <div className="commits-list">
              {commitData.slice(0, 20).map((commit, idx) => (
                <div key={idx} className="commit-item">
                  <div className="commit-header">
                    <p className="commit-message">{commit.messages[0] || 'No message'}</p>
                    <span className="commit-badge">{commit.count}</span>
                  </div>
                  <p className="commit-date">
                    {commit.count} commit{commit.count !== 1 ? 's' : ''} on {format(parseISO(commit.date), 'MMMM d, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Pull Requests Tab */}
      {activeTab === 'pulls' && (
        <>
          <div className="chart-card">
            <h2 className="chart-title">Pull Request Activity</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={prChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="opened" stroke={CHART_COLORS.opened} strokeWidth={2} />
                <Line type="monotone" dataKey="closed" stroke={CHART_COLORS.closed} strokeWidth={2} />
                <Line type="monotone" dataKey="merged" stroke={CHART_COLORS.merged} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total PRs Opened</div>
              <div className="stat-value" style={{ color: '#4ecdc4' }}>
                {prData.reduce((sum, d) => sum + d.opened, 0)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">PRs Merged</div>
              <div className="stat-value" style={{ color: '#45b7d1' }}>
                {prData.reduce((sum, d) => sum + d.merged, 0)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">PRs Closed</div>
              <div className="stat-value" style={{ color: '#ff6b6b' }}>
                {prData.reduce((sum, d) => sum + d.closed, 0)}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Issues Tab */}
      {activeTab === 'issues' && (
        <div className="chart-card">
          <h2 className="chart-title">Issue Activity</h2>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={issueChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="opened" stackId="1" stroke={CHART_COLORS.opened} fill={CHART_COLORS.opened} fillOpacity={0.6} />
              <Area type="monotone" dataKey="closed" stackId="1" stroke={CHART_COLORS.closed} fill={CHART_COLORS.closed} fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Contributors Tab */}
      {activeTab === 'contributors' && (
        <div className="contributors-grid">
          <div className="chart-card">
            <h2 className="chart-title">Commit Distribution</h2>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={contributorPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {contributorPieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h2 className="chart-title">Contributor Details</h2>
            <div className="contributors-table-container">
              <table className="contributors-table">
                <thead>
                  <tr>
                    <th>Contributor</th>
                    <th>Commits</th>
                    <th>Additions</th>
                    <th>Deletions</th>
                  </tr>
                </thead>
                <tbody>
                  {contributors.map(contributor => (
                    <tr key={contributor.login}>
                      <td>
                        <div className="contributor-info">
                          <img src={contributor.avatar} alt={contributor.login} className="contributor-avatar" />
                          <div>
                            <div className="contributor-name">{contributor.name || contributor.login}</div>
                            <div className="contributor-username">@{contributor.login}</div>
                          </div>
                        </div>
                      </td>
                      <td className="commit-count">{contributor.commits}</td>
                      <td className="additions">+{contributor.additions.toLocaleString()}</td>
                      <td className="deletions">-{contributor.deletions.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsPage;
import "./dashboard.css";
import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";
import AlertBanner from "../AlertBanner/AlertBanner";
import StatsGrid from "../Cards/StatsGrid";
import MetricsChart from "../Charts/MetricsChart";
import TeamContribution from "../TeamContribution/TeamContribution";
import LanguagesChart from "../Charts/LanguagesChart";

interface DashboardProps {
  repositories: string[];
  selectedRepository: string;
  onRepositoryChange: (repository: string) => void;
  stats: Array<{
    icon: string;
    label: string;
    value: string | number;
  }>;
  alertMessage: string;
  alertIcon: string;
  isLoading: boolean;
  teamMembers: Array<{
    name: string;
    commits: number;
    pullRequests: number;
    issues: number;
    percentage: number;
  }>;
  commitCount: number;
  pullRequestCount: number;
  latestCommitMessage: string;
  languages: Array<{
    name: string;
    percentage: number;
  }>;
  userInfo: {
    displayName: string;
    githubUser: string;
    avatarUrl: string;
  };
  onLogout: () => void;
  onChangeDisplayName: () => void;
  onGenerateReport?: () => void;
  isGeneratingReport?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const Dashboard = ({
  repositories,
  selectedRepository,
  onRepositoryChange,
  stats,
  alertMessage,
  alertIcon,
  isLoading,
  teamMembers,
  commitCount,
  pullRequestCount,
  latestCommitMessage,
  languages,
  userInfo,
  onLogout,
  onChangeDisplayName,
  onGenerateReport,
  isGeneratingReport,
  activeTab,
  onTabChange,
}: DashboardProps) => {
  return (
    <div className="dashboard-container">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={onTabChange}
        onGenerateReport={onGenerateReport}
        isGeneratingReport={isGeneratingReport}
      />
      
      <div className="dashboard-main">
        <Header
          repositories={repositories}
          selectedRepository={selectedRepository}
          onRepositoryChange={onRepositoryChange}
          isLoading={isLoading}
          userInfo={userInfo}
          onLogout={onLogout}
          onChangeDisplayName={onChangeDisplayName}
        />
        
        <div className="dashboard-content">
          <div className="content-header">
            <h1>{activeTab || "Repository Dashboard"}</h1>
            <p>
              {selectedRepository
                ? `Shared metrics view for ${selectedRepository}`
                : "Track contributions and insights across your repository"}
            </p>
          </div>

          <AlertBanner message={alertMessage} icon={alertIcon} />
          
          {/* Add an id to the content you want to capture for PDF */}
          <div id="report-content">
            <StatsGrid stats={stats} />
            
            <MetricsChart
              repository={selectedRepository}
              commitCount={commitCount}
              pullRequestCount={pullRequestCount}
              latestCommitMessage={latestCommitMessage}
            />
            
            <TeamContribution members={teamMembers} />
            
            <LanguagesChart languages={languages} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
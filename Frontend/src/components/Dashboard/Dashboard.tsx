import "./dashboard.css";
import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";
import AlertBanner from "../AlertBanner/AlertBanner";
import StatsGrid from "../Cards/StatsGrid";
import MetricsChart from "../Charts/MetricsChart";
import TeamContribution from "../TeamContribution/TeamContribution";
import LanguagesChart from "../Charts/LanguagesChart";
import type { DashboardNotification } from "../../api";
import { useLocation } from "react-router-dom";
import type { ElementType } from "react";


interface DashboardProps {
  repositories: string[];
  issueCount: number;
  selectedRepository: string;
  onRepositoryChange: (repository: string) => void;
  stats: Array<{
    icon: ElementType;
    label: string;
    value: string | number;
  }>;
  alertMessage: string;
  alertIcon: ElementType;
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
  notifications?: DashboardNotification[];
  notificationsLoading?: boolean;
  notificationsError?: string;
  onRemoveNotification?: (id: string) => void;
  onClearNotifications?: () => void;
  userInfo?: {
    displayName: string;
    githubUser: string;
    avatarUrl: string;
  };
  onLogout?: () => void;
  onChangeDisplayName?: () => void;
  onGenerateReport?: () => void;
  isGeneratingReport?: boolean;
  onTabChange?: (tab: string) => void;
  activeTab?: string;
  isSidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}



const Dashboard = ({
  repositories,
  selectedRepository,
  onRepositoryChange,
  stats,
  alertMessage,
  alertIcon,
  isLoading,
  issueCount,
  teamMembers,
  commitCount,
  pullRequestCount,
  latestCommitMessage,
  languages,
  notifications = [],
  notificationsLoading = false,
  notificationsError = "",
  onRemoveNotification = () => {},
  onClearNotifications = () => {},
  userInfo = {
    displayName: "User",
    githubUser: "username",
    avatarUrl: "",
  },
  onLogout = () => {},
  onChangeDisplayName = () => {},
  onGenerateReport = () => {},
  isGeneratingReport = false,
  onTabChange = () => {},
  // ADD THESE TWO LINES WITH DEFAULTS:
  isSidebarCollapsed = false,
  onSidebarToggle = () => {},
}: DashboardProps) => {
  const location = useLocation();
  
  // Determine which tab is active based on the route
  const getActiveTab = () => {
    if (location.pathname === "/") return "Dashboard";
    if (location.pathname === "/github-metrics") return "GitHub Metrics";
    return "Repository Dashboard";
  };

  const activeTab = getActiveTab();

  return (
    <div className="dashboard-container">
      <Sidebar 
        onTabChange={onTabChange}
        onGenerateReport={onGenerateReport}
        isGeneratingReport={isGeneratingReport}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={onSidebarToggle}
      />
      
      <div className={`dashboard-main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          repositories={repositories}
          selectedRepository={selectedRepository}
          onRepositoryChange={onRepositoryChange}
          isLoading={isLoading}
          userInfo={userInfo}
          onLogout={onLogout}
          onChangeDisplayName={onChangeDisplayName}
          notifications={notifications}
          notificationsLoading={notificationsLoading}
          notificationsError={notificationsError}
          onRemoveNotification={onRemoveNotification}
          onClearNotifications={onClearNotifications}
        />
        
        <div className="dashboard-content">
          <div className="content-header">
            <h1>{activeTab}</h1>
            <p>
              {selectedRepository
                ? `Shared metrics view for ${selectedRepository}`
                : "Track contributions and insights across your repository"}
            </p>
          </div>

          <AlertBanner message={alertMessage} icon={alertIcon} />
          
          <div id="report-content">
            <StatsGrid stats={stats} />
            
            <MetricsChart
              repository={selectedRepository}
              commitCount={commitCount}
              pullRequestCount={pullRequestCount}
              issueCount={issueCount}
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
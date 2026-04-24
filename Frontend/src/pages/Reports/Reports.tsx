import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import {
  getCurrentUser,
  getRepositories,
  getRepoBranches,
  getRepoAnalytics,
  getRepoCodeModifications,
  logoutFromGithub,
  type RepoAnalyticsResponse,
  type CodeModificationLog,
  type RepositoryOption,
  type RepoBranch,
} from "../../api";

import ReportsHeader from "./Tabs/Header";
import MetricsSummary from "./Tabs/MetricsSummary";
import CommitActivity from "./Tabs/CommitActivity";
import PullRequest from "./Tabs/PullRequest";
import IssueOverview from "./Tabs/IssueOverview";
import BranchTab from "./Tabs/Branch";
import CodeModifications from "./Tabs/codeModifications";

import "./Reports.css";
import { toast } from "react-toastify";
import { generatePDFReport } from "../../utils/pdfGenerator";

const DATE_FILTERS = [
  { label: "Last 7 Days", value: "7" },
  { label: "Last 30 Days", value: "30" },
  { label: "Last 90 Days", value: "90" },
];

const SELECTED_REPOSITORY_KEY = "selectedRepository";

type UserInfo = {
  displayName: string;
  githubUser: string;
  avatarUrl: string;
  isLoggedIn: boolean;
};

export default function Reports() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const [userInfo, setUserInfo] = useState<UserInfo>({
    displayName: "",
    githubUser: "",
    avatarUrl: "",
    isLoggedIn: false,
  });

  const [repositories, setRepositories] = useState<RepositoryOption[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [branches, setBranches] = useState<RepoBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [dateFilter, setDateFilter] = useState("30");

  const [analytics, setAnalytics] = useState<RepoAnalyticsResponse | null>(null);
  const [modifications, setModifications] = useState<CodeModificationLog[]>([]);

  const [pageLoading, setPageLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [branchLoading, setBranchLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await logoutFromGithub();
    } finally {
      window.location.href = "/login";
    }
  };

  const handleChangeDisplayName = () => {
    localStorage.removeItem("displayName");
    window.location.href = "/setup-profile";
  };

  const handleGenerateReport = async () => {
    if (!selectedRepo || !analytics) {
      toast.error("No data available to generate report");
      return;
    }

    setIsGeneratingReport(true);
    
    try {
      const reportData = {
        repository: `${selectedRepo} (${selectedBranch})`,
        date: new Date().toLocaleString(),
        stats: [
          { icon: "📊", label: "Total Commits", value: analytics.summary.totalCommits },
          { icon: "🔀", label: "Pull Requests", value: analytics.summary.pullRequests },
          { icon: "👥", label: "Active Contributors", value: analytics.summary.activeContributors },
          { icon: "📝", label: "Code Coverage", value: `${analytics.summary.codeCoverage}%` },
        ],
        teamMembers: [],
        languages: [],
        commitCount: analytics.summary.totalCommits,
        pullRequestCount: analytics.summary.pullRequests,
        latestCommitMessage: "No commit message available",
      };
      
      await generatePDFReport('reports-content', reportData);
      toast.success("Report generated successfully!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await getCurrentUser();

        if (!data.loggedIn) {
          window.location.href = "/login";
          return;
        }

        const displayName =
          localStorage.getItem("displayName") || data.displayName || "";

        setUserInfo({
          displayName,
          githubUser: data.ghUser || "",
          avatarUrl: `https://github.com/${data.ghUser}.png`,
          isLoggedIn: true,
        });
      } catch {
        window.location.href = "/login";
      }
    };

    void loadUser();
  }, []);

  useEffect(() => {
    if (!userInfo.isLoggedIn) return;

    const loadRepos = async () => {
      try {
        setPageLoading(true);
        setError("");

        const repoList = await getRepositories();
        setRepositories(repoList);

        const savedRepo = localStorage.getItem(SELECTED_REPOSITORY_KEY);

        if (savedRepo && repoList.some((repo) => repo.fullName === savedRepo)) {
          setSelectedRepo(savedRepo);
        } else if (repoList.length > 0) {
          setSelectedRepo(repoList[0].fullName);
          localStorage.setItem(SELECTED_REPOSITORY_KEY, repoList[0].fullName);
        } else {
          setError("No repositories found.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load repositories.");
      } finally {
        setPageLoading(false);
      }
    };

    void loadRepos();
  }, [userInfo.isLoggedIn]);

  useEffect(() => {
    if (!selectedRepo) return;
    localStorage.setItem(SELECTED_REPOSITORY_KEY, selectedRepo);
  }, [selectedRepo]);

  // Load branches when repository changes
  useEffect(() => {
    const [owner, repo] = selectedRepo.split("/");
    if (!owner || !repo) return;

    const loadBranches = async () => {
      try {
        setBranchLoading(true);
        const branchList = await getRepoBranches(owner, repo);
        setBranches(branchList);

        // Set default branch if current selected branch doesn't exist
        const branchExists = branchList.some((b) => b.name === selectedBranch);
        
        if (!branchExists && branchList.length > 0) {
          // Try to find main, then master, then first available
          const defaultBranch = branchList.find(b => b.name === "main") ||
                                branchList.find(b => b.name === "master") ||
                                branchList[0];
          if (defaultBranch) {
            setSelectedBranch(defaultBranch.name);
          }
        }
      } catch (err) {
        console.error(err);
        setBranches([]);
      } finally {
        setBranchLoading(false);
      }
    };

    void loadBranches();
  }, [selectedRepo]); // Only depend on selectedRepo, not selectedBranch

  // FIXED: Load analytics when repo, branch, or date filter changes
  useEffect(() => {
    if (!selectedRepo || !selectedBranch) return;

    const loadAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        setError("");
        
        // Pass the branch to the API call
        const data = await getRepoAnalytics(
          selectedRepo, 
          Number(dateFilter), 
          selectedBranch  // ← This is the key fix
        );
        setAnalytics(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load analytics.");
        setAnalytics(null);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    void loadAnalytics();
  }, [selectedRepo, selectedBranch, dateFilter]); // All dependencies included

  // FIXED: Load modifications when repo, branch, or date filter changes
  useEffect(() => {
    if (!selectedRepo || !selectedBranch) return;

    const loadModificationLog = async () => {
      try {
        setTableLoading(true);
        
        // Pass the branch to the API call
        const rows = await getRepoCodeModifications(
          selectedRepo, 
          Number(dateFilter), 
          selectedBranch  // ← This is the key fix
        );
        setModifications(rows);
      } catch (err) {
        console.error(err);
        setModifications([]);
      } finally {
        setTableLoading(false);
      }
    };

    void loadModificationLog();
  }, [selectedRepo, selectedBranch, dateFilter]); // All dependencies included

  const prBreakdownData = useMemo(() => {
    if (!analytics) return [];
    return [
      { name: "Merged", value: analytics.pullRequestBreakdown.merged },
      { name: "Open", value: analytics.pullRequestBreakdown.open },
      { name: "Closed", value: analytics.pullRequestBreakdown.closed },
    ];
  }, [analytics]);

  return (
    <div className="reports-container">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleSidebarToggle}
        onGenerateReport={handleGenerateReport}
        isGeneratingReport={isGeneratingReport}
      />

      <main className={`reports-main ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Header
          repositories={repositories.map((r) => r.fullName)}
          selectedRepository={selectedRepo}
          onRepositoryChange={setSelectedRepo}
          isLoading={pageLoading}
          userInfo={userInfo}
          onLogout={handleLogout}
          onChangeDisplayName={handleChangeDisplayName}
          notifications={[]}
          notificationsLoading={false}
          notificationsError=""
          onRemoveNotification={() => {}}
          onClearNotifications={() => {}}
        />

        <div id="reports-content" className="reports-content">
          <ReportsHeader />

          <BranchTab
            branches={branches}
            selectedBranch={selectedBranch}
            onChangeBranch={setSelectedBranch}
            loading={branchLoading}
            dateFilter={dateFilter}
            onChangeDateFilter={setDateFilter}
            dateFilters={DATE_FILTERS}
          />

          {analyticsLoading && !analytics ? (
            <div className="reports-loading-state">Loading analytics...</div>
          ) : error || !analytics ? (
            <div className="reports-error-state">
              {error || "Could not load analytics data."}
            </div>
          ) : (
            <>
              <MetricsSummary summary={analytics.summary} />

              <section className="reports-charts-grid">
                <CommitActivity data={analytics.commitActivity} />
                <PullRequest data={prBreakdownData} />
                <IssueOverview data={analytics.issueOverview} />
              </section>

              <CodeModifications
                rows={modifications}
                loading={tableLoading}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "../components/Dashboard/Dashboard";
import { getCurrentUser, logoutFromGithub, getGithubNotifications, getNotificationSettings } from "../api";
import { generatePDFReport } from "../utils/pdfGenerator";
import Settings from "./Settings/Settings";
import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../components/Header/Header";

// --- Interfaces ---
interface RepoApiResponse { name: string; url: string; description: string | null; }
interface CommitApiResponse { sha: string; message: string; author: string; }
interface PullApiResponse { id: number; title: string; user: string; }
interface RepositoryOption { owner: string; name: string; fullName: string; }
interface LanguageEntry { name: string; percentage: number; }
interface TeamContributionApiMember { login: string; displayName: string; githubDisplayName?: string | null; commits: number; pullRequests: number; issues: number; }
interface TeamContributionApiResponse { members: TeamContributionApiMember[]; totals: { commits: number; pullRequests: number; issues: number; }; }
interface TeamMemberViewModel { name: string; commits: number; pullRequests: number; issues: number; percentage: number; }
interface UserInfo { displayName: string; githubUser: string; avatarUrl: string; isLoggedIn: boolean; }
interface GitHubNotification {
  id: string;
  reason: string;
  subject: {
    title: string;
    type: string;
    url: string | null;
  };
  repository: {
    full_name: string;
    html_url: string;
  };
  updated_at: string;
  url: string;
}
interface NotificationSettings {
  commits: boolean;
  comments: boolean;
  codeReviews: boolean;
  issues: boolean;
  merge: boolean;
  pullRequests: boolean;
  inApp: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const DASHBOARD_NOTIFICATIONS_KEY = "dashboardNotifications";
const DASHBOARD_DISMISSED_NOTIFICATIONS_KEY = "dashboardDismissedNotifications";

const defaultNotificationSettings: Pick<NotificationSettings, "commits" | "comments" | "codeReviews" | "issues" | "merge" | "pullRequests" | "inApp"> = {
  commits: true,
  comments: true,
  codeReviews: true,
  issues: true,
  merge: true,
  pullRequests: true,
  inApp: true,
};

const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`;
const parseRepository = (repo: RepoApiResponse): RepositoryOption | null => {
  const match = repo.url.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
  if (!match) return null;
  return { owner: match[1], name: match[2], fullName: `${match[1]}/${match[2]}` };
};

// --- Component ---
const DashboardPage = () => {
  const navigate = useNavigate();

  // --- User and Repository State ---
  const [userInfo, setUserInfo] = useState<UserInfo>({ displayName: "", githubUser: "", avatarUrl: "", isLoggedIn: false });
  const [repositories, setRepositories] = useState<RepositoryOption[]>([]);
  const [selectedRepository, setSelectedRepository] = useState<string>("");
  const [commits, setCommits] = useState<CommitApiResponse[]>([]);
  const [languages, setLanguages] = useState<LanguageEntry[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberViewModel[]>([]);
  const [commitCount, setCommitCount] = useState<number>(0);
  const [pullRequestCount, setPullRequestCount] = useState<number>(0);
  const [issueCount, setIssueCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("Dashboard");

  // --- Notification State ---
  const [notifications, setNotifications] = useState<GitHubNotification[]>([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState<boolean>(false);
  const [notificationsError, setNotificationsError] = useState<string>("");

  // --- Load User ---
  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await getCurrentUser();
        if (!data.loggedIn) { navigate("/login"); return; }

        const storedName = localStorage.getItem("displayName");
        const resolvedDisplayName = storedName || data.displayName || "";
        if (!resolvedDisplayName) navigate("/setup-profile");
        if (!storedName && data.displayName) localStorage.setItem("displayName", data.displayName);

        setUserInfo({
          displayName: resolvedDisplayName,
          githubUser: data.ghUser || "",
          avatarUrl: `https://github.com/${data.ghUser}.png`,
          isLoggedIn: true,
        });
      } catch { navigate("/login"); }
    };
    loadUser();
  }, [navigate]);

  // --- Load Repositories ---
  useEffect(() => {
    if (!userInfo.isLoggedIn) return;
    const loadRepos = async () => {
      setIsLoading(true); setErrorMessage("");
      try {
        const res = await fetch(buildApiUrl("/api/repos"), { credentials: "include" });
        if (!res.ok) throw new Error("Unable to load repositories");
        const data: RepoApiResponse[] = await res.json();
        const parsed = data.map(parseRepository).filter((r): r is RepositoryOption => r !== null);
        setRepositories(parsed);
        if (parsed.length > 0) setSelectedRepository(parsed[0].fullName);
        else setErrorMessage("No repositories found.");
      } catch (error) { console.error(error); setErrorMessage((error as Error).message); }
      finally { setIsLoading(false); }
    };
    void loadRepos();
  }, [userInfo.isLoggedIn]);

  // --- Load Repository Metrics ---
  useEffect(() => {
    if (!selectedRepository) {
      setCommits([]); setLanguages([]); setTeamMembers([]);
      setCommitCount(0); setPullRequestCount(0); setIssueCount(0);
      return;
    }
    const [owner, repo] = selectedRepository.split("/");
    if (!owner || !repo) return;

    const loadMetrics = async () => {
      setIsLoading(true); setErrorMessage("");
      try {
        const [commitsRes, pullsRes, languagesRes, teamRes] = await Promise.all([
          fetch(buildApiUrl(`/api/repos/${owner}/${repo}/commits`), { credentials: "include" }),
          fetch(buildApiUrl(`/api/repos/${owner}/${repo}/pulls`), { credentials: "include" }),
          fetch(buildApiUrl(`/api/repos/${owner}/${repo}/languages`), { credentials: "include" }),
          fetch(buildApiUrl(`/api/repos/${owner}/${repo}/team-contributions`), { credentials: "include" }),
        ]);

        if (!commitsRes.ok || !pullsRes.ok) throw new Error("Unable to load metrics");

        const commitsData: CommitApiResponse[] = await commitsRes.json();
        const pullsData: PullApiResponse[] = await pullsRes.json();

        setCommits(commitsData);
        setCommitCount(commitsData.length);
        setPullRequestCount(pullsData.length);

        if (teamRes.ok) {
          const teamData: TeamContributionApiResponse = await teamRes.json();
          const totalCommits = teamData.totals.commits;
          setTeamMembers(teamData.members.map((m) => ({
            name: m.displayName || m.githubDisplayName || m.login,
            commits: m.commits, pullRequests: m.pullRequests, issues: m.issues,
            percentage: totalCommits > 0 ? Math.round((m.commits / totalCommits) * 100) : 0
          })));
          setCommitCount(teamData.totals.commits);
          setPullRequestCount(teamData.totals.pullRequests);
          setIssueCount(teamData.totals.issues);
        }

        if (languagesRes.ok) {
          const langMap: Record<string, number> = await languagesRes.json();
          const total = Object.values(langMap).reduce((s, n) => s + n, 0);
          setLanguages(Object.entries(langMap).map(([name, bytes]) => ({
            name, percentage: total > 0 ? Math.round((bytes / total) * 100) : 0
          })).sort((a,b) => b.percentage - a.percentage).slice(0,5));
        }

      } catch { setErrorMessage("Failed to load repository metrics"); }
      finally { setIsLoading(false); }
    };
    void loadMetrics();
  }, [selectedRepository]);

  // --- Notifications ---
  useEffect(() => {
    const stored = localStorage.getItem(DASHBOARD_NOTIFICATIONS_KEY);
    if (stored) setNotifications(JSON.parse(stored));
    const dismissed = localStorage.getItem(DASHBOARD_DISMISSED_NOTIFICATIONS_KEY);
    if (dismissed) setDismissedNotificationIds(JSON.parse(dismissed));
  }, []);

  useEffect(() => { localStorage.setItem(DASHBOARD_NOTIFICATIONS_KEY, JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem(DASHBOARD_DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(dismissedNotificationIds)); }, [dismissedNotificationIds]);

  useEffect(() => {
    const loadNotifications = async () => {
      setNotificationsLoading(true); setNotificationsError("");
      try {
        const settings = await getNotificationSettings();
        const resolvedSettings = { ...defaultNotificationSettings, ...settings };
        if (!resolvedSettings.inApp) return;

        // Fix: Extract only the needed preferences for the API call
        const notificationPrefs = {
          commits: resolvedSettings.commits,
          comments: resolvedSettings.comments,
          codeReviews: resolvedSettings.codeReviews,
          issues: resolvedSettings.issues,
          merge: resolvedSettings.merge,
          pullRequests: resolvedSettings.pullRequests,
        };

        const fetched = await getGithubNotifications(notificationPrefs);
        
        // Fix: Properly handle the fetched notifications
        const filteredNotifications = fetched.filter(n => !dismissedNotificationIds.includes(n.id));
        
        // Merge existing and new notifications, removing duplicates by id
        const allNotifications = [...notifications, ...filteredNotifications];
        const uniqueNotifications = Array.from(
          new Map(allNotifications.map(n => [n.id, n])).values()
        ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        
        setNotifications(uniqueNotifications);
      } catch (error) {
        setNotificationsError((error as Error)?.message || "Could not load notifications.");
      } finally { setNotificationsLoading(false); }
    };
    void loadNotifications();
  }, [dismissedNotificationIds]); // Removed notifications from dependencies to avoid infinite loop

  const handleRemoveNotification = (id: string) => {
    setDismissedNotificationIds(curr => [...curr, id]);
    setNotifications(curr => curr.filter(n => n.id !== id));
  };

  const handleClearNotifications = () => {
    setDismissedNotificationIds(curr => {
      const next = new Set(curr);
      notifications.forEach(n => next.add(n.id));
      return Array.from(next);
    });
    setNotifications([]);
  };

  // --- Actions ---
  const handleLogout = async () => { localStorage.removeItem("displayName"); try { await logoutFromGithub(); } finally { window.location.href = "/login"; } };
  const handleChangeDisplayName = () => { localStorage.removeItem("displayName"); navigate("/setup-profile"); };
  const handleTabChange = (tab: string) => setActiveTab(tab);

  const stats = useMemo(() => [
    { icon: "📊", label: "Total Number of Commits", value: commitCount },
    { icon: "🔀", label: "Total Pull Requests", value: pullRequestCount },
    { icon: "⚠️", label: "Issues Opened", value: issueCount },
    { icon: "📝", label: "# Lines of Code", value: "N/A" },
  ], [commitCount, pullRequestCount, issueCount]);

  const alertMessage = useMemo(() => {
    if (errorMessage) return errorMessage;
    if (isLoading) return "Loading repository metrics...";
    if (teamMembers.length === 0) return "No recent commit activity for this repository.";
    return `⭐ ${teamMembers[0].name} leads with ${teamMembers[0].percentage}% of recent commits.`;
  }, [errorMessage, isLoading, teamMembers]);

  const latestCommitMessage = commits[0]?.message || "No commits available";

  const handleGenerateReport = async () => {
    if (!selectedRepository) return setErrorMessage("Please select a repository first");
    setIsGeneratingReport(true); setErrorMessage("");
    try {
      const reportData = { repository: selectedRepository, date: new Date().toLocaleString(), stats, teamMembers, languages, commitCount, pullRequestCount, latestCommitMessage };
      await generatePDFReport("report-content", reportData);
    } catch { setErrorMessage("Failed to generate PDF report"); }
    finally { setIsGeneratingReport(false); }
  };

  // --- Render ---
  const renderContent = () => {
    switch(activeTab) {
      case "Settings":
        return (
          <div className="dashboard-container">
            <Sidebar onTabChange={handleTabChange} onGenerateReport={handleGenerateReport} isGeneratingReport={isGeneratingReport} />
            <div className="dashboard-main">
              <Header 
                repositories={repositories.map(r=>r.fullName)} 
                selectedRepository={selectedRepository} 
                onRepositoryChange={setSelectedRepository} 
                isLoading={isLoading} 
                userInfo={userInfo} 
                onLogout={handleLogout} 
                onChangeDisplayName={handleChangeDisplayName}
                notifications={notifications}
                notificationsLoading={notificationsLoading}
                notificationsError={notificationsError}
                onRemoveNotification={handleRemoveNotification}
                onClearNotifications={handleClearNotifications}
              />
              <div className="dashboard-content"><Settings /></div>
            </div>
          </div>
        );
      default:
        return (
          <Dashboard
            userInfo={userInfo}
            onLogout={handleLogout}
            onChangeDisplayName={handleChangeDisplayName}
            onGenerateReport={handleGenerateReport}
            isGeneratingReport={isGeneratingReport}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            repositories={repositories.map(r=>r.fullName)}
            selectedRepository={selectedRepository}
            onRepositoryChange={setSelectedRepository}
            stats={stats}
            alertMessage={alertMessage}
            alertIcon={errorMessage ? "⚠️" : "⭐"}
            isLoading={isLoading}
            teamMembers={teamMembers}
            commitCount={commitCount}
            pullRequestCount={pullRequestCount}
            latestCommitMessage={latestCommitMessage}
            languages={languages}
            notifications={notifications}
            notificationsLoading={notificationsLoading}
            notificationsError={notificationsError}
            onRemoveNotification={handleRemoveNotification}
            onClearNotifications={handleClearNotifications}
          />
        );
    }
  };

  return renderContent();
};

export default DashboardPage;
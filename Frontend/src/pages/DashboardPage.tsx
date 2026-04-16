import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Dashboard from "../components/Dashboard/Dashboard";
import AchievementCelebration from "../components/AchievementCelebration/AchievementCelebration";
import Settings from "./Settings/Settings";
import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../components/Header/Header";
import MetricsPage from '../Metrics/MetricsPage';
import { getCurrentUser, logoutFromGithub, getGithubNotifications, getNotificationSettings } from "../api";
import { generatePDFReport } from "../utils/pdfGenerator";
import {
  type DashboardNotification,
  type NotificationSettings,
} from "../api";

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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const DASHBOARD_NOTIFICATIONS_KEY = "dashboardNotifications";
const DASHBOARD_DISMISSED_NOTIFICATIONS_KEY = "dashboardDismissedNotifications";
const DASHBOARD_UNLOCKED_ACHIEVEMENTS_KEY = "dashboardUnlockedAchievements";
const SELECTED_REPOSITORY_KEY = "selectedRepository";
const ACHIEVEMENT_MILESTONES = [1, 25, 100, 250, 500, 1000, 2500, 5000];

const defaultNotificationSettings: Pick<
  NotificationSettings,
  "commits" | "comments" | "codeReviews" | "issues" | "merge" | "pullRequests" | "achievements" | "inApp"
> = {
  commits: true,
  comments: true,
  codeReviews: true,
  issues: true,
  merge: true,
  pullRequests: true,
  achievements: true,
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
const [searchParams] = useSearchParams();

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
  const [linesOfCode, setLinesOfCode] = useState<number>(0);
  const [currentUserCommits, setCurrentUserCommits] = useState<number>(0);
  const [currentGhUser, setCurrentGhUser] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // --- Notification State ---
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
  const [unlockedMilestones, setUnlockedMilestones] = useState<number[]>([]);
  const [celebrationQueue, setCelebrationQueue] = useState<number[]>([]);
  const [activeCelebrationMilestone, setActiveCelebrationMilestone] = useState<number | null>(null);
  const [notificationsLoading, setNotificationsLoading] = useState<boolean>(false);
  const [notificationsError, setNotificationsError] = useState<string>("");
  const [notificationSettings, setNotificationSettings] =
    useState<typeof defaultNotificationSettings>(defaultNotificationSettings);

  // Refs to prevent duplicate achievements
  const hasInitializedAchievements = useRef(false);
  const processedAchievementsRef = useRef<Set<number>>(new Set());

  const unlockedMilestonesStorageKey = useMemo(
    () => `${DASHBOARD_UNLOCKED_ACHIEVEMENTS_KEY}:${currentGhUser || "guest"}`,
    [currentGhUser]
  );

  useEffect(() => {
  const tabFromUrl = searchParams.get("tab");
  if (tabFromUrl) {
    setActiveTab(tabFromUrl);
  }
}, [searchParams]);

  // --- Load Current User ---
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const auth = await getCurrentUser();
        setCurrentGhUser(auth.ghUser ?? "");
      } catch {
        setCurrentGhUser("");
      }
    };
    void loadCurrentUser();
  }, []);

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
        
        // Load saved repository from localStorage
        const savedRepository = localStorage.getItem(SELECTED_REPOSITORY_KEY);
        if (savedRepository && parsed.some(repo => repo.fullName === savedRepository)) {
          setSelectedRepository(savedRepository);
        } else if (parsed.length > 0) {
          setSelectedRepository(parsed[0].fullName);
          localStorage.setItem(SELECTED_REPOSITORY_KEY, parsed[0].fullName);
        } else {
          setErrorMessage("No repositories found.");
        }
      } catch (error) { console.error(error); setErrorMessage((error as Error).message); }
      finally { setIsLoading(false); }
    };
    void loadRepos();
  }, [userInfo.isLoggedIn]);

  // Save selected repository to localStorage whenever it changes
  useEffect(() => {
    if (selectedRepository) {
      localStorage.setItem(SELECTED_REPOSITORY_KEY, selectedRepository);
    }
  }, [selectedRepository]);

  // --- Load Repository Metrics ---
  useEffect(() => {
    if (!selectedRepository) {
      setCommits([]);
      setLanguages([]);
      setTeamMembers([]);
      setCommitCount(0);
      setPullRequestCount(0);
      setIssueCount(0);
      setCurrentUserCommits(0);
      return;
    }
    const [owner, repo] = selectedRepository.split("/");
    if (!owner || !repo) return;

    const loadRepositoryMetrics = async () => {
      setIsLoading(true); setErrorMessage("");
      try {
        const [commitsRes, pullsRes, languagesRes, teamRes, locRes] = await Promise.all([
          fetch(buildApiUrl(`/api/repos/${owner}/${repo}/commits`), { credentials: "include" }),
          fetch(buildApiUrl(`/api/repos/${owner}/${repo}/pulls`), { credentials: "include" }),
          fetch(buildApiUrl(`/api/repos/${owner}/${repo}/languages`), { credentials: "include" }),
          fetch(buildApiUrl(`/api/repos/${owner}/${repo}/team-contributions`), { credentials: "include" }),
          fetch(buildApiUrl(`/api/metrics/${owner}/${repo}/lines-of-code`), { credentials: "include" }), // Add this line
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

          if (currentGhUser) {
            const matchedMember = teamData.members.find(
              (member) => member.login.toLowerCase() === currentGhUser.toLowerCase()
            );
            setCurrentUserCommits(matchedMember?.commits ?? 0);
          } else {
            setCurrentUserCommits(0);
          }
        } else {
          setTeamMembers([]);
          setCommitCount(commitsData.length);
          setPullRequestCount(pullsData.length);
          setIssueCount(0);
          setCurrentUserCommits(0);
        }

        // Add this after your other response handling
if (locRes.ok) {
  const locData = await locRes.json();
  setLinesOfCode(locData.totalLines || locData.linesOfCode || 0);
} else {
  setLinesOfCode(0);
}

        if (languagesRes.ok) {
          const langMap: Record<string, number> = await languagesRes.json();
          const total = Object.values(langMap).reduce((s, n) => s + n, 0);
          setLanguages(Object.entries(langMap).map(([name, bytes]) => ({
            name, percentage: total > 0 ? Math.round((bytes / total) * 100) : 0
          })).sort((a,b) => b.percentage - a.percentage).slice(0,5));
        }
      } catch {
        setCommits([]);
        setLanguages([]);
        setTeamMembers([]);
        setCommitCount(0);
        setPullRequestCount(0);
        setIssueCount(0);
        setCurrentUserCommits(0);
        setErrorMessage("Could not load repository metrics from backend.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadRepositoryMetrics();
  }, [selectedRepository, currentGhUser]);

  // --- Load Unlocked Milestones from localStorage ---
  useEffect(() => {
    const storedUnlockedMilestones = localStorage.getItem(unlockedMilestonesStorageKey);
    if (!storedUnlockedMilestones) {
      setUnlockedMilestones([]);
      return;
    }

    try {
      const parsedMilestones = JSON.parse(storedUnlockedMilestones) as number[];
      setUnlockedMilestones(Array.isArray(parsedMilestones) ? parsedMilestones : []);
      // Initialize processed achievements ref with already unlocked milestones
      const unlockedSet = new Set(Array.isArray(parsedMilestones) ? parsedMilestones : []);
      processedAchievementsRef.current = unlockedSet;
    } catch {
      setUnlockedMilestones([]);
    }
  }, [unlockedMilestonesStorageKey]);

  // --- Achievement Notifications (Fixed to only trigger once) ---
  useEffect(() => {
    if (!notificationSettings.inApp || !notificationSettings.achievements) {
      return;
    }

    // Skip if still loading or no commits yet
    if (isLoading || currentUserCommits === 0) {
      return;
    }

    // Skip initial load to prevent showing achievements on page load
    if (!hasInitializedAchievements.current) {
      hasInitializedAchievements.current = true;
      return;
    }

    // Find newly unlocked milestones that haven't been processed
    const newlyUnlocked = ACHIEVEMENT_MILESTONES.filter(
      (milestone) => 
        currentUserCommits >= milestone && 
        !unlockedMilestones.includes(milestone) &&
        !processedAchievementsRef.current.has(milestone)
    );

    if (newlyUnlocked.length === 0) {
      return;
    }

    const now = new Date().toISOString();

    // Mark as processed immediately to prevent duplicate triggers
    newlyUnlocked.forEach(milestone => {
      processedAchievementsRef.current.add(milestone);
    });

    // Update unlocked milestones state and localStorage
    setUnlockedMilestones((currentMilestones) => {
      const updatedMilestones = [...currentMilestones, ...newlyUnlocked];
      localStorage.setItem(unlockedMilestonesStorageKey, JSON.stringify(updatedMilestones));
      return updatedMilestones;
    });

    const achievementNotifications: DashboardNotification[] = newlyUnlocked.map((milestone) => ({
      id: `achievement-${milestone}-${Date.now()}`,
      notificationType: "achievement",
      achievementMilestone: milestone,
      reason: "achievement",
      subject: {
        title: `🎉 Milestone unlocked: ${milestone} contributions! 🎉`,
        type: "Achievement",
        url: null,
      },
      repository: {
        full_name: selectedRepository || "GitHub Contributions",
        html_url: "",
      },
      updated_at: now,
      url: "",
    }));

    // Show toast notifications
    newlyUnlocked.forEach((milestone) => {
      toast.success(`🎉 Achievement unlocked: ${milestone} contributions! 🎉`, {
        autoClose: 5000,
        position: "top-right",
      });
    });

    // Add to celebration queue
    setCelebrationQueue((currentQueue) => [...currentQueue, ...newlyUnlocked]);

    // Add to notifications
    setNotifications((currentNotifications) => {
      const nextNotifications = new Map<string, DashboardNotification>();

      currentNotifications.forEach((notification) => {
        if (!dismissedNotificationIds.includes(notification.id)) {
          nextNotifications.set(notification.id, notification);
        }
      });

      achievementNotifications.forEach((notification) => {
        const alreadyExists = Array.from(nextNotifications.values()).some(
          (existing) => 
            existing.notificationType === "achievement" && 
            existing.achievementMilestone === notification.achievementMilestone
        );
        
        if (!dismissedNotificationIds.includes(notification.id) && !alreadyExists) {
          nextNotifications.set(notification.id, notification);
        }
      });

      return Array.from(nextNotifications.values()).sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }, [
    currentUserCommits,
    dismissedNotificationIds,
    notificationSettings.achievements,
    notificationSettings.inApp,
    selectedRepository,
    unlockedMilestones,
    isLoading,
    unlockedMilestonesStorageKey,
  ]);

  // --- Celebration Queue ---
  useEffect(() => {
    if (activeCelebrationMilestone !== null || celebrationQueue.length === 0) {
      return;
    }

    const [nextMilestone, ...remainingQueue] = celebrationQueue;
    setActiveCelebrationMilestone(nextMilestone);
    setCelebrationQueue(remainingQueue);
  }, [activeCelebrationMilestone, celebrationQueue]);

  // --- Load Stored Notifications ---
  useEffect(() => {
    const stored = localStorage.getItem(DASHBOARD_NOTIFICATIONS_KEY);
    if (stored) {
      try {
        setNotifications(JSON.parse(stored) as DashboardNotification[]);
      } catch {
        setNotifications([]);
      }
    }
    const dismissed = localStorage.getItem(DASHBOARD_DISMISSED_NOTIFICATIONS_KEY);
    if (dismissed) setDismissedNotificationIds(JSON.parse(dismissed));
  }, []);

  // --- Store Notifications ---
  useEffect(() => { localStorage.setItem(DASHBOARD_NOTIFICATIONS_KEY, JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem(DASHBOARD_DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(dismissedNotificationIds)); }, [dismissedNotificationIds]);

  // --- Load GitHub Notifications ---
  useEffect(() => {
    const loadNotifications = async () => {
      setNotificationsLoading(true); setNotificationsError("");
      try {
        const settings = await getNotificationSettings();
        const resolvedSettings = { ...defaultNotificationSettings, ...settings };
        setNotificationSettings(resolvedSettings);

        if (!resolvedSettings.inApp) {
          setNotificationsLoading(false);
          return;
        }

        const notificationPrefs = {
          commits: resolvedSettings.commits,
          comments: resolvedSettings.comments,
          codeReviews: resolvedSettings.codeReviews,
          issues: resolvedSettings.issues,
          merge: resolvedSettings.merge,
          pullRequests: resolvedSettings.pullRequests,
        };

        const fetched = await getGithubNotifications(notificationPrefs);
        const filteredNotifications = fetched.filter(n => !dismissedNotificationIds.includes(n.id));
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
  }, [dismissedNotificationIds]);

  // --- Notification Handlers ---
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
  const handleLogout = async () => { 
    localStorage.removeItem(SELECTED_REPOSITORY_KEY);
    try { await logoutFromGithub(); } finally { window.location.href = "/login"; } 
  };
  
  const handleChangeDisplayName = () => { 
    localStorage.removeItem("displayName"); 
    navigate("/setup-profile"); 
  };
  
  const handleTabChange = (tab: string) => {
  console.log("Tab changing to:", tab); // Add this line
  setActiveTab(tab);
};
  const handleSidebarToggle = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const handleGenerateReport = async () => {
    if (!selectedRepository) return setErrorMessage("Please select a repository first");
    setIsGeneratingReport(true); setErrorMessage("");
    try {
      const stats = [
        { icon: "📊", label: "Total Number of Commits", value: commitCount },
        { icon: "🔀", label: "Total Pull Requests", value: pullRequestCount },
        { icon: "⚠️", label: "Issues Opened", value: issueCount },
        { icon: "📝", label: "# Lines of Code", value: "N/A" },
      ];
      const latestCommitMessage = commits[0]?.message || "No commits available";
      const reportData = { 
        repository: selectedRepository, 
        date: new Date().toLocaleString(), 
        stats, 
        teamMembers, 
        languages, 
        commitCount, 
        pullRequestCount, 
        latestCommitMessage 
      };
      await generatePDFReport("report-content", reportData);
      toast.success("Report generated successfully!");
    } catch { 
      setErrorMessage("Failed to generate PDF report");
      toast.error("Failed to generate report");
    } finally { 
      setIsGeneratingReport(false); 
    }
  };

  const stats = useMemo(() => [
    { icon: "📊", label: "Total Number of Commits", value: commitCount },
    { icon: "🔀", label: "Total Pull Requests", value: pullRequestCount },
    { icon: "⚠️", label: "Issues Opened", value: issueCount },
    { icon: "📝", label: "# Lines of Code", value: linesOfCode.toLocaleString() },
  ], [commitCount, pullRequestCount, issueCount, linesOfCode]);

  const alertMessage = useMemo(() => {
    if (errorMessage) return errorMessage;
    if (isLoading) return "Loading repository metrics...";
    if (teamMembers.length === 0) return "No recent commit activity for this repository.";
    return `⭐ ${teamMembers[0].name} leads with ${teamMembers[0].percentage}% of recent commits.`;
  }, [errorMessage, isLoading, teamMembers]);

  const latestCommitMessage = commits[0]?.message || "No commits available";

  // --- Render ---
  const renderContent = () => {
  switch(activeTab) {
    case "Settings":
      return (
        <div className="dashboard-container">
          <Sidebar 
            onTabChange={handleTabChange} 
            onGenerateReport={handleGenerateReport} 
            isGeneratingReport={isGeneratingReport}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleSidebarToggle}
            activeTab={activeTab}
          />
          <div className={`dashboard-main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
    
    // Add this new case for Github Metrics
    case "Github Metrics":
      if (!selectedRepository) {
        return (
          <div className="dashboard-container">
            <Sidebar 
              onTabChange={handleTabChange} 
              onGenerateReport={handleGenerateReport} 
              isGeneratingReport={isGeneratingReport}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={handleSidebarToggle}
              activeTab={activeTab}
            />
            <div className={`dashboard-main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
              <div className="dashboard-content">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                  <p className="text-yellow-700">Please select a repository to view metrics</p>
                </div>
              </div>
            </div>
          </div>
        );
      }
      
      const [owner, repo] = selectedRepository.split("/");
      return (
        <div className="dashboard-container">
          <Sidebar 
            onTabChange={handleTabChange} 
            onGenerateReport={handleGenerateReport} 
            isGeneratingReport={isGeneratingReport}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleSidebarToggle}
            activeTab={activeTab}  // Add this line
          />
          <div className={`dashboard-main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
            <div className="dashboard-content">
              <MetricsPage owner={owner} repo={repo} />
            </div>
          </div>
        </div>
      );
    
    default: // Dashboard tab
      return (
        <>
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
            isSidebarCollapsed={isSidebarCollapsed}
            onSidebarToggle={handleSidebarToggle}
          />
          {activeCelebrationMilestone !== null && (
            <AchievementCelebration
              milestone={activeCelebrationMilestone}
              onComplete={() => setActiveCelebrationMilestone(null)}
            />
          )}
        </>
      );
  }
};

  return renderContent();
};

export default DashboardPage;
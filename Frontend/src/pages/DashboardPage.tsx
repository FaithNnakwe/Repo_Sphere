import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "../components/Dashboard/Dashboard";
import { getCurrentUser, logoutFromGithub } from "../api";
import { generatePDFReport } from "../utils/pdfGenerator"; // ← ADD THIS LINE HER
import Settings from "./Settings/Settings"; // Import the Settings component
import Sidebar from "../components/Sidebar/Sidebar"; // Add this import
import Header from "../components/Header/Header"; // Add this import

interface RepoApiResponse {
  name: string;
  url: string;
  description: string | null;
}

interface CommitApiResponse {
  sha: string;
  message: string;
  author: string;
}

interface PullApiResponse {
  id: number;
  title: string;
  user: string;
}

interface RepositoryOption {
  owner: string;
  name: string;
  fullName: string;
}

interface LanguageEntry {
  name: string;
  percentage: number;
}

interface TeamContributionApiMember {
  login: string;
  displayName: string;
  githubDisplayName?: string | null;
  commits: number;
  pullRequests: number;
  issues: number;
}

interface TeamContributionApiResponse {
  members: TeamContributionApiMember[];
  totals: {
    commits: number;
    pullRequests: number;
    issues: number;
  };
}

interface TeamMemberViewModel {
  name: string;
  commits: number;
  pullRequests: number;
  issues: number;
  percentage: number;
}

interface UserInfo {
  displayName: string;
  githubUser: string;
  avatarUrl: string;
  isLoggedIn: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`;

const parseRepository = (repo: RepoApiResponse): RepositoryOption | null => {
  const match = repo.url.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
  if (!match) {
    return null;
  }

  const owner = match[1];
  const name = match[2];
  return {
    owner,
    name,
    fullName: `${owner}/${name}`,
  };
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo>({
    displayName: "",
    githubUser: "",
    avatarUrl: "",
    isLoggedIn: false,
  });
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
  const [activeTab, setActiveTab] = useState<string>("Dashboard"); // ← ADD THIS LINE HERE

  // Check authentication and load user info
  useEffect(() => {
    const checkAuthAndLoadUser = async () => {
      try {
        const data = await getCurrentUser();

        if (!data.loggedIn) {
          navigate("/login");
          return;
        }

        const storedName = localStorage.getItem("displayName");
        const resolvedDisplayName = storedName || data.displayName || "";

        if (!resolvedDisplayName) {
          navigate("/setup-profile");
          return;
        }

        if (!storedName && data.displayName) {
          localStorage.setItem("displayName", data.displayName);
        }

        setUserInfo({
          displayName: resolvedDisplayName,
          githubUser: data.ghUser || "",
          avatarUrl: `https://github.com/${data.ghUser}.png`,
          isLoggedIn: true,
        });
      } catch (error) {
        console.error("Failed to load user info:", error);
        navigate("/login");
      }
    };

    checkAuthAndLoadUser();
  }, [navigate]);

  useEffect(() => {
    const loadRepositories = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {

        console.log("Fetching repositories from:", buildApiUrl("/api/repos"));
    console.log("User info:", userInfo);

        const response = await fetch(buildApiUrl("/api/repos"), {
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error("GitHub authentication required. Please log in with GitHub again.");
          }

          throw new Error("Unable to load repositories");
        }

        const repoData = (await response.json()) as RepoApiResponse[];
         console.log("Repositories data:", repoData);
        const parsedRepos = repoData
          .map(parseRepository)
          .filter((repo): repo is RepositoryOption => repo !== null);

          console.log("Parsed repos:", parsedRepos);

        setRepositories(parsedRepos);
        if (parsedRepos.length > 0) {
          setSelectedRepository(parsedRepos[0].fullName);
        } else {
      setErrorMessage("No repositories found. Make sure you have access to some repositories.");
    }
      } catch (error) {
        console.error("Error loading repositories:", error);
        setRepositories([]);
        setSelectedRepository("");
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Could not load repository list from backend.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (userInfo.isLoggedIn) {
      void loadRepositories();
    }
  }, [userInfo.isLoggedIn]);

  useEffect(() => {
    if (!selectedRepository) {
      setCommits([]);
      setLanguages([]);
      setTeamMembers([]);
      setCommitCount(0);
      setPullRequestCount(0);
      setIssueCount(0);
      return;
    }

    const [owner, repo] = selectedRepository.split("/");
    if (!owner || !repo) {
      return;
    }

    const loadRepositoryMetrics = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [commitsResponse, pullsResponse, languagesResponse, teamResponse] = await Promise.all([
          fetch(buildApiUrl(`/api/repos/${owner}/${repo}/commits`), {
            credentials: "include",
          }),
          fetch(buildApiUrl(`/api/repos/${owner}/${repo}/pulls`), {
            credentials: "include",
          }),
          fetch(buildApiUrl(`/api/repos/${owner}/${repo}/languages`), {
            credentials: "include",
          }),
          fetch(buildApiUrl(`/api/repos/${owner}/${repo}/team-contributions`), {
            credentials: "include",
          }),
        ]);

        if (!commitsResponse.ok || !pullsResponse.ok) {
          throw new Error("Unable to load repository metrics");
        }

        const commitsData = (await commitsResponse.json()) as CommitApiResponse[];
        const pullsData = (await pullsResponse.json()) as PullApiResponse[];

        setCommits(commitsData);
        setCommitCount(commitsData.length);
        setPullRequestCount(pullsData.length);

        if (teamResponse.ok) {
          const teamData = (await teamResponse.json()) as TeamContributionApiResponse;
          const totalCommits = teamData.totals.commits;
          const mappedMembers = teamData.members.map((member) => ({
            name: member.displayName || member.githubDisplayName || member.login,
            commits: member.commits,
            pullRequests: member.pullRequests,
            issues: member.issues,
            percentage: totalCommits > 0 ? Math.round((member.commits / totalCommits) * 100) : 0,
          }));
          setTeamMembers(mappedMembers);
          setCommitCount(teamData.totals.commits);
          setPullRequestCount(teamData.totals.pullRequests);
          setIssueCount(teamData.totals.issues);
        } else {
          setTeamMembers([]);
          setCommitCount(commitsData.length);
          setPullRequestCount(pullsData.length);
          setIssueCount(0);
        }

        if (languagesResponse.ok) {
          const languageMap = (await languagesResponse.json()) as Record<string, number>;
          const totalBytes = Object.values(languageMap).reduce((sum, count) => sum + count, 0);

          const languageEntries = Object.entries(languageMap)
            .map(([name, bytes]) => ({
              name,
              percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
            }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5);

          setLanguages(languageEntries);
        } else {
          setLanguages([]);
        }
      } catch {
        setCommits([]);
        setLanguages([]);
        setTeamMembers([]);
        setCommitCount(0);
        setPullRequestCount(0);
        setIssueCount(0);
        setErrorMessage("Could not load repository metrics from backend.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadRepositoryMetrics();
  }, [selectedRepository]);

  const handleLogout = async () => {
    localStorage.removeItem("displayName");
    try {
      await logoutFromGithub();
    } finally {
      window.location.href = "/login";
    }
  };

  const handleChangeDisplayName = () => {
    localStorage.removeItem("displayName");
    navigate("/setup-profile");
  };

  // ADD THIS NEW FUNCTION HERE
const handleGenerateReport = async () => {
  if (!selectedRepository) {
    setErrorMessage("Please select a repository first");
    return;
  }

  setIsGeneratingReport(true);
  setErrorMessage("");

  try {
    const reportData = {
      repository: selectedRepository,
      date: new Date().toLocaleString(),
      stats: stats,
      teamMembers: teamMembers,
      languages: languages,
      commitCount: commitCount,
      pullRequestCount: pullRequestCount,
      latestCommitMessage: latestCommitMessage,
    };

    await generatePDFReport('report-content', reportData);
  } catch (error) {
    console.error("Failed to generate report:", error);
    setErrorMessage("Failed to generate PDF report. Please try again.");
  } finally {
    setIsGeneratingReport(false);
  }
};

// ADD THE NEW FUNCTION RIGHT AFTER handleGenerateReport
const handleTabChange = (tab: string) => {
  setActiveTab(tab);
  // You can add logic here for different tabs
  // For example, if tab is "Settings", you might show a different view
};

  const stats = useMemo(
    () => [
      { icon: "📊", label: "Total Number of Commits", value: commitCount },
      { icon: "🔀", label: "Total Pull Requests", value: pullRequestCount },
      { icon: "⚠️", label: "Issues Opened", value: issueCount },
      { icon: "📝", label: "# Lines of Code", value: "N/A" },
    ],
    [commitCount, pullRequestCount, issueCount]
  );

  const alertMessage = useMemo(() => {
    if (errorMessage) {
      return errorMessage;
    }

    if (isLoading) {
      return "Loading repository metrics...";
    }

    if (teamMembers.length === 0) {
      return "No recent commit activity for this repository.";
    }

    const topMember = teamMembers[0];
    return `⭐ ${topMember.name} leads with ${topMember.percentage}% of recent commits.`;
  }, [errorMessage, isLoading, teamMembers]);

  const latestCommitMessage = commits[0]?.message || "No commits available";

   // Render different layouts based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "Settings":
        // For Settings, render a different layout without the Dashboard wrapper
        return (
          <div className="dashboard-container">
            <Sidebar 
              activeTab={activeTab} 
              onTabChange={handleTabChange}
              onGenerateReport={handleGenerateReport}
              isGeneratingReport={isGeneratingReport}
            />
            <div className="dashboard-main">
              <Header
                repositories={repositories.map((repo) => repo.fullName)}
                selectedRepository={selectedRepository}
                onRepositoryChange={setSelectedRepository}
                isLoading={isLoading}
                userInfo={userInfo}
                onLogout={handleLogout}
                onChangeDisplayName={handleChangeDisplayName}
              />
              <div className="dashboard-content">
                <Settings />
              </div>
            </div>
          </div>
        );
      
      case "Dashboard":
      case "GitHub Metrics":
      default:
        // For dashboard views, render the full Dashboard component
        return (
          <Dashboard
            userInfo={userInfo}
            onLogout={handleLogout}
            onChangeDisplayName={handleChangeDisplayName}
            onGenerateReport={handleGenerateReport}
            isGeneratingReport={isGeneratingReport}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            repositories={repositories.map((repo) => repo.fullName)}
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
          />
        );
    }
  };

  return renderContent();
};

export default DashboardPage;
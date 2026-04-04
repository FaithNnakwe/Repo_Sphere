import { useEffect, useMemo, useState } from "react";
import Dashboard from "../components/Dashboard/Dashboard";

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

  useEffect(() => {
    const loadRepositories = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
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
        const parsedRepos = repoData
          .map(parseRepository)
          .filter((repo): repo is RepositoryOption => repo !== null);

        setRepositories(parsedRepos);
        if (parsedRepos.length > 0) {
          setSelectedRepository(parsedRepos[0].fullName);
        }
      } catch (error) {
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

    void loadRepositories();
  }, []);

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

  return (
    <Dashboard
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
};

export default DashboardPage;

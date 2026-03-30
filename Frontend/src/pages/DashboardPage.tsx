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
  const [pullRequests, setPullRequests] = useState<PullApiResponse[]>([]);
  const [languages, setLanguages] = useState<LanguageEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const loadRepositories = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(buildApiUrl("/api/repos"));
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error(
              "GitHub authentication required. Configure backend GITHUB_TOKEN (or connect account) and restart backend."
            );
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
      setPullRequests([]);
      setLanguages([]);
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
        const [commitsResponse, pullsResponse, languagesResponse] = await Promise.all([
          fetch(buildApiUrl(`/api/repos/${owner}/${repo}/commits`)),
          fetch(buildApiUrl(`/api/repos/${owner}/${repo}/pulls`)),
          fetch(buildApiUrl(`/api/repos/${owner}/${repo}/languages`)),
        ]);

        if (!commitsResponse.ok || !pullsResponse.ok) {
          throw new Error("Unable to load repository metrics");
        }

        const commitsData = (await commitsResponse.json()) as CommitApiResponse[];
        const pullsData = (await pullsResponse.json()) as PullApiResponse[];

        setCommits(commitsData);
        setPullRequests(pullsData);

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
        setPullRequests([]);
        setLanguages([]);
        setErrorMessage("Could not load repository metrics from backend.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadRepositoryMetrics();
  }, [selectedRepository]);

  const stats = useMemo(
    () => [
      { icon: "📊", label: "Total Number of Commits", value: commits.length },
      { icon: "🔀", label: "Total Pull Requests", value: pullRequests.length },
      { icon: "⚠️", label: "Issues Opened", value: "N/A" },
      { icon: "📝", label: "# Lines of Code", value: "N/A" },
    ],
    [commits.length, pullRequests.length]
  );

  const teamMembers = useMemo(() => {
    const authorTotals = commits.reduce<Record<string, number>>((accumulator, commit) => {
      const authorName = commit.author?.trim() || "Unknown";
      accumulator[authorName] = (accumulator[authorName] || 0) + 1;
      return accumulator;
    }, {});

    const totalCommits = Object.values(authorTotals).reduce((sum, count) => sum + count, 0);

    return Object.entries(authorTotals)
      .map(([name, count]) => ({
        name,
        percentage: totalCommits > 0 ? Math.round((count / totalCommits) * 100) : 0,
        icon: "👤",
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
  }, [commits]);

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
      commitCount={commits.length}
      pullRequestCount={pullRequests.length}
      latestCommitMessage={latestCommitMessage}
      languages={languages}
    />
  );
};

export default DashboardPage;

//export const API_BASE = "http://localhost:3000";
//export const API_BASE = "http://localhost:3000";
export const API_BASE = import.meta.env.VITE_API_BASE_URL;
console.log("API_BASE:", API_BASE);

export type AuthResponse = {
  loggedIn: boolean;
  ghUser?: string;
  displayName?: string | null;
};

export async function getCurrentUser(): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    credentials: "include",
  });

  if (!res.ok) {
    return { loggedIn: false };
  }

  return res.json();
}

export function loginWithGithub() {
  window.location.href = `${API_BASE}/auth/github`;
}

export async function logoutFromGithub(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "GET",
    credentials: "include",
  });
}

export async function saveDisplayName(displayName: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/profile/display-name`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ displayName }),
  });

  if (!response.ok) {
    throw new Error("Failed to save display name");
  }
}

// ─── Notification Settings ────────────────────────────────────────────────────

export type NotificationSettings = {
  commits: boolean;
  comments: boolean;
  codeReviews: boolean;
  issues: boolean;
  merge: boolean;
  pullRequests: boolean;
  achievements: boolean;
  email: boolean;
  inApp: boolean;
  quietStart: string;
  quietEnd: string;
};

export type GitHubNotification = {
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
};

export type DashboardNotification = GitHubNotification & {
  notificationType?: "github" | "achievement";
  achievementMilestone?: number;
};

export async function getGithubNotifications(
  prefs: Pick<
    NotificationSettings,
    "commits" | "comments" | "codeReviews" | "issues" | "merge" | "pullRequests"
  >
): Promise<GitHubNotification[]> {
  const params = new URLSearchParams({
    commits: String(prefs.commits),
    comments: String(prefs.comments),
    codeReviews: String(prefs.codeReviews),
    issues: String(prefs.issues),
    merge: String(prefs.merge),
    pullRequests: String(prefs.pullRequests),
  });

  const res = await fetch(`${API_BASE}/api/github/notifications?${params}`, {
    credentials: "include",
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to fetch GitHub notifications");
  }

  return res.json() as Promise<GitHubNotification[]>;
}

export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  const res = await fetch(`${API_BASE}/api/notifications/settings`, {
    credentials: "include",
  });

  if (!res.ok) return null;
  return res.json() as Promise<NotificationSettings | null>;
}

export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/notifications/settings`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });

  if (!res.ok) {
    throw new Error("Failed to save notification settings to server");
  }
}

// ─── GitHub Metrics / Reports ────────────────────────────────────────────────

export type RepositoryOption = {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  owner: {
    login: string;
    avatarUrl?: string;
  };
};

export type RepoAnalyticsResponse = {
  summary: {
    totalCommits: number;
    commitGrowth: string;
    pullRequests: number;
    pullRequestGrowth: string;
    activeContributors: number;
    contributorGrowth: string;
    codeCoverage: number;
    coverageGrowth: string;
  };
  commitActivity: Array<{
    week: string;
    commits: number;
  }>;
  pullRequestBreakdown: {
    merged: number;
    open: number;
    closed: number;
  };
  issueOverview: Array<{
    week: string;
    opened: number;
    closed: number;
  }>;
};

export type CodeModificationLog = {
  date: string;
  contributor: string;
  filesChanged: number;
  additions: number;
  deletions: number;
};

export type RepoBranch = {
  name: string;
};

async function handleJsonResponse<T>(
  res: Response,
  fallbackMessage: string
): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || fallbackMessage);
  }

  return res.json() as Promise<T>;
}

export async function getRepositories(): Promise<RepositoryOption[]> {
  const res = await fetch(`${API_BASE}/api/github/repositories`, {
    credentials: "include",
  });

  return handleJsonResponse<RepositoryOption[]>(
    res,
    "Failed to fetch repositories"
  );
}

export async function getRepoBranches(
  owner: string,
  repo: string
): Promise<RepoBranch[]> {
  const fullRepo = `${owner}/${repo}`;

  const res = await fetch(
    `${API_BASE}/api/github/reports/branches?repo=${encodeURIComponent(fullRepo)}`,
    { credentials: "include" }
  );

  return handleJsonResponse<RepoBranch[]>(
    res,
    "Failed to fetch repository branches"
  );
}

export async function getRepoAnalytics(
  repo: string,
  days: number = 30,
  branch?: string
): Promise<RepoAnalyticsResponse> {
  const params = new URLSearchParams({
    repo,
    days: String(days),
  });

  if (branch) {
    params.set("branch", branch);
  }

  const res = await fetch(
    `${API_BASE}/api/github/reports/analytics?${params.toString()}`,
    { credentials: "include" }
  );

  return handleJsonResponse<RepoAnalyticsResponse>(
    res,
    "Failed to fetch repository analytics"
  );
}

export async function getRepoCodeModifications(
  repo: string,
  days: number = 30,
  branch?: string
): Promise<CodeModificationLog[]> {
  const params = new URLSearchParams({
    repo,
    days: String(days),
  });

  if (branch) {
    params.set("branch", branch);
  }

  const res = await fetch(
    `${API_BASE}/api/github/reports/modifications?${params.toString()}`,
    { credentials: "include" }
  );

  return handleJsonResponse<CodeModificationLog[]>(
    res,
    "Failed to fetch code modification log"
  );
}

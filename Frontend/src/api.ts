export const API_BASE = "http://localhost:3000";

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

// --- Metrics API Types ---
export type CommitActivity = {
  date: string;
  count: number;
  sha: string[];
  messages: string[];
};

export type PullRequestActivity = {
  date: string;
  opened: number;
  closed: number;
  merged: number;
  titles: string[];
};

export type IssueActivity = {
  date: string;
  opened: number;
  closed: number;
  titles: string[];
};

export type CodeFrequency = {
  date: string;
  additions: number;
  deletions: number;
  net: number;
};

export type ContributorStats = {
  login: string;
  name: string;
  avatar: string;
  commits: number;
  additions: number;
  deletions: number;
  pullRequests: number;
  issues: number;
};

export type WeeklyCommitData = {
  week: number; // Unix timestamp
  total: number;
  days: number[];
};

export type DailyActivity = {
  day: string; // 'Mon', 'Tue', etc.
  hour: number; // 0-23
  count: number;
};

export type MetricsTimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

/**
 * Get detailed commit activity over time
 */
export async function getCommitActivity(
  owner: string,
  repo: string,
  range: MetricsTimeRange = '30d'
): Promise<CommitActivity[]> {
  const res = await fetch(
    `${API_BASE}/api/metrics/${owner}/${repo}/commits/activity?range=${range}`,
    { credentials: "include" }
  );
  
  if (!res.ok) {
    throw new Error("Failed to fetch commit activity");
  }
  
  return res.json();
}

/**
 * Get pull request activity over time
 */
export async function getPullRequestActivity(
  owner: string,
  repo: string,
  range: MetricsTimeRange = '30d'
): Promise<PullRequestActivity[]> {
  const res = await fetch(
    `${API_BASE}/api/metrics/${owner}/${repo}/pulls/activity?range=${range}`,
    { credentials: "include" }
  );
  
  if (!res.ok) {
    throw new Error("Failed to fetch PR activity");
  }
  
  return res.json();
}

/**
 * Get issue activity over time
 */
export async function getIssueActivity(
  owner: string,
  repo: string,
  range: MetricsTimeRange = '30d'
): Promise<IssueActivity[]> {
  const res = await fetch(
    `${API_BASE}/api/metrics/${owner}/${repo}/issues/activity?range=${range}`,
    { credentials: "include" }
  );
  
  if (!res.ok) {
    throw new Error("Failed to fetch issue activity");
  }
  
  return res.json();
}

/**
 * Get code frequency (additions/deletions) over time
 */
export async function getCodeFrequency(
  owner: string,
  repo: string,
  range: MetricsTimeRange = '30d'
): Promise<CodeFrequency[]> {
  const res = await fetch(
    `${API_BASE}/api/metrics/${owner}/${repo}/code-frequency?range=${range}`,
    { credentials: "include" }
  );
  
  if (!res.ok) {
    throw new Error("Failed to fetch code frequency");
  }
  
  return res.json();
}

/**
 * Get contributor statistics
 */
export async function getContributorStats(
  owner: string,
  repo: string
): Promise<ContributorStats[]> {
  const res = await fetch(
    `${API_BASE}/api/metrics/${owner}/${repo}/contributors`,
    { credentials: "include" }
  );
  
  if (!res.ok) {
    throw new Error("Failed to fetch contributor stats");
  }
  
  return res.json();
}

/**
 * Get weekly commit data for calendar heatmap
 */
export async function getWeeklyCommitData(
  owner: string,
  repo: string
): Promise<WeeklyCommitData[]> {
  const res = await fetch(
    `${API_BASE}/api/metrics/${owner}/${repo}/weekly-commits`,
    { credentials: "include" }
  );
  
  if (!res.ok) {
    throw new Error("Failed to fetch weekly commit data");
  }
  
  return res.json();
}

/**
 * Get daily activity heatmap data (by day of week and hour)
 */
export async function getDailyActivityHeatmap(
  owner: string,
  repo: string
): Promise<DailyActivity[]> {
  const res = await fetch(
    `${API_BASE}/api/metrics/${owner}/${repo}/daily-activity`,
    { credentials: "include" }
  );
  
  if (!res.ok) {
    throw new Error("Failed to fetch daily activity heatmap");
  }
  
  return res.json();
}

/**
 * Fetches unread GitHub notifications from the backend, filtered
 * according to the user's saved preference toggles.
 */
export async function getGithubNotifications(
  prefs: Pick<NotificationSettings, "commits" | "comments" | "codeReviews" | "issues" | "merge" | "pullRequests">
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
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? "Failed to fetch GitHub notifications");
  }

  return res.json() as Promise<GitHubNotification[]>;
}

/**
 * Loads the authenticated user's notification settings from the backend.
 * Returns null when the user is not logged in or has no saved settings yet.
 */
export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  const res = await fetch(`${API_BASE}/api/notifications/settings`, {
    credentials: "include",
  });

  if (!res.ok) return null;
  return res.json() as Promise<NotificationSettings | null>;
}

/**
 * Persists notification preference settings on the backend for the
 * currently authenticated user.
 */
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
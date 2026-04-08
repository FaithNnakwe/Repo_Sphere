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
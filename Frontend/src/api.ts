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
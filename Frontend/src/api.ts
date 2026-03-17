const API_BASE = "http://localhost:3000";

export type AuthResponse = {
  loggedIn: boolean;
  ghUser?: string;
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
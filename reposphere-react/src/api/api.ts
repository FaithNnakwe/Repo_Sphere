// reposphere-react/api/api.ts

// Option A (recommended): use env var for backend base URL
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const fetchHello = async (): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE}/api/hello`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch data");
  return response.json();
};

// 1) Start OAuth (no fetch — just redirect)
export const loginWithGitHub = (): void => {
  window.location.href = `${API_BASE}/auth/github`;
};

// 2) Check login (backend reads cookie)
export const fetchMe = async (): Promise<{ loggedIn: boolean; ghUser?: string }> => {
  const response = await fetch(`${API_BASE}/auth/me`, {
    credentials: "include", // IMPORTANT
  });

  if (!response.ok) return { loggedIn: false };
  return response.json();
};

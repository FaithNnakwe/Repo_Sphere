import { useEffect, useState } from "react";

function App() {
  const [user, setUser] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const API = "http://localhost:3000";

  // check login
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${API}/auth/me`, {
        credentials: "include",
      });

      const data = await res.json();

      setLoggedIn(data.loggedIn);

      if (data.loggedIn) {
        await fetchProfile();
        await fetchRepos();
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    const res = await fetch(`${API}/github/profile`, {
      credentials: "include",
    });

    const data = await res.json();
    setUser(data);
  };

  const fetchRepos = async () => {
    const res = await fetch(`${API}/github/repos`, {
      credentials: "include",
    });

    const data = await res.json();
    setRepos(data);
  };

  const login = () => {
    window.location.href = `${API}/auth/github`;
  };

  const logout = async () => {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    setUser(null);
    setRepos([]);
    setLoggedIn(false);
  };

  if (loading) {
    return <div>Loading RepoSphere...</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>RepoSphere</h1>

      {!loggedIn && (
        <button onClick={login}>
          Login with GitHub
        </button>
      )}

      {loggedIn && (
        <>
          <button onClick={logout}>Logout</button>

          {user && (
            <div>
              <h2>Profile</h2>

              <img
                src={user.avatar_url}
                width="100"
                alt="avatar"
              />

              <p>Username: {user.login}</p>
              <p>Name: {user.name}</p>
              <p>Repos: {user.public_repos}</p>
              <p>Followers: {user.followers}</p>
            </div>
          )}

          <div>
            <h2>Repositories</h2>

            {repos.length === 0 && <p>No repos found</p>}

            {repos.slice(0, 10).map((repo: any) => (
              <div key={repo.id}>
                <p>
                  <strong>{repo.name}</strong>
                </p>

                <p>⭐ {repo.stargazers_count}</p>
                <p>{repo.language}</p>

                <hr />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
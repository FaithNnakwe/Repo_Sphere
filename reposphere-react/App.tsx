import { useEffect, useState } from "react";
import { fetchHello, loginWithGitHub, fetchMe } from "./api/api";

function App() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [me, setMe] = useState<{ loggedIn: boolean; ghUser?: string } | null>(null);

  useEffect(() => {
    fetchHello()
      .then((data) => setMessage(data.message))
      .catch((err) => setError(err.message));

    fetchMe()
      .then(setMe)
      .catch(() => setMe({ loggedIn: false }));
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>RepoSphere</h1>

      <button onClick={loginWithGitHub}>Sign in with GitHub</button>

      {me?.loggedIn ? (
        <p>Logged in as: <b>{me.ghUser}</b></p>
      ) : (
        <p>Not logged in</p>
      )}

      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      <p>{message || "Loading..."}</p>
    </div>
  );
}

export default App;


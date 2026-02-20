import { useEffect, useState } from "react";
import { fetchHello, fetchMe, loginWithGitHub } from "./api/api";

function App() {
  // state management
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [loggedIn, setLoggedIn] = useState(false);
  const [ghUser, setGhUser] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchHello()
      .then((data) => setMessage(data.message))
      .catch((err) => setError(err.message));
// Check if the user is already authenticated by checking for cookies
    fetchMe()
      .then((me) => {
        setLoggedIn(me.loggedIn);
        setGhUser(me.ghUser);
      })
      .catch(() => {
        setLoggedIn(false);
        setGhUser(undefined);
      });
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>React + Express</h1>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      <p>{message || "Loading..."}</p>

      <hr style={{ margin: "1.5rem 0" }} />

      {!loggedIn ? (
        <button onClick={loginWithGitHub}>Sign in with GitHub</button>
      ) : (
        <div>
          <p>
            Logged in as <b>{ghUser}</b>
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
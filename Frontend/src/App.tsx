import React, { useEffect, useState } from "react";
import LoginPage from "./LoginPage";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [ghUser, setGhUser] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:3000/auth/me", {
      credentials: "include", // 🔴 REQUIRED for cookies
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          setIsLoggedIn(true);
          setGhUser(data.ghUser);
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch(() => setIsLoggedIn(false));
  }, []);

  // ⏳ While checking auth status
  if (isLoggedIn === null) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      {isLoggedIn ? (
        <>
          <h2>Welcome, {ghUser}</h2>
        </>
      ) : (
        <LoginPage />
      )}
    </div>
  );
}

export default App;
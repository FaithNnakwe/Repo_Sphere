import { useEffect, useState } from "react";
import { getCurrentUser, logoutFromGithub } from "../api";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  const [displayName, setDisplayName] = useState("");
  const [githubUser, setGithubUser] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuth() {
      const data = await getCurrentUser();

      if (!data.loggedIn) {
        navigate("/login");
        return;
      }

      const storedName = localStorage.getItem("displayName");
      const resolvedDisplayName = storedName || data.displayName || "";

      if (!resolvedDisplayName) {
        navigate("/setup-profile");
        return;
      }

      if (!storedName && data.displayName) {
        localStorage.setItem("displayName", data.displayName);
      }

      setDisplayName(resolvedDisplayName);
      setGithubUser(data.ghUser || "");
    }

    checkAuth();
  }, [navigate]);

  const avatar = `https://github.com/${githubUser}.png`;

  return (
    <div className="home-container">

      <div className="profile-card">

        <img src={avatar} className="avatar" />

        <h2>{displayName}</h2>

        <button
          className="display-name-link"
          onClick={() => {
            localStorage.removeItem("displayName");
            navigate("/setup-profile");
          }}
        >
          Change display name
        </button>

        <p className="github-username">@{githubUser}</p>

        <div className="button-group">

          <button
            className="logout-btn"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>

          <a
            href={`https://github.com/${githubUser}`}
            target="_blank"
            className="profile-btn"
          >
            View GitHub
          </a>

          <button
            className="logout-btn"
            onClick={async () => {
              localStorage.removeItem("displayName");
              try {
                await logoutFromGithub();
              } finally {
                window.location.href = "/login";
              }
            }}
          >
            Logout
          </button>

        </div>

      </div>

    </div>
  );
}
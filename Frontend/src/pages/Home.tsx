import { useEffect, useState } from "react";
import { getCurrentUser } from "../api";
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

      if (!storedName) {
        navigate("/setup-profile");
        return;
      }

      setDisplayName(storedName);
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

        <p className="github-username">@{githubUser}</p>

        <div className="button-group">

          <a
            href={`https://github.com/${githubUser}`}
            target="_blank"
            className="profile-btn"
          >
            View GitHub
          </a>

          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("displayName");
              window.location.href = "/login";
            }}
          >
            Logout
          </button>

        </div>

      </div>

    </div>
  );
}
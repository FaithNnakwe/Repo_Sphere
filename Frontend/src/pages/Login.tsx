import { loginWithGithub, getCurrentUser } from "../api";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuth() {
      const data = await getCurrentUser();
      if (data.loggedIn) navigate("/");
    }
    checkAuth();
  }, [navigate]);

  return (
    <div className="login-page">

      {/* LEFT INFO PANEL */}

      <div className="login-info">

        <h1 className="info-title">RepoSphere</h1>

        <p className="info-subtitle">
          Explore repositories, collaborate with developers, and uncover insights from GitHub activity.
        </p>

        <ul className="feature-list">
          <li>🔎 Discover repository insights</li>
          <li>📊 Analyze development trends</li>
          <li>🤝 Collaborate with your team</li>
        </ul>

      </div>


      {/* RIGHT LOGIN PANEL */}

      <div className="login-container">

        <div className="login-card">

          <img
            className="github-logo"
            src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
            alt="GitHub"
          />

          <h2>Sign in with GitHub</h2>

          <p className="login-description">
            RepoSphere uses GitHub authentication to connect your account and provide repository insights.
          </p>

          <p className="terms-text">
            By continuing, you allow <strong>RepoSphere</strong> to access basic profile information and repository metadata from your GitHub account. This access helps personalize insights and collaboration features within the platform.
          </p>

          <button className="github-btn" onClick={loginWithGithub}>
            Continue with GitHub
          </button>

        </div>

      </div>

    </div>
  );
}
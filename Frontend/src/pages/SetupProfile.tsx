import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/setupProfile.css";

export default function SetupProfile() {
  const [displayName, setDisplayName] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!displayName.trim()) return;

    localStorage.setItem("displayName", displayName);

    navigate("/");
  }

  return (
    <div className="setup-container">

      <div className="setup-card">

        <h1 className="setup-title">Welcome to RepoSphere</h1>

        <p className="setup-subtitle">
          Choose a display name others will see
        </p>

        <form onSubmit={handleSubmit}>

          <input
            className="display-input"
            type="text"
            placeholder="Enter display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <button className="continue-btn" type="submit">
            Continue
          </button>

        </form>

      </div>

    </div>
  );
}
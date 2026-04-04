import "./header.css";
import { useState } from "react";

interface HeaderProps {
  repositories: string[];
  selectedRepository: string;
  onRepositoryChange: (repository: string) => void;
  isLoading: boolean;
  userInfo: {
    displayName: string;
    githubUser: string;
    avatarUrl: string;
  };
  onLogout: () => void;
  onChangeDisplayName: () => void;
}

const Header = ({
  repositories,
  selectedRepository,
  onRepositoryChange,
  isLoading,
  userInfo,
  onLogout,
  onChangeDisplayName,
}: HeaderProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const today = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="header">
      <div className="header-left">
        <div className="repo-dropdown">
          <select
            className="dropdown-select"
            value={selectedRepository}
            onChange={(event) => onRepositoryChange(event.target.value)}
            disabled={isLoading || repositories.length === 0}
          >
            {repositories.length === 0 ? (
              <option value="">No repositories</option>
            ) : (
              repositories.map((repository) => (
                <option key={repository} value={repository}>
                  {repository}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="date-display">
          <span>{today}</span>
        </div>
      </div>

      <div className="header-right">
        <input
          type="text"
          className="search-bar"
          placeholder="Search Bar"
        />

        <div className="user-info">
          <div 
            className="user-profile-trigger"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <img 
              src={userInfo.avatarUrl} 
              alt={userInfo.displayName}
              className="user-avatar"
            />
            <span className="user-name">{userInfo.displayName}</span>
            <span className="dropdown-arrow">▼</span>
          </div>
          
          {isProfileOpen && (
            <>
              <div className="dropdown-overlay" onClick={() => setIsProfileOpen(false)} />
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <img 
                    src={userInfo.avatarUrl} 
                    alt={userInfo.displayName}
                    className="dropdown-avatar"
                  />
                  <div className="dropdown-user-info">
                    <strong>{userInfo.displayName}</strong>
                    <span className="dropdown-github-user">@{userInfo.githubUser}</span>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button 
                  onClick={() => {
                    setIsProfileOpen(false);
                    onChangeDisplayName();
                  }}
                  className="dropdown-item"
                >
                  <span className="dropdown-icon">✏️</span>
                  Change Display Name
                </button>
                <a
                  href={`https://github.com/${userInfo.githubUser}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dropdown-item"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <span className="dropdown-icon">🔗</span>
                  View GitHub Profile
                </a>
                <div className="dropdown-divider"></div>
                <button 
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                  className="dropdown-item logout-item"
                >
                  <span className="dropdown-icon">🚪</span>
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
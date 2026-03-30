import "./header.css";

interface HeaderProps {
  repositories: string[];
  selectedRepository: string;
  onRepositoryChange: (repository: string) => void;
  isLoading: boolean;
}

const Header = ({
  repositories,
  selectedRepository,
  onRepositoryChange,
  isLoading,
}: HeaderProps) => {
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
          <div className="user-icon">👤</div>
          <span>Shared View</span>
        </div>
      </div>
    </div>
  );
};

export default Header;

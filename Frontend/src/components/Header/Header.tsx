import "./header.css";

const Header = () => {
  return (
    <div className="header">
      <div className="header-left">
        <div className="repo-dropdown">
          <button className="dropdown-btn">Repo Dropdown</button>
        </div>

        <div className="date-display">
          <span>DATE</span>
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
          <span>User Info</span>
        </div>
      </div>
    </div>
  );
};

export default Header;

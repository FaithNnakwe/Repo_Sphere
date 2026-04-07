import { NavLink } from "react-router-dom";
import "./sidebar.css";

const Sidebar = () => {
  const menuItems = [
    { label: "Dashboard", icon: "📊", path: "/dashboard", accentClass: "nav-item-dashboard" },
    { label: "GitHub Metrics", icon: "📈", path: "/", accentClass: "nav-item-metrics" },
    { label: "Reports", icon: "📋", path: "/", accentClass: "nav-item-reports" },
    { label: "Settings", icon: "⚙️", path: "/settings", accentClass: "nav-item-settings" }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img className="brand-image" src="/Logo.png" alt="Repo Sphere" />
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={`${item.label}-${item.path}`}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `nav-item ${item.accentClass}${isActive ? " nav-item-active" : ""}`
            }
            aria-label={`Go to ${item.label}`}
          >
            {({ isActive }) => (
              <>
                <span className="nav-item-main">
                  <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </span>
                {isActive && <span className="nav-active-indicator" aria-hidden="true" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>v1.0.0</p>
      </div>
    </div>
  );
};

export default Sidebar;

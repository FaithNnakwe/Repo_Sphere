import { Link } from "react-router-dom";
import "./sidebar.css";

const Sidebar = () => {
  const menuItems = [
    { label: "Dashboard", icon: "📊", path: "/dashboard" },
    { label: "GitHub Metrics", icon: "📈", path: "/" },
    { label: "Reports", icon: "📋", path: "/" },
    { label: "Settings", icon: "⚙️", path: "/settings" }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img className="brand-image" src="/Logo.png" alt="Repo Sphere" />
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <Link key={index} to={item.path} className="nav-item">
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>v1.0.0</p>
      </div>
    </div>
  );
};

export default Sidebar;

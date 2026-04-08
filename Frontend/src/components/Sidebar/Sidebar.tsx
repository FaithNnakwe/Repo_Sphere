// Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import "./sidebar.css";

interface SidebarProps {
  onTabChange?: (tab: string) => void;
  onGenerateReport?: () => void;
  isGeneratingReport?: boolean;
}

const Sidebar = ({ 
  onTabChange, 
  onGenerateReport,
  isGeneratingReport = false 
}: SidebarProps) => {
  const location = useLocation();

  const menuItems = [
    { label: "Dashboard", icon: "📊", path: "/" },
    { label: "GitHub Metrics", icon: "📈", path: "/github-metrics" },
    { label: "Download Report", icon: "⬇️", action: "report", path: "#" },
    { label: "Settings", icon: "⚙️", path: "/settings" }
  ];

  const handleItemClick = (item: any) => {
    if (item.action === "report" && onGenerateReport) {
      onGenerateReport();
    } else if (onTabChange && item.path !== "#") {
      onTabChange(item.label);
    }
  };

  // Check if the current path matches the item's path
  const isActive = (item: any) => {
    if (item.path === "#") return false;
    if (item.path === "/") {
      return location.pathname === "/";
    }
    return location.pathname === item.path;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img className="brand-image" src="/Logo.png" alt="Repo Sphere" />
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          item.action === "report" ? (
            <button 
              key={index}
              className={`nav-item ${isGeneratingReport ? 'loading' : ''}`}
              onClick={() => handleItemClick(item)}
              disabled={isGeneratingReport}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">
                {isGeneratingReport ? "Generating..." : item.label}
              </span>
            </button>
          ) : (
            <Link 
              key={index} 
              to={item.path} 
              className={`nav-item ${isActive(item) ? 'active' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          )
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>v1.0.0</p>
      </div>
    </div>
  );
};

export default Sidebar;
import { Link, useLocation, useNavigate  } from "react-router-dom";
import "./sidebar.css";

interface SidebarProps {
  onTabChange?: (tab: string) => void;
  onGenerateReport?: () => void;
  isGeneratingReport?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeTab?: string;  // Add this to track active tab
}

const Sidebar = ({ 
  onTabChange, 
  onGenerateReport,
  isGeneratingReport = false, 
  isCollapsed = false,
  onToggleCollapse,
  activeTab = "Dashboard"  // Default to Dashboard
}: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  };

  const menuItems = [
    { label: "Dashboard", icon: "📊", type: "route", path: "/", tabName: "Dashboard", accentClass: "nav-item-dashboard" },
    { label: "GitHub Metrics", icon: "📈", type: "tab", tabName: "Github Metrics", accentClass: "nav-item-metrics" },
    { label: "Download Report", icon: "⬇️", type: "action", action: "report", accentClass: "nav-item-reports" },
    { label: "Settings", icon: "⚙️", type: "route", path: "/settings", tabName: "Settings", accentClass: "nav-item-settings" }
  ];

  const handleItemClick = (item: any) => {
  if (item.type === "action" && item.action === "report" && onGenerateReport) {
    onGenerateReport();
  } else if (item.type === "tab") {
    // For GitHub Metrics tab
    if (location.pathname !== "/") {
      // Navigate to home page with a query parameter
      navigate(`/?tab=${encodeURIComponent(item.tabName)}`);
    } else if (onTabChange) {
      onTabChange(item.tabName);
    }
  } else if (item.type === "route") {
    if (item.path === "/" && onTabChange) {
      onTabChange("Dashboard");
    }
    navigate(item.path);
  }
};

  // Check if the current path matches the item's path
  const isActive = (item: any) => {
    if (item.type === "tab") {
      return activeTab === item.tabName;
    }
    if (item.type === "route") {
      if (item.path === "/") {
        return location.pathname === "/" && activeTab === "Dashboard";
      }
      return location.pathname === item.path;
    }
    return false;
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button 
        className="sidebar-toggle" 
        onClick={toggleSidebar}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? "→" : "←"}
      </button>

      <div className="sidebar-header">
        {!isCollapsed && (
          <img className="brand-image" src="/Logo.png" alt="Repo Sphere" />
        )}
        {isCollapsed && (
          <div className="brand-icon">📊</div>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => {
          if (item.type === "action") {
            return (
              <button 
                key={index}
                className={`nav-item ${item.accentClass} ${isGeneratingReport ? 'loading' : ''}`}
                onClick={() => handleItemClick(item)}
                disabled={isGeneratingReport}
                aria-label={isCollapsed ? item.label : "Generate report"}
                title={isCollapsed ? item.label : ""}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                {!isCollapsed && (
                  <span className="nav-label">
                    {isGeneratingReport ? "Generating..." : item.label}
                  </span>
                )}
              </button>
            );
          } else if (item.type === "tab") {
            return (
              <button 
                key={index}
                className={`nav-item ${item.accentClass} ${isActive(item) ? 'active' : ''}`}
                onClick={() => handleItemClick(item)}
                aria-label={isCollapsed ? item.label : `Go to ${item.label}`}
                title={isCollapsed ? item.label : ""}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
                {isActive(item) && <span className="nav-active-indicator" aria-hidden="true" />}
              </button>
            );
          } else {
            // Regular route links (Dashboard, Settings)
            return (
              <Link 
                key={index} 
                to={item.path as string}  // Type assertion to fix the TypeScript error
                className={`nav-item ${item.accentClass} ${isActive(item) ? 'active' : ''}`}
                onClick={() => handleItemClick(item)}
                aria-label={isCollapsed ? item.label : `Go to ${item.label}`}
                title={isCollapsed ? item.label : ""}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
                {isActive(item) && <span className="nav-active-indicator" aria-hidden="true" />}
              </Link>
            );
          }
        })}
      </nav>

      {!isCollapsed && (
        <div className="sidebar-footer">
          <p>v1.0.0</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
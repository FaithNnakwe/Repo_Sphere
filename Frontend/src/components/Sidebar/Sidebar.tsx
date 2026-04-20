import type { ElementType } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Download,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import "./sidebar.css";

interface SidebarProps {
  onGenerateReport?: () => void;
  isGeneratingReport?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface MenuItem {
  label: string;
  icon: ElementType;
  path?: string;
  accentClass: string;
  action?: "report";
}

const Sidebar = ({
  onGenerateReport,
  isGeneratingReport = false,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) => {
  const location = useLocation();

  const menuItems: MenuItem[] = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/",
      accentClass: "nav-item-dashboard",
    },
    {
      label: "GitHub Metrics",
      icon: BarChart3,
      path: "/reports",
      accentClass: "nav-item-metrics",
    },
    {
      label: "Download Report",
      icon: Download,
      action: "report",
      accentClass: "nav-item-reports",
    },
    {
      label: "Settings",
      icon: Settings,
      path: "/settings",
      accentClass: "nav-item-settings",
    },
  ];

  const isActive = (item: MenuItem) => {
    if (!item.path) return false;
    if (item.path === "/") return location.pathname === "/";
    return location.pathname === item.path;
  };

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>

      <div className="sidebar-header">
        <img
          className={`brand-image ${isCollapsed ? "collapsed" : ""}`}
          src="/Logo2.png"
          alt="Repo Sphere"
        />
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          if (item.action === "report") {
            return (
              <button
                key={item.label}
                type="button"
                className={`nav-item ${item.accentClass} ${
                  isGeneratingReport ? "loading" : ""
                }`}
                onClick={onGenerateReport}
                disabled={isGeneratingReport}
                aria-label={item.label}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="nav-main">
                  <span className="nav-icon" aria-hidden="true">
                    <Icon size={20} strokeWidth={2} />
                  </span>
                  {!isCollapsed && (
                    <span className="nav-label">
                      {isGeneratingReport ? "Generating..." : item.label}
                    </span>
                  )}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.path!}
              className={`nav-item ${item.accentClass} ${active ? "active" : ""}`}
              aria-label={item.label}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="nav-main">
                <span className="nav-icon" aria-hidden="true">
                  <Icon size={20} strokeWidth={2} />
                </span>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
              </span>

              {!isCollapsed && active && (
                <span className="nav-active-indicator" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div className="sidebar-footer">
          <p>v1.0.0</p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
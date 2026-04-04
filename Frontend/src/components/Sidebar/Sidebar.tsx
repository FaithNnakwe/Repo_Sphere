import "./sidebar.css";

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onGenerateReport?: () => void;
  isGeneratingReport?: boolean;
}

const Sidebar = ({ 
  activeTab = "Dashboard", 
  onTabChange, 
  onGenerateReport,
  isGeneratingReport = false 
}: SidebarProps) => {
  const menuItems = [
    { label: "Dashboard", icon: "📊", action: "navigate" },
    { label: "GitHub Metrics", icon: "📈", action: "navigate" },
    { label: "Reports", icon: "📋", action: "report" }, // Special action for reports
    { label: "Settings", icon: "⚙️", action: "navigate" }
  ];

  const handleItemClick = (item: typeof menuItems[0]) => {
    if (item.action === "report" && onGenerateReport) {
      onGenerateReport();
    } else if (onTabChange) {
      onTabChange(item.label);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img className="brand-image" src="/Logo.png" alt="Repo Sphere" />
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <button 
            key={index} 
            className={`nav-item ${activeTab === item.label ? 'active' : ''} ${item.action === "report" && isGeneratingReport ? 'loading' : ''}`}
            onClick={() => handleItemClick(item)}
            disabled={item.action === "report" && isGeneratingReport}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">
              {item.action === "report" && isGeneratingReport ? "Generating..." : item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>v1.0.0</p>
      </div>
    </div>
  );
};

export default Sidebar;
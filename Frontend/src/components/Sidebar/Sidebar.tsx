import "./sidebar.css";

const Sidebar = () => {
  const menuItems = [
    { label: "Dashboard", icon: "📊" },
    { label: "GitHub Metrics", icon: "📈" },
    { label: "Reports", icon: "📋" },
    { label: "Settings", icon: "⚙️" }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img className="brand-image" src="/Logo.png" alt="Repo Sphere" />
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <a key={index} href="#" className="nav-item">
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>v1.0.0</p>
      </div>
    </div>
  );
};

export default Sidebar;

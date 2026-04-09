import { useState, useEffect, useMemo } from 'react';
import { Account } from './Tabs/Account';
import { Appearance } from './Tabs/Appearance';
import { Security } from './Tabs/Security';
import { Notification } from './Tabs/Notification';
import Sidebar from '../../components/Sidebar/Sidebar';
import './SettingIndex.css';

function Settings() {
    const [activeTab, setActiveTab] = useState('account');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // ADD THIS

    const tabItems = [
        { key: 'account', label: 'Account', terms: ['account', 'username', 'bio', 'profile'] },
        { key: 'appearance', label: 'Appearance', terms: ['appearance', 'theme', 'font', 'dark', 'light'] },
        { key: 'notification', label: 'Notifications', terms: ['notification', 'alerts', 'quiet', 'email', 'in-app'] },
        { key: 'security', label: 'Security', terms: ['security', 'password', '2fa', 'sso'] },
    ];

    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filteredTabs = useMemo(() =>
        normalizedSearch
            ? tabItems.filter((tab) =>
                tab.label.toLowerCase().includes(normalizedSearch) ||
                tab.terms.some((t) => t.includes(normalizedSearch))
            )
            : tabItems
    , [normalizedSearch]);

    useEffect(() => {
        if (filteredTabs.length > 0 && !filteredTabs.some((t) => t.key === activeTab)) {
            setActiveTab(filteredTabs[0].key);
        }
    }, [filteredTabs]);

    const handleSidebarToggle = () => { // ADD THIS
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'account': return <Account />;
            case 'appearance': return <Appearance />;
            case 'security': return <Security />;
            case 'notification': return <Notification />;
            default: return <Appearance />;
        }
    }

    return (
        <div className="settings-page-layout">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} // ADD THIS
                onToggleCollapse={handleSidebarToggle} // ADD THIS
            />

            <main className={`settings-main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}> {/* MODIFY THIS LINE */}
                <div className="Settings">
                    {/* Top Row: Title and Search Bar */}
                    <div className="settings-header-top">
                        <h1>Settings</h1>
                        <div className="search-wrapper">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search"
                            />
                        </div>
                    </div>

                    {/* RepoSphere Settings Navigation - Updated to Tab Style */}
                    <nav className="settings-nav">
                        {filteredTabs.length ? (
                            filteredTabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={tab.key === activeTab ? 'active' : ''}
                                >
                                    {tab.label}
                                </button>
                            ))
                        ) : (
                            <span style={{ padding: '10px', color: '#999' }}>No matching settings pages</span>
                        )}
                    </nav>

                    <div className="tab-content">
                        {filteredTabs.length ? renderTabContent() : <p>Try another search term.</p>}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Settings;
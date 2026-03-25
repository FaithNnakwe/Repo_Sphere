import { useState, useEffect } from 'react';
import { Account } from './tabs/Account';
import { Appearance } from './tabs/Appearance';
import { Security } from './tabs/Security';
import { Notification } from './tabs/Notification';
import './SettingIndex.css';

function Settings() {
    const [activeTab, setActiveTab] = useState('account');
    const [searchTerm, setSearchTerm] = useState('');

    const tabItems = [
        { key: 'account', label: 'Account', terms: ['account', 'username', 'bio', 'profile'] },
        { key: 'appearance', label: 'Appearance', terms: ['appearance', 'theme', 'font', 'dark', 'light'] },
        { key: 'notification', label: 'Notifications', terms: ['notification', 'alerts', 'quiet', 'email', 'in-app'] },
        { key: 'security', label: 'Security', terms: ['security', 'password', '2fa', 'sso'] },
    ];

    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filteredTabs = normalizedSearch
        ? tabItems.filter((tab) =>
            tab.label.toLowerCase().includes(normalizedSearch) ||
            tab.terms.some((t) => t.includes(normalizedSearch))
        )
        : tabItems;

    useEffect(() => {
        if (filteredTabs.length > 0 && !filteredTabs.some((t) => t.key === activeTab)) {
            setActiveTab(filteredTabs[0].key);
        }
    }, [filteredTabs, activeTab]);

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
    )
}

export default Settings;
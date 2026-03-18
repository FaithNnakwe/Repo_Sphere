import React, { useState } from 'react';
import { Account } from './tabs/Account';
import { Appearance } from './tabs/Appearance';
import { Security } from './tabs/Security';
import { Notification } from './tabs/Notification';
import './SettingIndex.css';

function Settings() {
    const [activeTab, setActiveTab] = useState('account');

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
                    <input type="text" placeholder="Search" />
                </div>
            </div>

            {/* RepoSphere Settings Navigation - Updated to Tab Style */}
            <nav className="settings-nav">    
                <button onClick={() => setActiveTab('account')} className="active">Account</button>
                <button onClick={() => setActiveTab('appearance')}>Appearance</button>
                <button onClick={() => setActiveTab('notification')}>Notifications <span className="badge"></span></button>
                <button onClick={() => setActiveTab('security')}>Security</button>
            </nav>

            <div className="tab-content">
                {renderTabContent()}
            </div>
        </div>
    )
}

export default Settings;
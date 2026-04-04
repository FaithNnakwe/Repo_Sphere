import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

type OAuthSecurityState = {
  connected: boolean;
  lastLogin: string;
  scopes: string[];
  sessions: Array<{ device: string; location: string; date: string; }>;
  requireReauth: boolean;
};

const defaultState: OAuthSecurityState = {
  connected: true,
  lastLogin: new Date().toLocaleString(),
  scopes: ['read:user', 'repo'],
  sessions: [
    { device: 'Chrome - Windows', location: 'New York, US', date: new Date().toLocaleString() },
    { device: 'Edge - MacOS', location: 'San Francisco, US', date: new Date(Date.now() - 1000 * 60 * 60 * 5).toLocaleString() },
  ],
  requireReauth: false,
};

export const Security = () => {
  const [connected, setConnected] = useState(defaultState.connected);
  const [lastLogin, setLastLogin] = useState(defaultState.lastLogin);
  const [scopes, setScopes] = useState<string[]>(defaultState.scopes);
  const [sessions, setSessions] = useState(defaultState.sessions);
  const [requireReauth, setRequireReauth] = useState(defaultState.requireReauth);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('oauthSecurityState');
    if (saved) {
      try {
        const parsed: OAuthSecurityState = JSON.parse(saved);
        setConnected(parsed.connected);
        setLastLogin(parsed.lastLogin);
        setScopes(parsed.scopes);
        setSessions(parsed.sessions);
        setRequireReauth(parsed.requireReauth);
      } catch (e) {
        console.warn('Failed to parse OAuth security state:', e);
      }
    }
  }, []);

  const persist = (state: OAuthSecurityState) => {
    localStorage.setItem('oauthSecurityState', JSON.stringify(state));
  };

  const handleRevokeAccess = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      setConnected(false);
      setScopes([]);
      toast.success('GitHub access revoked. Reconnect to continue using GitHub OAuth.');
      persist({ connected: false, lastLogin, scopes: [], sessions, requireReauth });
    } catch (error) {
      toast.error('Could not revoke GitHub access right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      const now = new Date().toLocaleString();
      setConnected(true);
      setLastLogin(now);
      setScopes(['read:user', 'repo']);
      toast.success('GitHub reconnected successfully.');
      persist({ connected: true, lastLogin: now, scopes: ['read:user', 'repo'], sessions, requireReauth });
    } catch (error) {
      toast.error('Reconnection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = () => {
    setSessions([]);
    toast.info('Logged out of all sessions. You will need to sign back in.');
    persist({ connected, lastLogin, scopes, sessions: [], requireReauth });
  };

  const toggleRequireReauth = () => {
    const next = !requireReauth;
    setRequireReauth(next);
    toast.success(next ? 'Require re-authentication enabled' : 'Require re-authentication disabled');
    persist({ connected, lastLogin, scopes, sessions, requireReauth: next });
  };

  const handleSaveSettings = () => {
    persist({ connected, lastLogin, scopes, sessions, requireReauth });
    toast.success('Security settings saved.');
  };

  return (
    <div className="Security-content">
      <div className="section-intro">
        <h2>Security Settings</h2>
        <p>Manage your GitHub OAuth security settings and login sessions.</p>
      </div>

      <div className="security-row">
        <h3>GitHub OAuth Status</h3>
        <p>Status: <strong>{connected ? 'Connected' : 'Disconnected'}</strong></p>
        <p>Last login: {lastLogin}</p>
        <p>Scopes: {scopes.length ? scopes.join(', ') : 'None'}</p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {connected ? (
            <button className="btn-spacing" onClick={handleRevokeAccess} disabled={loading}>Revoke GitHub Access</button>
          ) : (
            <button className="btn-spacing" onClick={handleReconnect} disabled={loading}>Reconnect GitHub</button>
          )}
          <button className="btn-spacing" onClick={handleLogoutAll} disabled={loading}>Logout All Sessions</button>
        </div>
      </div>

      <div className="security-row" style={{ marginTop: '24px' }}>
        <h3>Protection Options</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="checkbox" checked={requireReauth} onChange={toggleRequireReauth} />
          Require GitHub re-authentication for sensitive operations
        </label>
      </div>

      <div className="security-row" style={{ marginTop: '24px' }}>
        <h3>Active Sessions</h3>
        {sessions.length ? (
          <ul style={{ marginTop: '8px' }}>
            {sessions.map((s, i) => (
              <li key={i} style={{ marginBottom: '6px' }}>
                {s.device} · {s.location} · {s.date}
              </li>
            ))}
          </ul>
        ) : (
          <p>No active sessions.</p>
        )}
      </div>

      <div className="button-row" style={{ marginTop: '26px', display: 'flex', gap: '8px' }}>
        <button className="btn-spacing" onClick={handleSaveSettings} disabled={loading}>Save Settings</button>
        <button className="btn-spacing" onClick={() => window.location.reload()}>Reset (Refresh)</button>
      </div>
    </div>
  );
};

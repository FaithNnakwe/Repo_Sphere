import { useEffect, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logoutFromGithub } from '../../../api';

// 1. Updated Type Definitions
type Session = { 
  id: string; // Added ID for granular revocation
  device: string; 
  location: string; 
  date: string; 
};

type OAuthSecurityState = {
  connected: boolean;
  lastLogin: string;
  scopes: string[];
  sessions: Session[];
  requireReauth: boolean;
};

// 2. Action types for the Reducer (Centralized logic)
type Action = 
  | { type: 'LOAD_STORAGE'; payload: OAuthSecurityState }
  | { type: 'REVOKE_ALL' }
  | { type: 'REVOKE_SINGLE_SESSION'; id: string }
  | { type: 'RECONNECT'; now: string }
  | { type: 'TOGGLE_REAUTH' };

const securityReducer = (state: OAuthSecurityState, action: Action): OAuthSecurityState => {
  switch (action.type) {
    case 'LOAD_STORAGE':
      return action.payload;
    case 'REVOKE_ALL':
      return { ...state, connected: false, scopes: [], sessions: [] };
    case 'REVOKE_SINGLE_SESSION':
      return { ...state, sessions: state.sessions.filter(s => s.id !== action.id) };
    case 'RECONNECT':
      return { ...state, connected: true, lastLogin: action.now, scopes: ['read:user', 'repo'] };
    case 'TOGGLE_REAUTH':
      return { ...state, requireReauth: !state.requireReauth };
    default:
      return state;
  }
};

const defaultState: OAuthSecurityState = {
  connected: true,
  lastLogin: new Date().toLocaleString(),
  scopes: ['read:user', 'repo'],
  sessions: [
    { id: '1', device: 'Chrome - Windows', location: 'New York, US', date: new Date().toLocaleString() },
    { id: '2', device: 'Edge - MacOS', location: 'San Francisco, US', date: new Date(Date.now() - 1000 * 60 * 60 * 5).toLocaleString() },
  ],
  requireReauth: false,
};

export const Security = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(securityReducer, defaultState);
  const [loading, setLoading] = useState(false);

  // Load from LocalStorage once on mount
  useEffect(() => {
    const saved = localStorage.getItem('oauthSecurityState');
    if (saved) {
      try {
        dispatch({ type: 'LOAD_STORAGE', payload: JSON.parse(saved) });
      } catch (e) {
        console.warn('Failed to parse OAuth security state:', e);
      }
    }
  }, []);

  // Automatically save to LocalStorage whenever 'state' changes
  useEffect(() => {
    localStorage.setItem('oauthSecurityState', JSON.stringify(state));
  }, [state]);

  const handleReconnect = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      const now = new Date().toLocaleString();
      dispatch({ type: 'RECONNECT', now });
      toast.success('GitHub reconnected successfully.');
    } catch (error) {
      toast.error('Reconnection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async () => {
    setLoading(true);
    try {
      await logoutFromGithub();
      dispatch({ type: 'REVOKE_ALL' });
      localStorage.removeItem('oauthSecurityState');
      toast.success('GitHub access revoked. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      toast.error('Failed to revoke GitHub access.');
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    setLoading(true);
    try {
      await logoutFromGithub();
      dispatch({ type: 'REVOKE_ALL' });
      localStorage.removeItem('oauthSecurityState');
      toast.success('Logged out of all sessions. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      toast.error('Logout failed.');
      setLoading(false);
    }
  };

  const handleRevokeSingle = (id: string) => {
    dispatch({ type: 'REVOKE_SINGLE_SESSION', id });
    toast.info('Session terminated.');
  };

  return (
    <div className="Security-content">
      <div className="section-intro">
        <h2>Security Settings</h2>
        <p>Manage your GitHub OAuth security settings and login sessions.</p>
      </div>

      <div className="security-row">
        <h2>GitHub OAuth Status</h2>
        <p>View the current status of your GitHub OAuth connection.</p>
        <p>Status: <strong>{state.connected ? 'Connected' : 'Disconnected'}</strong></p>
        <p>Last login: {state.lastLogin}</p>
        <p>Scopes: {state.scopes.length ? state.scopes.join(', ') : 'None'}</p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {state.connected ? (
            <button className="btn-spacing" onClick={handleRevokeAccess} disabled={loading}>
              Revoke GitHub Access
            </button>
          ) : (
            <button className="btn-spacing" onClick={handleReconnect} disabled={loading}>
              Reconnect GitHub
            </button>
          )}
          <button className="btn-spacing" onClick={handleLogoutAll} disabled={loading}>
            Logout All Sessions
          </button>
        </div>
      </div>

      <div className="security-row" style={{ marginTop: '24px' }}>
        <h3>Protection Options</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={state.requireReauth} 
            onChange={() => dispatch({ type: 'TOGGLE_REAUTH' })} 
          />
          Require GitHub re-authentication for sensitive operations
        </label>
      </div>

      <div className="security-row" style={{ marginTop: '24px' }}>
        <h3>Active Sessions</h3>
        {state.sessions.length ? (
          <ul style={{ marginTop: '8px', listStyle: 'none', padding: 0 }}>
            {state.sessions.map((s) => (
              <li key={s.id} style={{ 
                marginBottom: '12px', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                borderBottom: '1px solid #eee'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{s.device}</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>{s.location} · {s.date}</div>
                </div>
                <button 
                  onClick={() => handleRevokeSingle(s.id)}
                  style={{ color: '#d9534f', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No active sessions.</p>
        )}
      </div>

      <div className="button-row" style={{ marginTop: '26px', display: 'flex', gap: '8px' }}>
        <button className="btn-spacing" onClick={() => toast.success('Settings confirmed.')} disabled={loading}>
          Save Settings
        </button>
        <button className="btn-spacing" onClick={() => window.location.reload()}>
          Reset (Refresh)
        </button>
      </div>
    </div>
  );
};
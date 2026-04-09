import { useEffect, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logoutFromGithub } from '../../../api';

type Session = { 
  id: string;
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

type Action = 
  | { type: 'LOAD_STORAGE'; payload: OAuthSecurityState }
  | { type: 'REVOKE_ALL' }
  | { type: 'REVOKE_SINGLE_SESSION'; id: string }
  | { type: 'RECONNECT'; now: string }
  | { type: 'TOGGLE_REAUTH' };

const SECURITY_STORAGE_KEY = 'oauthSecurityState';

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

  const persistRevokedState = () => {
    localStorage.removeItem(SECURITY_STORAGE_KEY);
  };

  useEffect(() => {
    const saved = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (saved) {
      try {
        dispatch({ type: 'LOAD_STORAGE', payload: JSON.parse(saved) });
      } catch (error) {
        console.warn('Failed to parse OAuth security state:', error);
        dispatch({ type: 'LOAD_STORAGE', payload: defaultState });
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(state));
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
      persistRevokedState();
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
      persistRevokedState();
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
    <div className="section-intro">
      <div className="intro-text">
        <h2>Security Settings</h2>
        <p>Manage your GitHub OAuth security settings and login sessions.</p>
      </div>

      <div className="Personal-contents">
        <div className="form-row">
          <h2>GitHub OAuth Status</h2>
          <p>View the current status of your GitHub OAuth connection and recent authentication details.</p>
          <div className="settings-meta-list">
            <p className="settings-meta-item">Status: <strong>{state.connected ? 'Connected' : 'Disconnected'}</strong></p>
            <p className="settings-meta-item">Last login: {state.lastLogin}</p>
            <p className="settings-meta-item">Scopes: {state.scopes.length ? state.scopes.join(', ') : 'None'}</p>
          </div>

          <div className="settings-inline-actions">
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
      </div>

      <div className="Personal-contents-bio">
        <div className="form-row">
          <h2>Protection Options</h2>
          <p>Enable additional checks before making sensitive account changes.</p>
          <label className="settings-checkbox-row">
            <input
              type="checkbox"
              checked={state.requireReauth}
              onChange={() => dispatch({ type: 'TOGGLE_REAUTH' })}
            />
            Require GitHub re-authentication for sensitive operations
          </label>
        </div>
      </div>

      <div className="Personal-contents-role">
        <div className="form-row">
          <h2>Active Sessions</h2>
          <p>Review your connected sessions and revoke any device you do not recognize.</p>
          {state.sessions.length ? (
            <ul className="security-session-list">
              {state.sessions.map((s) => (
                <li key={s.id} className="security-session-item">
                  <div>
                    <div className="security-session-title">{s.device}</div>
                    <div className="security-session-meta">{s.location} · {s.date}</div>
                  </div>
                  <button onClick={() => handleRevokeSingle(s.id)} className="security-session-revoke">
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No active sessions.</p>
          )}
        </div>
      </div>

      <div className="intro-actions">
        <button
          className="btn-spacing"
          onClick={() => window.location.reload()}
          disabled={loading}
        >
          Reset (Refresh)
        </button>
        <button className="btn-spacing" onClick={() => toast.success('Settings confirmed.')} disabled={loading}>
          Save Settings
        </button>
      </div>
    </div>
  );
};
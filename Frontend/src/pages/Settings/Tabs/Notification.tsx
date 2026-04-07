import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'react-toastify';
import {
  getGithubNotifications,
  getNotificationSettings,
  saveNotificationSettings,
} from '../../../api';
import type { NotificationSettings, GitHubNotification } from '../../../api';

const NOTIFICATION_SETTINGS_KEY = 'notificationSettings';

const defaultSettings: NotificationSettings = {
  commits: true,
  comments: true,
  codeReviews: true,
  issues: true,
  merge: true,
  pullRequests: true,
  achievements: true,
  email: true,
  inApp: true,
  quietStart: '22:00',
  quietEnd: '08:00',
};

export const Notification = () => {
  const [commits, setCommits] = useState(true);
  const [comments, setComments] = useState(true);
  const [codeReviews, setCodeReviews] = useState(true);
  const [issues, setIssues] = useState(true);
  const [merge, setMerge] = useState(true);
  const [pullRequests, setPullRequests] = useState(true);
  const [achievements, setAchievements] = useState(true);
  const [email, setEmail] = useState(true);
  const [inApp, setInApp] = useState(true);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('08:00');
  const [originalSettings, setOriginalSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [githubNotifications, setGithubNotifications] = useState<GitHubNotification[]>([]);
  const [notifError, setNotifError] = useState<string | null>(null);

  const applySettingsToState = (settings: NotificationSettings) => {
    setCommits(settings.commits);
    setComments(settings.comments);
    setCodeReviews(settings.codeReviews);
    setIssues(settings.issues);
    setMerge(settings.merge);
    setPullRequests(settings.pullRequests);
    setAchievements(settings.achievements);
    setEmail(settings.email);
    setInApp(settings.inApp);
    setQuietStart(settings.quietStart);
    setQuietEnd(settings.quietEnd);
  };

  // Fetches unread GitHub notifications filtered by the user's current preference toggles.
  // Clears the list when the in-app toggle is off so no stale data is shown.
  const fetchGithubNotifs = async (prefs: NotificationSettings) => {
    if (!prefs.inApp) {
      setGithubNotifications([]);
      setNotifError(null);
      return;
    }
    try {
      const notifs = await getGithubNotifications(prefs);
      setGithubNotifications(notifs);
      setNotifError(null);
    } catch (err) {
      setNotifError(err instanceof Error ? err.message : 'Failed to fetch GitHub notifications');
      setGithubNotifications([]);
    }
  };

  const parseMinutes = (time: string) => {
    const [hours, mins] = time.split(':').map(Number);
    return hours * 60 + mins;
  };

  const isQuietHours = () => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const start = parseMinutes(quietStart);
    const end = parseMinutes(quietEnd);

    if (start === end) return true;
    if (start < end) {
      return nowMinutes >= start && nowMinutes < end;
    }
    return nowMinutes >= start || nowMinutes < end;
  };

  const handleToggle = (setter: Dispatch<SetStateAction<boolean>>, name: string, currentValue: boolean) => {
    const newValue = !currentValue;
    setter(newValue);
    if (!isQuietHours()) {
      toast.success(`${name} notifications ${newValue ? 'enabled' : 'disabled'}`);
    }
  };

  const handleSave = async () => {
    const settings: NotificationSettings = {
      commits,
      comments,
      codeReviews,
      issues,
      merge,
      pullRequests,
      achievements,
      email,
      inApp,
      quietStart,
      quietEnd,
    };

    setLoading(true);
    try {
      await saveNotificationSettings(settings);
      toast.success('Notification settings saved');
    } catch {
      toast.warn('Settings saved locally — sign in to sync across devices.');
    }
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    setOriginalSettings(settings);
    await fetchGithubNotifs(settings);
    setLoading(false);
  };

  const handleCancel = () => {
    applySettingsToState(originalSettings);
    toast.info('Notification changes cancelled');
  };

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      let resolved: NotificationSettings = defaultSettings;

      try {
        // Prefer settings stored on the backend (requires the user to be logged in)
        const backendSettings = await getNotificationSettings();
        if (backendSettings) {
          resolved = { ...defaultSettings, ...backendSettings };
          localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(resolved));
        } else {
          throw new Error('No backend settings');
        }
      } catch {
        // Fall back to localStorage when the backend is unavailable or the user is not logged in
        const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        if (saved) {
          try {
            resolved = { ...defaultSettings, ...(JSON.parse(saved) as Partial<NotificationSettings>) };
          } catch {
            // keep defaults
          }
        }
      }

      applySettingsToState(resolved);
      setOriginalSettings(resolved);
      await fetchGithubNotifs(resolved);
      setLoading(false);
    };

    loadSettings();
  }, []);

  return (
    <div className="section-intro">
      <div className="intro-text">
        <h2>Notification Preferences</h2>
        <p>Manage how and when you receive updates for GitHub activity.</p>
      </div>

      <div className="Personal-contents">
        <div className="form-row">
          <h2>GitHub Notifications</h2>
          <p>Choose which GitHub events should trigger notifications.</p>

          <div className="Contribution-options">
            <div className="Delivery-row">
              <span>Commits</span>
              <label className="Switch">
                <input type="checkbox" checked={commits} onChange={() => handleToggle(setCommits, 'Commits', commits)} />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="Delivery-row">
              <span>Comments</span>
              <label className="Switch">
                <input type="checkbox" checked={comments} onChange={() => handleToggle(setComments, 'Comments', comments)} />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="Delivery-row">
              <span>Code Reviews</span>
              <label className="Switch">
                <input type="checkbox" checked={codeReviews} onChange={() => handleToggle(setCodeReviews, 'Code Reviews', codeReviews)} />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="Delivery-row">
              <span>Issues</span>
              <label className="Switch">
                <input type="checkbox" checked={issues} onChange={() => handleToggle(setIssues, 'Issues', issues)} />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="Delivery-row">
              <span>Merge</span>
              <label className="Switch">
                <input type="checkbox" checked={merge} onChange={() => handleToggle(setMerge, 'Merge', merge)} />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="Delivery-row">
              <span>Pull Requests</span>
              <label className="Switch">
                <input type="checkbox" checked={pullRequests} onChange={() => handleToggle(setPullRequests, 'Pull Requests', pullRequests)} />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="Personal-contents-bio">
        <div className="form-row">
          <h2>Delivery Preferences</h2>
          <p>Choose where you want to receive your notifications.</p>

          <div className="Notification-options">
            <div className="Delivery-row">
              <span>Email</span>
              <label className="Switch">
                <input type="checkbox" checked={email} onChange={() => handleToggle(setEmail, 'Email', email)} />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="Delivery-row">
              <span>In-App</span>
              <label className="Switch">
                <input type="checkbox" checked={inApp} onChange={() => handleToggle(setInApp, 'In-App', inApp)} />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="Personal-contents-role">
        <div className="form-row">
          <h2>Achievement Alerts</h2>
          <p>Turn this on if you wish to be notified each time you achieve a goal or milestone.</p>

          <div className="Delivery-row">
            <span>Achievement Alerts</span>
            <label className="Switch">
              <input type="checkbox" checked={achievements} onChange={() => handleToggle(setAchievements, 'Achievement', achievements)} />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="Personal-contents-role">
        <div className="form-row">
          <h2>Quiet Hours</h2>
          <p>Set a time range during which on-screen notifications are suppressed.</p>

          <div className="quiet-hours mt-2">
            <div className="time-picker">
              <input
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
              />
              <span> to </span>
              <input
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {inApp && (
        <div className="Personal-contents-role">
          <div className="form-row">
            <h2>Live GitHub Notifications</h2>
            <p>Unread GitHub notifications matching your current preference filters.</p>
            {loading ? (
              <p className="notif-status-msg">Loading notifications…</p>
            ) : notifError ? (
              <p className="notif-error-msg">{notifError}</p>
            ) : githubNotifications.length === 0 ? (
              <p className="notif-status-msg">No unread notifications match your current filters.</p>
            ) : (
              <ul className="github-notif-list">
                {githubNotifications.map((n) => (
                  <li key={n.id} className="github-notif-item">
                    <span className="notif-type-tag">{n.subject.type}</span>
                    <span className="notif-title">{n.subject.title}</span>
                    <span className="notif-repo">— {n.repository.full_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="intro-actions">
        <button
          className="btn-spacing"
          onClick={handleCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button className="btn-spacing" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default Notification;
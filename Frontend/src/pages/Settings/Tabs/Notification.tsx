import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'react-toastify';

type NotificationSettings = {
  commits: boolean;
  comments: boolean;
  codeReviews: boolean;
  issues: boolean;
  merge: boolean;
  pullRequests: boolean;
  achievements: boolean;
  email: boolean;
  inApp: boolean;
  quietStart: string;
  quietEnd: string;
};

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

  const handleSave = () => {
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

    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    setOriginalSettings(settings);
    toast.success('Notification settings saved');
  };

  const handleCancel = () => {
    applySettingsToState(originalSettings);
    toast.info('Notification changes cancelled');
  };

  useEffect(() => {
    const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved) as Partial<NotificationSettings>;
        const mergedSettings: NotificationSettings = {
          ...defaultSettings,
          ...data,
        };
        applySettingsToState(mergedSettings);
        setOriginalSettings(mergedSettings);
      } catch (error) {
        console.warn('Unable to parse saved notification settings', error);
        applySettingsToState(defaultSettings);
        setOriginalSettings(defaultSettings);
      }
    }
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

      <div className="intro-actions">
        <button
          className="btn-spacing"
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button className="btn-spacing" onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default Notification;
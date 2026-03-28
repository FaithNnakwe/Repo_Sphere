// Changes 
import React, { useState } from 'react';
import {toast} from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

export const Notification = () => {
  const [commits, setCommits] = useState(true);
  const [comments, setComments] = useState(true);
  const [codeReviews, setCodeReviews] = useState(true);
  const [issues, setIssues] = useState(true);
  const [merge, setMerge] = useState(true);
  const [pullRequests, setPullRequests] = useState(true);
  const [email, setEmail] = useState(true);
  const [inApp, setInApp] = useState(true);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('08:00');
  const [originalSettings, setOriginalSettings] = useState({
    commits: true,
    comments: true,
    codeReviews: true,
    issues: true,
    merge: true,
    pullRequests: true,
    email: true,
    inApp: true,
    quietStart: '22:00',
    quietEnd: '08:00',
  });

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

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, name: string) => {
    setter(prev => {
      const newValue = !prev;
      if (!isQuietHours()) {
        toast.success(`${name} notifications ${newValue ? 'enabled' : 'disabled'}`);
      }
      return newValue;
    });
  };

  const handleSave = () => {
    const settings = {
      commits,
      comments,
      codeReviews,
      issues,
      merge,
      pullRequests,
      email,
      inApp,
      quietStart,
      quietEnd,
    };

    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    setOriginalSettings(settings);
    toast.success('Notification settings saved');
  };

  const handleCancel = () => {
    setCommits(originalSettings.commits);
    setComments(originalSettings.comments);
    setCodeReviews(originalSettings.codeReviews);
    setIssues(originalSettings.issues);
    setMerge(originalSettings.merge);
    setPullRequests(originalSettings.pullRequests);
    setEmail(originalSettings.email);
    setInApp(originalSettings.inApp);
    setQuietStart(originalSettings.quietStart);
    setQuietEnd(originalSettings.quietEnd);
    toast.info('Notification changes cancelled');
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      const data = JSON.parse(saved);
      setCommits(data.commits ?? true);
      setComments(data.comments ?? true);
      setCodeReviews(data.codeReviews ?? true);
      setIssues(data.issues ?? true);
      setMerge(data.merge ?? true);
      setPullRequests(data.pullRequests ?? true);
      setEmail(data.email ?? true);
      setInApp(data.inApp ?? true);
      setQuietStart(data.quietStart ?? '22:00');
      setQuietEnd(data.quietEnd ?? '08:00');
      setOriginalSettings({
        commits: data.commits ?? true,
        comments: data.comments ?? true,
        codeReviews: data.codeReviews ?? true,
        issues: data.issues ?? true,
        merge: data.merge ?? true,
        pullRequests: data.pullRequests ?? true,
        email: data.email ?? true,
        inApp: data.inApp ?? true,
        quietStart: data.quietStart ?? '22:00',
        quietEnd: data.quietEnd ?? '08:00',
      });
    }
  }, []);

  return (
    <div className="Notifications-content">
        <div className="section-intro">
            <h2>Notification Preferences</h2>
            <p>Manage how and when you receive updates for GitHub activity.</p>
        </div>
        <div className = "GitHub-Contribution-form-row">
            <h3> GitHub notifications</h3>
            <p>Get notified about your GitHub activity.</p>
        </div>

        <div className="Contribution-options">
            <div className="Delivery-row">
                <span>Commits</span>
                <label className ="Switch">
                    <input type="checkbox" checked={commits} onChange={() => handleToggle(setCommits, 'Commits')} />
                    <span className="slider round"></span>
                </label>
            </div>

            <div className ="Delivery-row">
                <span>Comments</span>
                <label className ="Switch">
                    <input type="checkbox" checked={comments} onChange={() => handleToggle(setComments, 'Comments')} />
                    <span className="slider round"></span>
                </label>
            </div>

            <div className ="Delivery-row">
                <span>Code Reviews</span>
                <label className ="Switch">
                    <input type="checkbox" checked={codeReviews} onChange={() => handleToggle(setCodeReviews, 'Code Reviews')} />
                    <span className="slider round"></span>
                </label>
            </div>
           
            <div className ="Delivery-row">
                <span>Issues</span>
                <label className ="Switch">
                    <input type="checkbox" checked={issues} onChange={() => handleToggle(setIssues, 'Issues')} />
                    <span className="slider round"></span>
                </label>
            </div>

            <div className ="Delivery-row">
                <span>Merge</span>
                <label className ="Switch">
                    <input type="checkbox" checked={merge} onChange={() => handleToggle(setMerge, 'Merge')} />
                    <span className="slider round"></span>
                </label>
            </div>


            <div className ="Delivery-row">
                <span>Pull Requests</span>
                <label className ="Switch">
                    <input type="checkbox" checked={pullRequests} onChange={() => handleToggle(setPullRequests, 'Pull Requests')} />
                    <span className="slider round"></span>
                </label>
            </div>
        
        <div className="Notification-preferences">
            <h3>Notifcation preferences</h3>
            <p>Choose how you want to receive notifications.</p>
        </div>

        <div className="Notifcation-options">
            <div className="Delivery-row">
                <span>Email</span>
                <label className ="Switch">
                    <input type="checkbox" checked={email} onChange={() => handleToggle(setEmail, 'Email')} />
                    <span className="slider round"></span>
                </label>
            </div>

            <div className="Delivery-row">
                <span>In-App</span>
                <label className ="Switch">
                    <input type="checkbox" checked={inApp} onChange={() => handleToggle(setInApp, 'In-App')} />
                    <span className="slider round"></span>
                </label>
            </div>
        </div>

        <div className="Achivements-preferences">
            <h3>Achievements</h3>
            <p>Get notified each time you reach to your milestones </p>
        </div>


        <div className="form-section">
                <h3>Quiet Hours</h3>
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

        <div className="button-row" style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                <button className="btn-spacing" onClick={handleCancel}>Cancel</button>
                <button className="btn-spacing" onClick={handleSave}>Save Changes</button>
        </div>

    </div>

    );
};

export default Notification;
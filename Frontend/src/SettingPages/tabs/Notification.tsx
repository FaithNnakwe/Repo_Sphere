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

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, name: string) => {
    setter(prev => {
      const newValue = !prev;
      toast.success(`${name} notifications ${newValue ? 'enabled' : 'disabled'}`);
      return newValue;
    });
  };
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
                <p>Set a time range during which you won't receive notifications.</p>
                <div className="quiet-hours mt-2">
                    <div className="time-picker">
                        <input type="time" defaultValue="22:00" />
                        <span> to </span>
                        <input type="time" defaultValue="08:00" />
                    </div>
                </div>
            </div>
        
        </div>

        <div className="intro-actions">
            <button className="btn-spacing">Cancel</button>
            <button className="btn-spacing">Save Changes</button>
        </div>
        


    </div>

    );
};

export default Notification;
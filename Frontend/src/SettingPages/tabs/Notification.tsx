export const Notification = () => {
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
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                </label>
            </div>

            <div className ="Delivery-row">
                <span>Comments</span>
                <label className ="Switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                </label>
            </div>

            <div className ="Delivery-row">
                <span>Code Reviews</span>
                <label className ="Switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                </label>
            </div>
           
            <div className ="Delivery-row">
                <span>Issues</span>
                <label className ="Switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                </label>
            </div>

            <div className ="Delivery-row">
                <span>Merge</span>
                <label className ="Switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                </label>
            </div>


            <div className ="Delivery-row">
                <span>Pull Requests</span>
                <label className ="Switch">
                    <input type="checkbox" defaultChecked />
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
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                </label>
            </div>

            <div className="Delivery-row">
                <span>In-App</span>
                <label className ="Switch">
                    <input type="checkbox" defaultChecked />
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
export const Account = () => {
    return (
        <div className="section-intro">
            <div className="intro-text">
                <h2>Personal info</h2>
                <p>Update your personal details here.</p>
            </div>
        
            {/* Personal Form Content: Personal Info */}
            <div className ="Personal-contents">
                <div className="form-row">
                    <label>Username</label>
                        <div className="Username-inputs">
                        <input type="text" placeholder="Enter your username" />
                    </div>
                </div>
            </div>

            {/* Personal Form Content: Bio */}
            <div className = "Personal-contents-bio">
                <div className="form-row">
                    <label>Bio</label>
                        <div className="Bio-inputs">
                        <textarea placeholder="Tell us about yourself"></textarea>
                    </div>
                </div>
            </div>

            {/* Personal Form Content: Role */}
            <div className = "Personal-contents-role">
                <div className="form-row">
                    <label>Role</label> 
                        <div className="Role-inputs">
                        <select>
                            <option value="">Select your role</option>
                            <option value="Developer">Developer</option>
                            <option value="Designer">Designer</option>
                            <option value="Manager">Manager</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Action Buttons: Save and cancel*/}
            <div className="intro-actions">
                <button className="btn-spacing">Cancel</button>
                <button className="btn-spacing">Save Changes</button>
            </div>
        </div>
    );
};

// Account
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export const Account = () => {
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [role, setRole] = useState('');
    const [originalData, setOriginalData] = useState({ username: '', bio: '', role: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Fetch user data - first try saved profile, then GitHub as fallback
        const fetchUserData = async () => {
            try {
                // First, try to get saved profile data
                const savedResponse = await fetch('http://localhost:5000/api/user/profile');
                let profileData = { username: '', bio: '', role: '' };
                
                if (savedResponse.ok) {
                    const savedData = await savedResponse.json();
                    if (savedData.username || savedData.bio) {
                        // We have saved data, use it
                        profileData = savedData;
                    } else {
                        // No saved data, fetch from GitHub
                        const githubResponse = await fetch('http://localhost:5000/api/github/user');
                        if (githubResponse.ok) {
                            const githubData = await githubResponse.json();
                            profileData = {
                                username: githubData.username || '',
                                bio: githubData.bio || '',
                                role: '' // GitHub doesn't provide role
                            };
                        }
                    }
                } else {
                    // Fallback to GitHub if profile endpoint fails
                    const githubResponse = await fetch('http://localhost:5000/api/github/user');
                    if (githubResponse.ok) {
                        const githubData = await githubResponse.json();
                        profileData = {
                            username: githubData.username || '',
                            bio: githubData.bio || '',
                            role: ''
                        };
                    }
                }
                
                setUsername(profileData.username);
                setBio(profileData.bio);
                setRole(profileData.role);
                
                // Store original data for cancel functionality
                setOriginalData({
                    username: profileData.username,
                    bio: profileData.bio,
                    role: profileData.role
                });
            } catch (error) {
                console.error('Error fetching user data:', error);
                toast.error('Error loading user data');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('http://localhost:5000/api/user/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    bio,
                    role
                })
            });

            if (response.ok) {
                await response.json();
                toast.success('Profile updated successfully!');
                
                // Update original data to current values
                setOriginalData({
                    username,
                    bio,
                    role
                });
            } else {
                toast.error('Failed to save profile');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Error saving profile');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset form to original values
        setUsername(originalData.username);
        setBio(originalData.bio);
        setRole(originalData.role);
        toast.info('Changes discarded');
    };

    if (loading) {
        return (
            <div className="section-intro">
                <div className="intro-text">
                    <h2>Personal info</h2>
                    <p>Loading your information...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="section-intro">
                <div className="intro-text">
                    <h2>Personal info</h2>
                    <p>Loading your information...</p>
                </div>
            </div>
        );
    }
    return (
        <div className="section-intro">
            <div className="intro-text">
                <h2>Personal info</h2>
                <p>Update your personal details here.</p>
            </div>
        
            {/* Personal Form Content: Personal Info */}
            <div className ="Personal-contents">
                <div className="form-row">
                    <h2>Username</h2>
                        <div className="Username-inputs">
                        <input 
                            type="text" 
                            style={{ width: '400px', height: '40px', padding: '8px' }} 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username" 
                        />
                    </div>
                </div>
            </div>

            {/* Personal Form Content: Bio */}
            <div className = "Personal-contents-bio">
                <div className="form-row">
                    <h2>Bio</h2>
                        <div className="Bio-inputs">
                        <textarea 
                            rows={10} 
                            cols={45} 
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself"
                        ></textarea>
                    </div>
                </div>
            </div>

            {/* Personal Form Content: Role */}
            <div className = "Personal-contents-role" style={{ marginBottom: '20px' }}>
                <div className="form-row">
                    <h2>Role</h2>
                        <div className="Role-inputs">
                        <select 
                            style={{ width: '200px', height: '40px', padding: '8px' }}
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
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
                <button 
                    className="btn-spacing" 
                    style={{ marginRight: '10px' }}
                    onClick={handleCancel}
                    disabled={saving}
                >
                    Cancel
                </button>
                <button 
                    className="btn-spacing"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

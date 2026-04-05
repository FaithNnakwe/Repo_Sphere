// Account
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { API_BASE } from "../../../api";

export const Account = () => {
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [role, setRole] = useState('');
    const [originalData, setOriginalData] = useState({ username: '', bio: '', role: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Fetch user data from GitHub first, then merge website-only fields like role.
        const fetchUserData = async () => {
            try {
                let websiteRole = '';
                const savedResponse = await fetch(`${API_BASE}/api/user/profile`);
                if (savedResponse.ok) {
                    const savedData = await savedResponse.json();
                    websiteRole = savedData.role || '';
                }

                const githubResponse = await fetch(`${API_BASE}/api/github/user`, {
                    credentials: 'include'
                });

                if (!githubResponse.ok) {
                    throw new Error('Failed to fetch authenticated GitHub user. Please log in again.');
                }

                const githubData = await githubResponse.json();
                const profileData = {
                    username: githubData.name || githubData.username || '',
                    bio: githubData.bio || '',
                    role: websiteRole
                };
                
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
            const githubResponse = await fetch(`${API_BASE}/api/github/profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: username,
                    bio,
                })
            });

            if (!githubResponse.ok) {
                const githubError = await githubResponse.json().catch(() => ({}));
                throw new Error(githubError.error || 'Failed to update GitHub profile');
            }

            const githubResult = await githubResponse.json();
            const syncedName = githubResult?.data?.name || username;
            const syncedBio = githubResult?.data?.bio || bio;

            const websiteResponse = await fetch(`${API_BASE}/api/user/profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: syncedName,
                    bio: syncedBio,
                    role
                })
            });

            if (!websiteResponse.ok) {
                throw new Error('GitHub updated, but failed to mirror changes to website profile');
            }

            setUsername(syncedName);
            setBio(syncedBio);
            setOriginalData({
                username: syncedName,
                bio: syncedBio,
                role
            });
            toast.success('Profile updated on GitHub and website successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error(error instanceof Error ? error.message : 'Error saving profile');
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
    return (
        <div className="section-intro">
            <div className="intro-text">
                <h2>Personal info</h2>
                <p>Update your personal details here.</p>
            </div>
        
            {/* Personal Form Content: Personal Info */}
            <div className ="Personal-contents">
                <div className="form-row">
                    <h2>Name</h2>
                    <p>Change your display name on GitHub. This will also update your profile on our website.</p>
                        <div className="Username-inputs">
                        <input 
                            type="text" 
                            value={username}
                            readOnly
                            placeholder="Enter your name" 
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
            <div className = "Personal-contents-role">
                <div className="form-row">
                    <h2>Role</h2>
                        <div className="Role-inputs">
                        <select 
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
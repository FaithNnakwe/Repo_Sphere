// const express = require('express');
// const cors = require('cors');
// const app = express();
// const port = 5000;
// app.use(cors()); // Enable CORS
// app.get('/api/message', (req, res) => {
//     res.json({ message: 'Hello from Node.js backend!' });
// });
// app.listen(port, () => {
//     console.log(`Server running on http://localhost:${port}`);
// });



const express = require('express');
const cors = require('cors');

// Import database connection
const { checkConnection } = require('../RepoSphere-app/db.js');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Test route
app.get('/api/message', (req, res) => {
    res.json({ message: 'Hello from Node.js backend!' });
});

// GitHub API route to get user info
app.get('/api/github/user', async (req, res) => {
    try {
        const { Octokit } = require('@octokit/rest');
        require('dotenv').config();

        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        const { data } = await octokit.rest.users.getAuthenticated();
        res.json({
            username: data.login,
            bio: data.bio || '',
            name: data.name || '',
            email: data.email || '',
            avatar_url: data.avatar_url
        });
    } catch (error) {
        console.error('GitHub API error:', error);
        res.status(500).json({ error: 'Failed to fetch GitHub user data' });
    }
});

// Save user profile data
app.post('/api/user/profile', (req, res) => {
    try {
        const { username, bio, role } = req.body;
        const fs = require('fs');
        const path = require('path');
        
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        
        // Save to JSON file
        const filePath = path.join(dataDir, 'user-profile.json');
        const profileData = { username, bio, role, updatedAt: new Date().toISOString() };
        
        fs.writeFileSync(filePath, JSON.stringify(profileData, null, 2));
        
        console.log('Profile saved to file:', profileData);
        
        res.json({ 
            success: true, 
            message: 'Profile updated successfully',
            data: profileData
        });
    } catch (error) {
        console.error('Error saving profile:', error);
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

// Get saved user profile data
app.get('/api/user/profile', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, 'data', 'user-profile.json');
        
        if (fs.existsSync(filePath)) {
            const profileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            res.json(profileData);
        } else {
            // Return default/empty profile if no saved data
            res.json({ username: '', bio: '', role: '' });
        }
    } catch (error) {
        console.error('Error reading profile:', error);
        res.json({ username: '', bio: '', role: '' });
    }
});

// Start server + connect DB
app.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}`);

    try {
        await checkConnection();
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed:", error);
    }
});
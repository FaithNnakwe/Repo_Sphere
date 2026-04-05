require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
// const { registerGitHubRoutes } = require('./GitHubService');
const { getDisplayName, setDisplayName } = require('./displayNameStore');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.get('/api/message', (req, res) => {
  res.json({ message: 'Hello from Node.js backend!' });
});

//registerGitHubRoutes(app);

app.get('/auth/github', (req, res) => {
  const state = crypto.randomUUID();
  res.cookie('oauth_state', state, { httpOnly: true, sameSite: 'lax' });

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: 'read:user repo',
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

app.get('/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;
  const savedState = req.cookies.oauth_state;

  if (!code || !state || state !== savedState) {
    return res.status(400).send('Invalid OAuth state.');
  }

  const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GITHUB_CALLBACK_URL,
    }),
  });

  const tokenData = await tokenResp.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    return res.status(401).send('OAuth failed.');
  }

  const userResp = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const user = await userResp.json();

  res.clearCookie('oauth_state');
  res.cookie('gh_user', user.login, { httpOnly: true, sameSite: 'lax' });
  res.cookie('gh_token', accessToken, { httpOnly: true, sameSite: 'lax' });

  res.redirect(`${process.env.FRONTEND_URL}/`);
});

app.get('/auth/me', (req, res) => {
  const ghUser = req.cookies.gh_user;
  if (!ghUser) return res.status(401).json({ loggedIn: false });
  const displayName = getDisplayName(ghUser);
  res.json({ loggedIn: true, ghUser, displayName });
});

app.post('/api/profile/display-name', (req, res) => {
  const ghUser = req.cookies.gh_user;
  if (!ghUser) {
    return res.status(401).json({
      error: 'Not authenticated. Please log in via GitHub.',
    });
  }

  const displayName = req.body?.displayName;
  const savedName = setDisplayName(ghUser, displayName);
  if (!savedName) {
    return res.status(400).json({
      error: 'Display name is required.',
    });
  }

  return res.json({
    ghUser,
    displayName: savedName,
  });
});

app.get('/auth/logout', (req, res) => {
  res.clearCookie('gh_user');
  res.clearCookie('gh_token');
  res.clearCookie('oauth_state');
  res.json({ message: 'Logged out successfully' });
});

// GitHub API route to get user info
app.get('/api/github/user', async (req, res) => {
    try {
        const { Octokit } = require('@octokit/rest');
        require('dotenv').config();

        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        // console.log('GitHub token:', process.env.GITHUB_TOKEN);

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

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  try {
    const dbModule = await import('./db.js');
    if (typeof dbModule.checkConnection === 'function') {
      await dbModule.checkConnection();
      console.log('Database connected');
    }
  } catch (err) {
    console.error('Database connection check skipped:', err?.message || err);
  }
});

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { registerGitHubRoutes } = require('./GitHubService');
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

registerGitHubRoutes(app);

app.get('/auth/github', (req, res) => {
  const state = crypto.randomUUID();
  res.cookie('oauth_state', state, { httpOnly: true, sameSite: 'lax' });

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: 'read:user user:email public_repo notifications',
    prompt: 'consent',
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
        const ghToken = req.cookies.gh_token;

        if (!ghToken) {
            return res.status(401).json({ error: 'Not authenticated. Please log in via GitHub.' });
        }

        const octokit = new Octokit({
            auth: ghToken
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

// Update GitHub user profile (name and bio)
app.post('/api/github/profile', async (req, res) => {
    try {
        const { Octokit } = require('@octokit/rest');
        const ghToken = req.cookies.gh_token;

        if (!ghToken) {
            return res.status(401).json({ error: 'Not authenticated. Please log in via GitHub.' });
        }

        const { name, bio } = req.body;

        if (!name && !bio) {
          return res.status(400).json({ error: 'Name or bio is required.' });
        }

        const octokit = new Octokit({ auth: ghToken });

        // Update authenticated GitHub user profile via PATCH /user
        const { data } = await octokit.request('PATCH /user', {
          name: name || undefined,
          bio: bio || undefined,
          headers: {
            'X-GitHub-Api-Version': '2026-03-10'
          }
        });

        res.json({
            success: true,
            message: 'GitHub profile updated successfully',
            data: {
                username: data.login,
                name: data.name || '',
                bio: data.bio || '',
                email: data.email || ''
            }
        });
    } catch (error) {
        console.error('Error updating GitHub profile:', error);
        const status = error?.status || 500;
        const detail = error?.response?.data?.message || error?.message || 'Failed to update GitHub profile';
        res.status(status).json({ error: detail });
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

// GET /api/github/notifications — fetch unread GitHub notifications filtered by user preferences
app.get('/api/github/notifications', async (req, res) => {
    try {
        const { Octokit } = require('@octokit/rest');
        const ghToken = req.cookies.gh_token;

        if (!ghToken) {
            return res.status(401).json({ error: 'Not authenticated. Please log in via GitHub.' });
        }

        const octokit = new Octokit({ auth: ghToken });

        const { data } = await octokit.request('GET /notifications', {
            all: false,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
            },
        });

        const { commits, comments, codeReviews, issues, merge, pullRequests } = req.query;

        // Map each user preference toggle to the corresponding GitHub notification subject type / reason
        const filtered = data.filter((n) => {
            const type = n.subject?.type;   // 'Issue' | 'PullRequest' | 'Commit' | 'Release' | 'Discussion' | 'CheckSuite'
            const reason = n.reason;         // 'comment' | 'pull_request_review' | 'review_requested' | 'ci_activity' | ...

            if (commits === 'true' && (type === 'Commit' || reason === 'ci_activity')) return true;
            if (comments === 'true' && (reason === 'comment' || reason === 'mention' || reason === 'team_mention')) return true;
            if (codeReviews === 'true' && (reason === 'pull_request_review' || reason === 'review_requested')) return true;
            if (issues === 'true' && type === 'Issue') return true;
            if (merge === 'true' && type === 'PullRequest' && reason === 'state_change') return true;
            if (pullRequests === 'true' && type === 'PullRequest') return true;
            return false;
        });

        res.json(filtered);
    } catch (error) {
        console.error('Error fetching GitHub notifications:', error);
        const status = error?.status || 500;
        res.status(status).json({ error: error?.message || 'Failed to fetch GitHub notifications' });
    }
});

// GET /api/notifications/settings — load saved notification preference settings for the authenticated user
app.get('/api/notifications/settings', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const ghUser = req.cookies.gh_user;

        if (!ghUser) return res.status(401).json({ error: 'Not authenticated.' });

        const filePath = path.join(__dirname, 'data', `notifications-${ghUser}.json`);
        if (fs.existsSync(filePath)) {
            res.json(JSON.parse(fs.readFileSync(filePath, 'utf8')));
        } else {
            res.json(null);
        }
    } catch (error) {
        console.error('Error loading notification settings:', error);
        res.status(500).json({ error: 'Failed to load notification settings' });
    }
});

// POST /api/notifications/settings — persist notification preference settings for the authenticated user
app.post('/api/notifications/settings', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const ghUser = req.cookies.gh_user;

        if (!ghUser) return res.status(401).json({ error: 'Not authenticated.' });

        const settings = req.body;
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

        const filePath = path.join(dataDir, `notifications-${ghUser}.json`);
        fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
        res.json(settings);
    } catch (error) {
        console.error('Error saving notification settings:', error);
        res.status(500).json({ error: 'Failed to save notification settings' });
    }
});

// ============================================
// METRICS API ENDPOINTS
// ============================================

const getOctokit = (req) => {
  const { Octokit } = require('@octokit/rest');
  const ghToken = req.cookies.gh_token;
  if (!ghToken) {
    throw new Error('Not authenticated');
  }
  return new Octokit({ auth: ghToken });
};


// GET /api/metrics/:owner/:repo/lines-of-code
app.get('/api/metrics/:owner/:repo/lines-of-code', async (req, res) => {
  try {
    const octokit = getOctokit(req);
    const { owner, repo } = req.params;
    
    // First, get the default branch
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo
    });
    
    const defaultBranch = repoData.default_branch;
    
    // Get the repository contents recursively using Git Trees API
    // This gets the entire repository structure
    const { data: commitData } = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: defaultBranch
    });
    
    // Get the tree recursively
    const { data: treeData } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: commitData.tree.sha,
      recursive: '1'
    });
    
    let totalLines = 0;
    let fileCount = 0;
    const processedFiles = [];
    
    // Process each file in the tree
    for (const item of treeData.tree) {
      // Skip directories, only process files
      if (item.type !== 'blob') continue;
      
      // Skip binary files and common non-code files
      const skipExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', 
                              '.pdf', '.zip', '.tar', '.gz', '.exe', '.dll',
                              '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3',
                              '.lock', '.log', '.min.js', '.min.css'];
      
      const skipFiles = ['package-lock.json', 'yarn.lock', 'Cargo.lock', 
                         'Gemfile.lock', 'poetry.lock', 'composer.lock'];
      
      const fileName = item.path.split('/').pop();
      const extension = '.' + fileName.split('.').pop();
      
      if (skipExtensions.includes(extension)) continue;
      if (skipFiles.includes(fileName)) continue;
      
      // Get file content to count lines
      try {
        const { data: fileData } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: item.path,
          ref: defaultBranch
        });
        
        // Check if file is text (not binary)
        if (fileData.content && fileData.encoding === 'base64') {
          const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
          const lines = content.split('\n').length;
          
          // Only count code files with reasonable line counts
          if (lines > 0 && lines < 50000) { // Skip huge files
            totalLines += lines;
            fileCount++;
            processedFiles.push({
              path: item.path,
              lines
            });
          }
        }
      } catch (err) {
        // Skip files that can't be accessed
        console.log(`Skipping ${item.path}: ${err.message}`);
      }
    }
    
    res.json({
      totalLines,
      fileCount,
      averageLinesPerFile: fileCount > 0 ? Math.round(totalLines / fileCount) : 0,
      repository: `${owner}/${repo}`,
      branch: defaultBranch,
      files: processedFiles.slice(0, 100) // Return first 100 files for debugging
    });
    
  } catch (error) {
    console.error('Error fetching lines of code:', error);
    
    // Fallback: Use a simpler approach with code frequency data
    try {
      const octokit = getOctokit(req);
      const { owner, repo } = req.params;
      
      // Get the last 100 commits to estimate lines of code
      const { data: commits } = await octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 100
      });
      
      let totalAdditions = 0;
      let commitCount = 0;
      
      for (const commit of commits) {
        try {
          const { data: commitData } = await octokit.rest.repos.getCommit({
            owner,
            repo,
            ref: commit.sha
          });
          
          totalAdditions += commitData.stats?.additions || 0;
          commitCount++;
        } catch (err) {
          console.error(`Error fetching commit ${commit.sha}:`, err);
        }
      }
      
      // Estimate total lines based on average additions per commit
      const estimatedLines = commitCount > 0 ? Math.round(totalAdditions / commitCount) * 10 : 0;
      
      res.json({
        totalLines: estimatedLines,
        fileCount: 0,
        averageLinesPerFile: 0,
        repository: `${owner}/${repo}`,
        branch: 'main',
        estimated: true,
        message: 'Estimated based on commit activity. For accurate count, repository may be too large.'
      });
      
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      res.status(500).json({ 
        error: 'Failed to fetch lines of code',
        totalLines: 0 
      });
    }
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



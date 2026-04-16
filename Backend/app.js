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
        
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        
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
            res.json({ username: '', bio: '', role: '' });
        }
    } catch (error) {
        console.error('Error reading profile:', error);
        res.json({ username: '', bio: '', role: '' });
    }
});

// GET /api/github/notifications
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

        const filtered = data.filter((n) => {
            const type = n.subject?.type;
            const reason = n.reason;

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

// GET /api/notifications/settings
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

// POST /api/notifications/settings
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

const getDateRange = (range) => {
  const now = new Date();
  let startDate;
  
  switch(range) {
    case '7d':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case '30d':
      startDate = new Date(now.setDate(now.getDate() - 30));
      break;
    case '90d':
      startDate = new Date(now.setDate(now.getDate() - 90));
      break;
    case '1y':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    case 'all':
    default:
      startDate = new Date(0);
  }
  
  return startDate;
};

// GET /api/metrics/:owner/:repo/commits/activity
app.get('/api/metrics/:owner/:repo/commits/activity', async (req, res) => {
  try {
    const octokit = getOctokit(req);
    const { owner, repo } = req.params;
    const { range = '30d' } = req.query;
    
    const startDate = getDateRange(range);
    
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 100,
      since: startDate.toISOString()
    });
    
    const commitMap = new Map();
    
    commits.forEach(commit => {
      const date = commit.commit.author.date.split('T')[0];
      if (!commitMap.has(date)) {
        commitMap.set(date, {
          date,
          count: 0,
          sha: [],
          messages: []
        });
      }
      
      const entry = commitMap.get(date);
      entry.count++;
      entry.sha.push(commit.sha);
      entry.messages.push(commit.commit.message.split('\n')[0]);
    });
    
    const result = Array.from(commitMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching commit activity:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch commit activity' });
  }
});

// GET /api/metrics/:owner/:repo/pulls/activity
app.get('/api/metrics/:owner/:repo/pulls/activity', async (req, res) => {
  try {
    const octokit = getOctokit(req);
    const { owner, repo } = req.params;
    const { range = '30d' } = req.query;
    
    const startDate = getDateRange(range);
    
    const { data: pulls } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'all',
      per_page: 100,
      sort: 'updated',
      direction: 'desc'
    });
    
    const filteredPulls = pulls.filter(pr => new Date(pr.created_at) >= startDate);
    
    const prMap = new Map();
    
    filteredPulls.forEach(pr => {
      const createdDate = pr.created_at.split('T')[0];
      const closedDate = pr.closed_at ? pr.closed_at.split('T')[0] : null;
      const mergedDate = pr.merged_at ? pr.merged_at.split('T')[0] : null;
      
      if (!prMap.has(createdDate)) {
        prMap.set(createdDate, {
          date: createdDate,
          opened: 0,
          closed: 0,
          merged: 0,
          titles: []
        });
      }
      
      const entry = prMap.get(createdDate);
      entry.opened++;
      entry.titles.push(pr.title);
      
      if (closedDate && closedDate !== createdDate) {
        if (!prMap.has(closedDate)) {
          prMap.set(closedDate, {
            date: closedDate,
            opened: 0,
            closed: 0,
            merged: 0,
            titles: []
          });
        }
        const closedEntry = prMap.get(closedDate);
        closedEntry.closed++;
        if (mergedDate) closedEntry.merged++;
      }
    });
    
    const result = Array.from(prMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching PR activity:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch PR activity' });
  }
});

// GET /api/metrics/:owner/:repo/issues/activity
app.get('/api/metrics/:owner/:repo/issues/activity', async (req, res) => {
  try {
    const octokit = getOctokit(req);
    const { owner, repo } = req.params;
    const { range = '30d' } = req.query;
    
    const startDate = getDateRange(range);
    
    const { data: issues } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: 'all',
      per_page: 100,
      sort: 'updated',
      direction: 'desc'
    });
    
    const filteredIssues = issues.filter(issue => 
      !issue.pull_request && new Date(issue.created_at) >= startDate
    );
    
    const issueMap = new Map();
    
    filteredIssues.forEach(issue => {
      const createdDate = issue.created_at.split('T')[0];
      const closedDate = issue.closed_at ? issue.closed_at.split('T')[0] : null;
      
      if (!issueMap.has(createdDate)) {
        issueMap.set(createdDate, {
          date: createdDate,
          opened: 0,
          closed: 0,
          titles: []
        });
      }
      
      const entry = issueMap.get(createdDate);
      entry.opened++;
      entry.titles.push(issue.title);
      
      if (closedDate && closedDate !== createdDate) {
        if (!issueMap.has(closedDate)) {
          issueMap.set(closedDate, {
            date: closedDate,
            opened: 0,
            closed: 0,
            titles: []
          });
        }
        const closedEntry = issueMap.get(closedDate);
        closedEntry.closed++;
      }
    });
    
    const result = Array.from(issueMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching issue activity:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch issue activity' });
  }
});

// GET /api/metrics/:owner/:repo/code-frequency
app.get('/api/metrics/:owner/:repo/code-frequency', async (req, res) => {
  try {
    const octokit = getOctokit(req);
    const { owner, repo } = req.params;
    const { range = '30d' } = req.query;
    
    const startDate = getDateRange(range);
    
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 100,
      since: startDate.toISOString()
    });
    
    const codeChanges = [];
    
    for (const commit of commits) {
      try {
        const { data: commitData } = await octokit.rest.repos.getCommit({
          owner,
          repo,
          ref: commit.sha
        });
        
        const date = commit.commit.author.date.split('T')[0];
        const additions = commitData.stats?.additions || 0;
        const deletions = commitData.stats?.deletions || 0;
        
        codeChanges.push({
          date,
          additions,
          deletions,
          net: additions - deletions
        });
      } catch (err) {
        console.error(`Error fetching commit ${commit.sha}:`, err);
      }
    }
    
    const freqMap = new Map();
    codeChanges.forEach(change => {
      if (!freqMap.has(change.date)) {
        freqMap.set(change.date, {
          date: change.date,
          additions: 0,
          deletions: 0,
          net: 0
        });
      }
      
      const entry = freqMap.get(change.date);
      entry.additions += change.additions;
      entry.deletions += change.deletions;
      entry.net += change.net;
    });
    
    const result = Array.from(freqMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching code frequency:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch code frequency' });
  }
});

// GET /api/metrics/:owner/:repo/contributors
app.get('/api/metrics/:owner/:repo/contributors', async (req, res) => {
  try {
    const octokit = getOctokit(req);
    const { owner, repo } = req.params;
    
    const { data: contributors } = await octokit.rest.repos.listContributors({
      owner,
      repo,
      anon: false,
      per_page: 50
    });
    
    const contributorDetails = await Promise.all(
      contributors.map(async (contributor) => {
        try {
          const { data: userData } = await octokit.rest.users.getByUsername({
            username: contributor.login
          });
          
          return {
            login: contributor.login,
            name: userData.name || contributor.login,
            avatar: userData.avatar_url,
            commits: contributor.contributions,
            additions: 0,
            deletions: 0,
            pullRequests: 0,
            issues: 0
          };
        } catch (err) {
          return {
            login: contributor.login,
            name: contributor.login,
            avatar: `https://github.com/${contributor.login}.png`,
            commits: contributor.contributions,
            additions: 0,
            deletions: 0,
            pullRequests: 0,
            issues: 0
          };
        }
      })
    );
    
    res.json(contributorDetails);
  } catch (error) {
    console.error('Error fetching contributors:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch contributors' });
  }
});

// GET /api/metrics/:owner/:repo/weekly-commits - FIXED to include daily data
app.get('/api/metrics/:owner/:repo/weekly-commits', async (req, res) => {
  try {
    const octokit = getOctokit(req);
    const { owner, repo } = req.params;
    
    // Fetch commits from the last 52 weeks
    const since = new Date();
    since.setDate(since.getDate() - 365);
    
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 100,
      since: since.toISOString()
    });
    
    // Group commits by week and day
    const weeklyMap = new Map();
    
    commits.forEach(commit => {
      const date = new Date(commit.commit.author.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.getTime();
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          week: Math.floor(weekStart.getTime() / 1000),
          total: 0,
          days: [0, 0, 0, 0, 0, 0, 0] // Sun, Mon, Tue, Wed, Thu, Fri, Sat
        });
      }
      
      const weekData = weeklyMap.get(weekKey);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      weekData.days[dayOfWeek]++;
      weekData.total++;
    });
    
    // Convert to array and sort by week
    const result = Array.from(weeklyMap.values())
      .sort((a, b) => a.week - b.week);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching weekly commits:', error);
    res.json([]);
  }
});

// GET /api/metrics/:owner/:repo/daily-activity
app.get('/api/metrics/:owner/:repo/daily-activity', async (req, res) => {
  try {
    const octokit = getOctokit(req);
    const { owner, repo } = req.params;
    
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 500,
      since: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    const activityMap = new Map();
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    commits.forEach(commit => {
      const date = new Date(commit.commit.author.date);
      const day = daysOfWeek[date.getDay()];
      const hour = date.getHours();
      const key = `${day}-${hour}`;
      
      activityMap.set(key, (activityMap.get(key) || 0) + 1);
    });
    
    const result = Array.from(activityMap.entries()).map(([key, count]) => {
      const [day, hour] = key.split('-');
      return {
        day,
        hour: parseInt(hour),
        count
      };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching daily activity:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch daily activity' });
  }
});

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

// SINGLE app.listen - REMOVED THE DUPLICATE
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
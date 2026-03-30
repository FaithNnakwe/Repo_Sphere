// RepoSphere GitHub API service module

const { Octokit } = require('@octokit/rest');

const githubToken = (process.env.GITHUB_TOKEN || '').trim();
const octokit = new Octokit({
  auth: githubToken || undefined,
});

const registerGitHubRoutes = (app) => {
  app.get('/api/repos', async (req, res) => {
    if (!githubToken) {
      return res.status(401).json({
        error: 'GITHUB_TOKEN is missing on backend environment',
      });
    }

    try {
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 10,
      });

      res.json(
        data.map((repo) => ({
          name: repo.name,
          url: repo.html_url,
          description: repo.description,
        }))
      );
    } catch (error) {
      const statusCode = error?.status || 500;
      res.status(statusCode).json({
        error: error?.message || 'Failed to fetch repositories from GitHub',
      });
    }
  });

  app.get('/api/repos/:owner/:repo/commits', async (req, res) => {
    const { owner, repo } = req.params;

    if (!githubToken) {
      return res.status(401).json({
        error: 'GITHUB_TOKEN is missing on backend environment',
      });
    }

    try {
      const { data } = await octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 5,
      });

      res.json(
        data.map((commit) => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author?.name || 'Unknown',
        }))
      );
    } catch (error) {
      const statusCode = error?.status || 500;
      res.status(statusCode).json({
        error: error?.message || 'Failed to fetch commits from GitHub',
      });
    }
  });

  app.get('/api/repos/:owner/:repo/pulls', async (req, res) => {
    const { owner, repo } = req.params;

    if (!githubToken) {
      return res.status(401).json({
        error: 'GITHUB_TOKEN is missing on backend environment',
      });
    }

    try {
      const { data } = await octokit.rest.pulls.list({
        owner,
        repo,
        state: 'open',
      });

      res.json(
        data.map((pr) => ({
          id: pr.id,
          title: pr.title,
          user: pr.user.login,
        }))
      );
    } catch (error) {
      const statusCode = error?.status || 500;
      res.status(statusCode).json({
        error: error?.message || 'Failed to fetch pull requests from GitHub',
      });
    }
  });

  app.get('/api/repos/:owner/:repo/languages', async (req, res) => {
    const { owner, repo } = req.params;

    if (!githubToken) {
      return res.status(401).json({
        error: 'GITHUB_TOKEN is missing on backend environment',
      });
    }

    try {
      const { data } = await octokit.rest.repos.listLanguages({
        owner,
        repo,
      });

      res.json(data);
    } catch (error) {
      const statusCode = error?.status || 500;
      res.status(statusCode).json({
        error: error?.message || 'Failed to fetch languages from GitHub',
      });
    }
  });
};

module.exports = {
  registerGitHubRoutes,
};
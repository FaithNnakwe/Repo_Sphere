// RepoSphere GitHub API service module 
// This module provides functions to interact with the GitHub API using Octokit.
require('dotenv').config();
const express = require('express');
const { Octokit } = require("@octokit/rest");

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Octokit with your GitHub Token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

app.use(express.json());

// --- ROUTES ---

// 1. Get all public/private repositories for the authenticated user
app.get('/api/repos', async (req, res) => {
  try {
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 10
    });
    res.json(data.map(repo => ({
      name: repo.name,
      url: repo.html_url,
      description: repo.description
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get commits for a specific repo
app.get('/api/repos/:owner/:repo/commits', async (req, res) => {
  const { owner, repo } = req.params;
  try {
    const { data } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 5
    });
    res.json(data.map(c => ({
      sha: c.sha,
      message: c.commit.message,
      author: c.commit.author.name
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get pull requests for a specific repo
app.get('/api/repos/:owner/:repo/pulls', async (req, res) => {
  const { owner, repo } = req.params;
  try {
    const { data } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'open'
    });
    res.json(data.map(pr => ({
      id: pr.id,
      title: pr.title,
      user: pr.user.login
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
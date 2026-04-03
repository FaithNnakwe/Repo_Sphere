// RepoSphere GitHub API service module

const { Octokit } = require('@octokit/rest');
const { getDisplayNameMap } = require('./displayNameStore');

const registerGitHubRoutes = (app) => {
  const getOctokit = (req) => {
    const token = req.cookies.gh_token;
    if (!token) {
      return null;
    }
    return new Octokit({ auth: token });
  };

  const buildTeamContributionMap = ({
    owner,
    collaborators = [],
    contributors = [],
    pulls = [],
    issues = [],
    githubProfiles = {},
    repoSphereDisplayNames = {},
  }) => {
    const contributionMap = new Map();

    const ensureMember = (login) => {
      if (!login) {
        return null;
      }

      const normalizedLogin = login.toLowerCase();

      if (!contributionMap.has(normalizedLogin)) {
        const profile = githubProfiles[normalizedLogin] || {};
        const repoSphereDisplayName = repoSphereDisplayNames[normalizedLogin] || null;
        const githubDisplayName = profile.name || null;

        contributionMap.set(normalizedLogin, {
          login,
          displayName: repoSphereDisplayName || githubDisplayName || login,
          githubDisplayName,
          commits: 0,
          pullRequests: 0,
          issues: 0,
        });
      }

      return contributionMap.get(normalizedLogin);
    };

    ensureMember(owner);

    collaborators.forEach((collaborator) => {
      ensureMember(collaborator?.login);
    });

    contributors.forEach((contributor) => {
      const member = ensureMember(contributor?.login);
      if (member) {
        member.commits = contributor?.contributions || 0;
      }
    });

    pulls.forEach((pull) => {
      const member = ensureMember(pull?.user?.login);
      if (member) {
        member.pullRequests += 1;
      }
    });

    issues
      .filter((issue) => !issue?.pull_request)
      .forEach((issue) => {
        const member = ensureMember(issue?.user?.login);
        if (member) {
          member.issues += 1;
        }
      });

    const members = Array.from(contributionMap.values()).sort((a, b) => {
      if (b.commits !== a.commits) {
        return b.commits - a.commits;
      }
      if (b.pullRequests !== a.pullRequests) {
        return b.pullRequests - a.pullRequests;
      }
      return b.issues - a.issues;
    });

    return {
      members,
      totals: {
        commits: members.reduce((sum, member) => sum + member.commits, 0),
        pullRequests: members.reduce((sum, member) => sum + member.pullRequests, 0),
        issues: members.reduce((sum, member) => sum + member.issues, 0),
      },
    };
  };

  app.get('/api/repos', async (req, res) => {
    const octokit = getOctokit(req);
    if (!octokit) {
      return res.status(401).json({
        error: 'Not authenticated. Please log in via GitHub.',
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
    const octokit = getOctokit(req);
    if (!octokit) {
      return res.status(401).json({
        error: 'Not authenticated. Please log in via GitHub.',
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
    const octokit = getOctokit(req);
    if (!octokit) {
      return res.status(401).json({
        error: 'Not authenticated. Please log in via GitHub.',
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
    const octokit = getOctokit(req);
    if (!octokit) {
      return res.status(401).json({
        error: 'Not authenticated. Please log in via GitHub.',
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

  app.get('/api/repos/:owner/:repo/team-contributions', async (req, res) => {
    const { owner, repo } = req.params;
    const octokit = getOctokit(req);
    if (!octokit) {
      return res.status(401).json({
        error: 'Not authenticated. Please log in via GitHub.',
      });
    }

    try {
      const [contributors, pulls, issues] = await Promise.all([
        octokit.paginate(octokit.rest.repos.listContributors, {
          owner,
          repo,
          per_page: 100,
        }),
        octokit.paginate(octokit.rest.pulls.list, {
          owner,
          repo,
          state: 'all',
          per_page: 100,
        }),
        octokit.paginate(octokit.rest.issues.listForRepo, {
          owner,
          repo,
          state: 'all',
          per_page: 100,
        }),
      ]);

      let collaborators = [];
      try {
        collaborators = await octokit.paginate(octokit.rest.repos.listCollaborators, {
          owner,
          repo,
          per_page: 100,
        });
      } catch {
        collaborators = [];
      }

      const loginSet = new Set([owner]);
      collaborators.forEach((member) => {
        if (member?.login) {
          loginSet.add(member.login);
        }
      });
      contributors.forEach((member) => {
        if (member?.login) {
          loginSet.add(member.login);
        }
      });
      pulls.forEach((pull) => {
        if (pull?.user?.login) {
          loginSet.add(pull.user.login);
        }
      });
      issues.forEach((issue) => {
        if (issue?.user?.login) {
          loginSet.add(issue.user.login);
        }
      });

      const githubProfiles = {};
      await Promise.all(
        Array.from(loginSet).map(async (login) => {
          try {
            const { data } = await octokit.rest.users.getByUsername({ username: login });
            githubProfiles[login.toLowerCase()] = {
              name: data?.name || null,
            };
          } catch {
            githubProfiles[login.toLowerCase()] = {
              name: null,
            };
          }
        })
      );

      const repoSphereDisplayNames = getDisplayNameMap();

      const payload = buildTeamContributionMap({
        owner,
        collaborators,
        contributors,
        pulls,
        issues,
        githubProfiles,
        repoSphereDisplayNames,
      });
      res.json(payload);
    } catch (error) {
      const statusCode = error?.status || 500;
      res.status(statusCode).json({
        error: error?.message || 'Failed to fetch team contributions from GitHub',
      });
    }
  });
};

module.exports = {
  registerGitHubRoutes,
};

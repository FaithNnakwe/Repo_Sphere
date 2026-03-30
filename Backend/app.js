const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;

// The middle ware
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// This is the helper that requires log in
function requireAuth(req, res, next) {
  const token = req.cookies.gh_token;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  next();
}

// This is the helper, github fetch
async function githubFetch(url, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "RepoSphere-App",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "GitHub request failed");
  }

  return data;
}

// The root route
app.get("/", (req, res) => {
  res.json({ message: "RepoSphere backend is running" });
});

// Start up Github OAuth
app.get("/auth/github", (req, res) => {
  if (!GITHUB_CLIENT_ID || !GITHUB_CALLBACK_URL) {
    return res.status(500).json({
      error: "Missing the GitHub OAuth environment variables",
    });
  }

  const state = crypto.randomBytes(16).toString("hex");

  res.cookie("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // make sure its true in production with HTTPS
  });

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope: "read:user user:email repo",
    state,
  });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  res.redirect(githubAuthUrl);
});

// GitHub OAuth callback
app.get("/auth/github/callback", async (req, res) => {
  const { code, state } = req.query;
  const savedState = req.cookies.oauth_state;

  if (!code || !state || state !== savedState) {
    return res.status(400).json({ error: "Invalid OAuth state or code" });
  }

  try {
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: GITHUB_CALLBACK_URL,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.status(400).json({
        error: "Failed to get access token",
        details: tokenData,
      });
    }

    const accessToken = tokenData.access_token;

    const user = await githubFetch("https://api.github.com/user", accessToken);

    res.clearCookie("oauth_state");

    res.cookie("gh_user", user.login, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    res.cookie("gh_token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, 
    });

    res.redirect(FRONTEND_URL);
  } catch (error) {
    console.error("GitHub OAuth callback error:", error.message);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// Check for the login state
app.get("/auth/me", (req, res) => {
  const ghUser = req.cookies.gh_user;
  const ghToken = req.cookies.gh_token;

  if (!ghUser || !ghToken) {
    return res.json({
      loggedIn: false,
      ghUser: null,
    });
  }

  res.json({
    loggedIn: true,
    ghUser,
  });
});

// Making sure you can Logout
app.post("/auth/logout", (req, res) => {
  res.clearCookie("gh_user");
  res.clearCookie("gh_token");
  res.clearCookie("oauth_state");

  res.json({ message: "Logged out successfully" });
});

// The gitHub profile
app.get("/github/profile", requireAuth, async (req, res) => {
  try {
    const token = req.cookies.gh_token;
    const profile = await githubFetch("https://api.github.com/user", token);
    res.json(profile);
  } catch (error) {
    console.error("Profile fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch GitHub profile" });
  }
});

// The GitHub repos
app.get("/github/repos", requireAuth, async (req, res) => {
  try {
    const token = req.cookies.gh_token;
    const repos = await githubFetch(
      "https://api.github.com/user/repos?sort=updated&per_page=100",
      token
    );
    res.json(repos);
  } catch (error) {
    console.error("Repos fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});

// The GitHub recent activity
app.get("/github/activity", requireAuth, async (req, res) => {
  try {
    const token = req.cookies.gh_token;
    const events = await githubFetch(
      "https://api.github.com/user/events?per_page=30",
      token
    );
    res.json(events);
  } catch (error) {
    console.error("Activity fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

// A super simple dashboard summary
app.get("/github/summary", requireAuth, async (req, res) => {
  try {
    const token = req.cookies.gh_token;

    const [profile, repos, events] = await Promise.all([
      githubFetch("https://api.github.com/user", token),
      githubFetch("https://api.github.com/user/repos?per_page=100", token),
      githubFetch("https://api.github.com/user/events?per_page=30", token),
    ]);

    const totalStars = repos.reduce(
      (sum, repo) => sum + (repo.stargazers_count || 0),
      0
    );

    const totalForks = repos.reduce(
      (sum, repo) => sum + (repo.forks_count || 0),
      0
    );

    const languages = {};
    repos.forEach((repo) => {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    });

    const topLanguages = Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    res.json({
      profile: {
        login: profile.login,
        name: profile.name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        followers: profile.followers,
        following: profile.following,
        public_repos: profile.public_repos,
      },
      stats: {
        totalRepos: repos.length,
        totalStars,
        totalForks,
        recentEvents: events.length,
      },
      topLanguages,
      recentRepos: repos.slice(0, 5),
      recentActivity: events.slice(0, 10),
    });
  } catch (error) {
    console.error("Summary fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
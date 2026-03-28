require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");

// ✅ Import database connection
const { checkConnection } = require("./db.js");

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

/* ------------------- TEST ROUTE ------------------- */
app.get("/api/message", (req, res) => {
  res.json({ message: "Hello from Node.js backend!" });
});

/* ------------------- AUTH ROUTES ------------------- */

// Redirect to GitHub
app.get("/auth/github", (req, res) => {
  const state = crypto.randomUUID();
  res.cookie("oauth_state", state, { httpOnly: true, sameSite: "lax" });

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: "read:user repo",
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// OAuth callback
app.get("/auth/github/callback", async (req, res) => {
  const { code, state } = req.query;
  const savedState = req.cookies.oauth_state;

  if (!code || !state || state !== savedState) {
    return res.status(400).send("Invalid OAuth state.");
  }

  const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
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
    return res.status(401).send("OAuth failed.");
  }

  // Fetch GitHub user
  const userResp = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const user = await userResp.json();

  res.clearCookie("oauth_state");
  res.cookie("gh_user", user.login, { httpOnly: true, sameSite: "lax" });

  res.redirect(`${process.env.FRONTEND_URL}/`);
});

// Check login
app.get("/auth/me", (req, res) => {
  const ghUser = req.cookies.gh_user;
  if (!ghUser) return res.status(401).json({ loggedIn: false });
  res.json({ loggedIn: true, ghUser });
});

/* ------------------- START SERVER ------------------- */
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // ✅ Check DB connection when server starts
  try {
    await checkConnection();
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
});
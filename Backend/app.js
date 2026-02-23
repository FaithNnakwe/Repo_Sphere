
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL, 
    //cookies
    credentials: true,              
  })
);
app.use(cookieParser());
app.use(express.json());

// route
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

/* Redirect to Github */
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

/* Oauth, step 2*/
app.get("/auth/github/callback", async (req, res) => {
  const { code, state } = req.query;
  const savedState = req.cookies.oauth_state;

  if (!code || !state || state !== savedState) {
    return res.status(400).send("Invalid OAuth state.");
  }

  // The access tokan
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
    return res.status(401).send("OAuth failed. No access token returned.");
  }

  // Fetching the github user
  const userResp = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const user = await userResp.json();

  // Cookie log in
  res.clearCookie("oauth_state");
  res.cookie("gh_user", user.login, { httpOnly: true, sameSite: "lax" });

  // User to frontend
  res.redirect(`${process.env.FRONTEND_URL}/`);
});

/*Frontend calling */
app.get("/auth/me", (req, res) => {
  const ghUser = req.cookies.gh_user;
  if (!ghUser) return res.status(401).json({ loggedIn: false });
  res.json({ loggedIn: true, ghUser });
});
console.log("✅ About to call app.listen on PORT:", PORT);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
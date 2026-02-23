import "./login.css";

const LoginPage = () => {
  const handleGitHubLogin = () => {
    window.location.href = "http://localhost:3000/auth/github";
  };

  return (
    <div className="github-login-container">
      <div className="github-login-box">
        <img
          src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
          alt="GitHub Logo"
          className="github-logo"
        />
        <h1>Sign in to Reposphere</h1>

        <button
          className="github-login-button"
          onClick={handleGitHubLogin}
        >
          Sign in with GitHub
        </button>

        <p className="signup-text">
          By signing in, you allow Reposphere to read your repositories and metrics.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
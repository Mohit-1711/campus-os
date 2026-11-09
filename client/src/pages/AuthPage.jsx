import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";

export default function AuthPage() {
  const { login, signup } = useAuth();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      if (isSignup) {
        await signup({ name, email, password });
        setMode("login");
        setPassword("");
        setNotice("Account created successfully. You can now log in.");
      } else {
        await login({ email, password });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
  }

  return (
    <main className="auth-page">
      <section className="auth-card card">
        <div className="auth-brand">
          <img src="/favicon.svg" alt="" width="52" height="52" />
          <h1>Campus OS</h1>
          <p>Your college life, organized.</p>
        </div>

        <div className="auth-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={!isSignup} className={!isSignup ? "active" : ""} onClick={() => switchMode("login")}>
            Log in
          </button>
          <button type="button" role="tab" aria-selected={isSignup} className={isSignup ? "active" : ""} onClick={() => switchMode("signup")}>
            Sign up
          </button>
        </div>

        <div className="auth-heading">
          <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>
          <p>{isSignup ? "Get started with your Campus OS account." : "Log in to continue to your dashboard."}</p>
        </div>

        {notice && <p className="alert alert--success" role="status">{notice}</p>}
        {error && <p className="alert alert--error" role="alert">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup && (
            <label className="field">
              <span className="field__label">Full name</span>
              <input className="input" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} placeholder="Enter your name" />
            </label>
          )}

          <label className="field">
            <span className="field__label">Email address</span>
            <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input
              className="input"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isSignup ? 6 : undefined}
              maxLength={72}
              placeholder={isSignup ? "At least 6 characters" : "Enter your password"}
            />
          </label>

          <button className="btn btn--primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Please wait..." : isSignup ? "Create account" : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "New to Campus OS?"}{" "}
          <button type="button" onClick={() => switchMode(isSignup ? "login" : "signup")}>
            {isSignup ? "Log in" : "Create an account"}
          </button>
        </p>
      </section>
    </main>
  );
}

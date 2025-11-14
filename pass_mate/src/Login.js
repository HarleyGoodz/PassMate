import React, { useState } from "react";
import "./login_styles.css";
import qrLogo from "./assets/logo.png"; // replace with your QR logo file

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Logging in with", email, password);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src={qrLogo} alt="QR Logo" className="login-logo" />

        <h2 className="login-title">
          Event <span>CIT</span>
        </h2>
        <p className="login-sub">Skip the line, scan your way in.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <span className="icon">📧</span>
            <input
              type="text"
              placeholder="Type your email or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <span className="icon">🔒</span>
            <input
              type="password"
              placeholder="Type your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <a href="#" className="forgot-link">Forgot Password?</a>

          <button type="submit" className="login-btn">Log In</button>
        </form>

        <p className="signup-text">
          Don’t have an account? <a href="#" className="signup-link">Sign Up here</a>
        </p>
      </div>
    </div>
  );
}
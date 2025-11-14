import React, { useState } from "react";
import "./login_styles.css";
import qrLogo from "./assets/logo.png"; 
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Logging in with", email, password);
  };

  return (
    <div className="page-container">
      <div className="form-box">
        {/* Logo & Branding */}
        <div className="logo-section">
          <img src={qrLogo} alt="QR Logo" className="qr-logo" />
          <h2 className="brand-name">
            Event <span className="brand-cit">CIT</span>
          </h2>
          <p className="tagline">Skip the line, scan your way in.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <span className="input-icon">📧</span>
            <input
              type="text"
              placeholder="Type your email or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              
            />
          </div>

          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              placeholder="Type your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
             
            />
          </div>

          <div className="forgot-password-link">
            <a href="#" className="forgot-link">Forgot Password?</a>
          </div>

          <a href="/home" className="btn-login">
            Log In
        </a>
        </form>

        {/* Register / Signup Link */}
        <div className="register-link">
          <p>
            Don’t have an account? <Link to="/signup" className="register-here-link">Sign Up here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

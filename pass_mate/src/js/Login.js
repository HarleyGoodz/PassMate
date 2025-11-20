import React, { useState } from "react";
import "../css/login_styles.css";
import qrLogo from "../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [messages, setMessages] = useState([]); // show login success/error

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:8080/api/user/login", {
        emailAddress: email,
        password: password,
      });

      if (response.data === "Success") {
  setMessages([{ type: "success", text: "Login successful!" }]);
  setTimeout(() => navigate("/home"), 400);
} else {
  setMessages([{ type: "error", text: response.data }]);
}
    } catch (error) {
      setMessages([{ type: "error", text: "Login failed. Server error." }]);
    }
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

        {/* Alerts */}
        {messages.map((m, index) => (
          <div key={index} className={`alert ${m.type}`}>
            {m.text}
          </div>
        ))}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">

          <div className="input-group">
            <span className="input-icon">📧</span>
            <input
              type="text"
              placeholder="Type your email or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              placeholder="Type your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* REAL LOGIN BUTTON */}
          <button className="btn-login" type="submit">
            Log In
          </button>
        </form>

        {/* Register / Signup Link */}
        <div className="register-link">
          <p>
            Don’t have an account?{" "}
            <Link to="/signup" className="register-here-link">
              Sign Up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Login.jsx
import React, { useState } from "react";
import "../css/login_styles.css";
import qrLogo from "../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessages([]);

    try {
      // 1️⃣ LOGIN → server sets JSESSIONID cookie
      const resp = await fetch("http://localhost:8080/api/user/login", {
        method: "POST",
        credentials: "include", // VERY IMPORTANT
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailAddress: email, password }),
      });

      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch (_) { data = text; }

      if (!resp.ok) {
        setMessages([{ type: "error", text: typeof data === "string" ? data : "Login failed" }]);
        setLoading(false);
        return;
      }

      // If login endpoint already returns user object
      if (data && typeof data === "object" && data.userId) {
        localStorage.setItem("userFullname", data.fullname || "");
        localStorage.setItem("userId", String(data.userId));
        localStorage.setItem("userEmail", data.emailAddress || "");
        navigate("/home");
        return;
      }

      // 2️⃣ Fetch user from session using /me
      const who = await fetch("http://localhost:8080/api/user/me", {
        credentials: "include",
      });

      if (!who.ok) {
        setMessages([{ type: "error", text: "Login succeeded but cannot fetch session user." }]);
        setLoading(false);
        return;
      }

      const user = await who.json();

      // Save UI data (not required for security)
      localStorage.setItem("userFullname", user.fullname || "");
      localStorage.setItem("userId", String(user.userId));
      localStorage.setItem("userEmail", user.emailAddress || "");

      setMessages([{ type: "success", text: "Login successful!" }]);
      navigate("/home");

    } catch (err) {
      console.error("Login error:", err);
      setMessages([{ type: "error", text: "Server error. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="form-box">
        <div className="logo-section">
          <img src={qrLogo} alt="QR Logo" className="qr-logo" />
          <h2 className="brand-name">
            Event <span className="brand-cit">CIT</span>
          </h2>
          <p className="tagline">Skip the line, scan your way in.</p>
        </div>

        {messages.map((m, index) => (
          <div key={index} className={`alert ${m.type}`}>
            {m.text}
          </div>
        ))}

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

          <button className="btn-login" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

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

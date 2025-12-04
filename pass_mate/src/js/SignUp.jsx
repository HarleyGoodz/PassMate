// SignUp.jsx
import React, { useState } from "react";
import "../css/SignUp.css";
import logo from "../assets/logo.png";
import backgroundImage from "../assets/event_background.png";

export default function SignUp() {
  const [form, setForm] = useState({
    username: "",
    gmail: "",
    password1: "",
    password2: "",
  });
  const [messages, setMessages] = useState([]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessages([]);

    if (form.password1 !== form.password2) {
      setMessages([{ type: "error", text: "Passwords do not match." }]);
      return;
    }

    try {
      const resp = await fetch("http://localhost:8080/api/user/add", {
        method: "POST",
        credentials: "include", // if server auto-logs-in after creation
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailAddress: form.gmail,
          fullname: form.username,
          password: form.password1,
          role: "user",
        }),
      });

      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch (_) { data = text; }

      if (!resp.ok) {
        setMessages([{ type: "error", text: typeof data === "string" ? data : "Registration failed." }]);
        return;
      }

      if (data && data.userId) {
        setMessages([{ type: "success", text: "Account created successfully!" }]);
        setForm({ username: "", gmail: "", password1: "", password2: "" });
      } else {
        setMessages([{ type: "error", text: "Registration failed." }]);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setMessages([{ type: "error", text: "Server error. Try again." }]);
    }
  };

  return (
    <div
      className="registration-container"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="registration-overlay"></div>

      <div className="form-box">
        <div className="logo-section">
          <img src={logo} alt="QR Code" className="qr-code-image" />
          <h1 className="brand-name">
            <span className="brand-event">Event</span>
            <span className="brand-cit"> CIT</span>
          </h1>
          <p className="tagline">Skip the line, scan your way in.</p>
        </div>

        {messages.map((m, i) => (
          <div key={i} className={`alert ${m.type}`}>
            {m.text}
          </div>
        ))}

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="input-field-group">
            <span className="input-icon">📧</span>
            <input
              type="text"
              name="username"
              placeholder="Type your email or username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-field-group">
            <span className="input-icon">📧</span>
            <input
              type="email"
              name="gmail"
              placeholder="Enter your Gmail account"
              value={form.gmail}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-field-group">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              name="password1"
              placeholder="Type your password"
              value={form.password1}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-field-group">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              name="password2"
              placeholder="Confirm your password"
              value={form.password2}
              onChange={handleChange}
              required
            />
          </div>

          <button className="btn-signup" type="submit">
            Sign Up
          </button>
        </form>

        <div className="login-link">
          <p>
            Have an account already?{" "}
            <a href="/login" className="register-here-link">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

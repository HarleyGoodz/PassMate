import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/AuthPage.css";
import logo from "../assets/logo.png";
import backgroundImage from "../assets/event_background.png";

export default function AuthPage({ mode = "login" }) {
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState(
    mode === "signup" ? "signup" : "login"
  );
  const isLogin = authMode === "login";

  const [messages, setMessages] = useState([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [form, setForm] = useState({
    username: "",
    gmail: "",
    password1: "",
    password2: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const switchMode = (target) => {
    if (target === authMode) return;
    setMessages([]);
    setAuthMode(target);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessages([]);

    if (isLogin) {
      if (!email || !password) {
        setMessages([{ type: "error", text: "Please fill in all fields." }]);
        return;
      }

      setMessages([{ type: "success", text: "Logging in..." }]);
      setTimeout(() => {
        navigate("/home");
      }, 400);
    } else {
      if (!form.username || !form.gmail || !form.password1 || !form.password2) {
        setMessages([{ type: "error", text: "Please fill in all fields." }]);
        return;
      }
      if (form.password1 !== form.password2) {
        setMessages([{ type: "error", text: "Passwords do not match." }]);
        return;
      }

      setMessages([
        { type: "success", text: "Account created✨" },
      ]);
    }
  };

  return (
    <div
      className="page-container"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="overlay" />

      <div
        className={`form-box ${
          authMode === "signup" ? "signup-mode" : "login-mode"
        }`}
      >
        {/* logo + brand */}
        <div className="logo-section">
          <img src={logo} alt="QR Logo" className="qr-logo" />
          <h2 className="brand-name">
            Pass <span className="brand-cit">Mate</span>
          </h2>
          <p className="tagline">Skip the line scan your way in.</p>
        </div>

        {/* alerts */}
        {messages.map((m, i) => (
          <div key={i} className={`alert ${m.type}`}>
            {m.text}
          </div>
        ))}

        {/* form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div key={authMode} className={`auth-form-inner ${authMode}`}>
            {isLogin ? (
              <>
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

                <button className="btn-main" type="submit">
                  Log In
                </button>
              </>
            ) : (
              <>
                <div className="input-group">
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

                <div className="input-group">
                  <span className="input-icon">@</span>
                  <input
                    type="email"
                    name="gmail"
                    placeholder="Enter your Gmail account"
                    value={form.gmail}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
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

                <div className="input-group">
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

                <button className="btn-main" type="submit">
                  Sign Up
                </button>
              </>
            )}
          </div>
        </form>

        {/* footer link – switches mode */}
        <div className="switch-link">
          {isLogin ? (
            <p>
              Don’t have an account?{" "}
              <button
                type="button"
                className="link-accent link-button"
                onClick={() => switchMode("signup")}
              >
                Sign up here
              </button>
            </p>
          ) : (
            <p>
              Have an account already?{" "}
              <button
                type="button"
                className="link-accent link-button"
                onClick={() => switchMode("login")}
              >
                Login here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

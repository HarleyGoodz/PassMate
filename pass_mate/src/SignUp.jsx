import React, { useState } from "react";
import axios from "axios"; // ✅ added axios
import "./SignUp.css";
import logo from "./assets/logo.png";
import backgroundImage from "./assets/event_background.png";

const SignUp = () => {
  const [form, setForm] = useState({
    username: "",
    gmail: "",
    password1: "",
    password2: "",
  });

  const [messages, setMessages] = useState([]); // mimic Django messages

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (form.password1 !== form.password2) {
    setMessages([{ type: "error", text: "Passwords do not match." }]);
    return;
  }

  try {
    const response = await axios.post("http://localhost:8080/api/user/add", {
      emailAddress: form.gmail,
      fullname: form.username,
      password: form.password1,
      role: "user",
    });

    // backend returns a user object → treat as success
    if (response.data && response.data.userId) {
      setMessages([{ type: "success", text: "Account created successfully!" }]);
    } else {
      setMessages([{ type: "error", text: "Registration failed." }]);
    }

  } catch (error) {
    console.error(error);
    setMessages([{ type: "error", text: "Registration failed. Server error." }]);
  }
};

  return (
    <div
      className="registration-container"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="registration-overlay"></div>

      <div className="form-box">
        {/* Logo Section */}
        <div className="logo-section">
          <img src={logo} alt="QR Code" className="qr-code-image" />

          <h1 className="brand-name">
            <span className="brand-event">Event</span>
            <span className="brand-cit"> CIT</span>
          </h1>

          <p className="tagline">Skip the line, scan your way in.</p>
        </div>

        {/* Alerts */}
        {messages.map((m, index) => (
          <div key={index} className={`alert ${m.type}`}>
            {m.text}
          </div>
        ))}

        {/* Sign Up Form */}
        <form className="register-form" onSubmit={handleSubmit}>
          {/* Email / Username */}
          <div className="input-field-group">
            <span className="input-icon">
              <i className="fas fa-envelope"></i>
            </span>
            <input
              type="text"
              name="username"
              placeholder="Type your email or username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          {/* Gmail Account */}
          <div className="input-field-group">
            <span className="input-icon">
              <i className="fas fa-at"></i>
            </span>
            <input
              type="email"
              name="gmail"
              placeholder="Enter your Gmail account"
              value={form.gmail}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div className="input-field-group">
            <span className="input-icon">
              <i className="fas fa-lock"></i>
            </span>
            <input
              type="password"
              name="password1"
              placeholder="Type your password"
              value={form.password1}
              onChange={handleChange}
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="input-field-group">
            <span className="input-icon">
              <i className="fas fa-lock"></i>
            </span>
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

        {/* Login Link */}
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
};

export default SignUp;

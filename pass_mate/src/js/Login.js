// Login.jsx
import React, { useState } from "react";
import "../css/login_styles.css";
import { Link, useNavigate } from "react-router-dom";

/* ---------- Decorative data for the animated brand panel (UI only) ---------- */
function buildQrCells(size = 21, seed = 11) {
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const inFinder = (x, y) =>
    [[0, 0], [size - 7, 0], [0, size - 7]].some(([fx, fy]) => x >= fx - 1 && x <= fx + 7 && y >= fy - 1 && y <= fy + 7);
  const cells = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!inFinder(x, y) && rand() > 0.52) cells.push({ x, y });
    }
  }
  return cells;
}
const QR_CELLS = buildQrCells();
const QR_FINDERS = [[0, 0], [14, 0], [0, 14]];
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  x: (i * 37 + 7) % 100,
  delay: ((i * 1.3) % 9).toFixed(1),
  dur: 9 + (i % 5) * 1.8,
  size: 5 + (i % 4) * 3,
}));

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // UI only: show/hide password

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
    <div className="auth-page">
      {/* Animated scene fills the whole page (no images, pure CSS/SVG) */}
      <div className="auth-bg" aria-hidden="true">
        <span className="auth-blob auth-blob-1" />
        <span className="auth-blob auth-blob-2" />
        <span className="auth-blob auth-blob-3" />
        <span className="auth-grid" />
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="auth-particle"
            style={{ "--x": `${p.x}%`, "--d": `${p.delay}s`, "--t": `${p.dur}s`, "--s": `${p.size}px` }}
          />
        ))}
      </div>

      <header className="auth-top">
      <div className="auth-brand">
        <span className="auth-logo" aria-hidden="true">
          <svg viewBox="0 0 32 32">
            <rect x="6" y="6" width="8" height="8" rx="1.5" />
            <rect x="18" y="6" width="8" height="8" rx="1.5" />
            <rect x="6" y="18" width="8" height="8" rx="1.5" />
            <path d="M18 18h3v3h-3zM23 23h3v3h-3zM23 18h3M18 23v3" />
          </svg>
        </span>
        <span className="auth-brand-name">
          Event <span className="auth-brand-accent">CIT</span>
        </span>
      </div>
      </header>

      <div className="auth-layout">
        {/* Left: headline + scanning-ticket animation, on the same scene */}
        <section className="auth-intro">
          <h1 className="auth-hero-title">
            <span className="auth-line" style={{ "--i": 0 }}>Skip the line,</span>
            <span className="auth-line auth-line-accent" style={{ "--i": 1 }}>scan your way in.</span>
          </h1>
          <p className="auth-hero-text">
            Find campus events, get your QR ticket, and check in with a single scan.
          </p>

          {/* Animated ticket: QR gets scanned, then checked in */}
          <div className="auth-scene" aria-hidden="true">
            <div className="auth-ticket">
              <div className="auth-ticket-top">
                <span className="auth-ticket-kicker">EVENT PASS</span>
                <span className="auth-ticket-chip">ADMIT 1</span>
              </div>
              <p className="auth-ticket-title">Campus Event</p>
              <p className="auth-ticket-sub">Show this code at the entrance</p>
              <div className="auth-ticket-cut" />
              <div className="auth-ticket-bottom">
                <div className="auth-qr">
                  <svg viewBox="0 0 21 21" shapeRendering="crispEdges">
                    {QR_FINDERS.map(([fx, fy]) => (
                      <g key={`${fx}-${fy}`}>
                        <rect x={fx} y={fy} width="7" height="7" className="auth-qr-dark" />
                        <rect x={fx + 1} y={fy + 1} width="5" height="5" className="auth-qr-light" />
                        <rect x={fx + 2} y={fy + 2} width="3" height="3" className="auth-qr-dark" />
                      </g>
                    ))}
                    {QR_CELLS.map((c) => (
                      <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="1.02" height="1.02" className="auth-qr-dark" />
                    ))}
                  </svg>
                  <span className="auth-qr-laser" />
                  <span className="auth-qr-corner auth-qr-corner-tl" />
                  <span className="auth-qr-corner auth-qr-corner-br" />
                </div>
                <div className="auth-ticket-status">
                  <span className="auth-status-label">Status</span>
                  <span className="auth-status-swap">
                    <span className="auth-status auth-status-wait">
                      <i className="auth-status-dot" /> Scanning…
                    </span>
                    <span className="auth-status auth-status-ok">
                      <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg> Checked in
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <span className="auth-float auth-float-1">
              <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              Events this week
            </span>
            <span className="auth-float auth-float-2">
              <svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
              One-scan entry
            </span>
          </div>

          <ul className="auth-features">
            <li style={{ "--i": 0 }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              Discover events
            </li>
            <li style={{ "--i": 1 }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM17 17h4v4h-4" /></svg>
              Instant QR tickets
            </li>
            <li style={{ "--i": 2 }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
              One-scan check-in
            </li>
          </ul>
        </section>

        {/* Right: the login form as a glass card on the scene */}
        <main className="auth-card">
          <header className="auth-card-header">
            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-subtitle">Log in to your Event CIT account.</p>
          </header>

          <div aria-live="polite">
            {messages.map((m, index) => (
              <div key={index} className={`auth-alert auth-alert-${m.type}`} role={m.type === "error" ? "alert" : "status"}>
                <span className="auth-alert-icon" aria-hidden="true">
                  {m.type === "error" ? (
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>
                  )}
                </span>
                <span>{m.text}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field" style={{ "--i": 0 }}>
              <label htmlFor="login-email" className="auth-label">Email or username</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                </span>
                <input
                  id="login-email"
                  className="auth-input"
                  type="text"
                  placeholder="you@cit.edu"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field" style={{ "--i": 1 }}>
              <label htmlFor="login-password" className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                </span>
                <input
                  id="login-password"
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18" /><path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-2.6 3.2M6.6 6.7C4.3 8.2 3 12 3 12s4 6 9 6a8.8 8.8 0 0 0 4.2-1.1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading && <span className="auth-spinner" aria-hidden="true" />}
              <span>{loading ? "Logging in..." : "Log in"}</span>
              {!loading && (
                <svg className="auth-submit-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              )}
            </button>
          </form>

          <div className="auth-divider"><span>New to Event CIT?</span></div>

          <Link to="/signup" className="auth-secondary">
            Create an account
          </Link>

          <p className="auth-footnote">Event CIT · Skip the line, scan your way in.</p>
        </main>
      </div>
    </div>
  );
} 
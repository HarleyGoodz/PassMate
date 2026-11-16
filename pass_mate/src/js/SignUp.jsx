// SignUp.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/login_styles.css"; // shared "auth-" styles (same look as the login page)
import "../css/SignUp.css";       // sign-up specific "su-" styles

/* ---------- Decorative data for the animated panel (UI only) ---------- */
function buildQrCells(size = 21, seed = 23) {
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
  x: (i * 41 + 13) % 100,
  delay: ((i * 1.1) % 9).toFixed(1),
  dur: 9 + (i % 5) * 1.8,
  size: 5 + (i % 4) * 3,
}));
const STEPS = [
  { title: "Create your account", text: "Sign up with your Gmail in seconds." },
  { title: "Pick an event", text: "Browse what's happening around campus." },
  { title: "Get your QR ticket", text: "Show it at the door and walk right in." },
];
const ROLES = [
  { value: "student", label: "Student", icon: <path d="M22 9 12 4 2 9l10 5 10-5zM6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" /> },
  { value: "teacher", label: "Teacher", icon: <path d="M3 5h18v11H3zM8 20h8M12 16v4M7 9h6M7 12h4" /> },
  { value: "employee", label: "Employee", icon: <path d="M4 8h16v12H4zM9 8V5h6v3M4 13h16" /> },
];

/* password strength (display only) */
function passwordStrength(pw) {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length < 6) score = Math.min(score, 1);
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[score] };
}

const EyeIcon = ({ open }) =>
  open ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18" /><path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-2.6 3.2M6.6 6.7C4.3 8.2 3 12 3 12s4 6 9 6a8.8 8.8 0 0 0 4.2-1.1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6z" /><circle cx="12" cy="12" r="3" /></svg>
  );

export default function SignUp() {
  const [form, setForm] = useState({
    username: "",
    gmail: "",
    password1: "",
    password2: "",
    role: "student", // default role added
  });
  const [messages, setMessages] = useState([]);
  const [showPw1, setShowPw1] = useState(false); // UI only
  const [showPw2, setShowPw2] = useState(false); // UI only

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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailAddress: form.gmail,
          fullname: form.username,
          password: form.password1,
          role: form.role, // send selected role to backend
        }),
      });

      const text = await resp.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (_) {
        data = text;
      }

      if (!resp.ok) {
        setMessages([
          {
            type: "error",
            text: typeof data === "string" ? data : "Registration failed.",
          },
        ]);
        return;
      }

      if (data && data.userId) {
        setMessages([
          { type: "success", text: "Account created successfully!" },
        ]);
        setForm({
          username: "",
          gmail: "",
          password1: "",
          password2: "",
          role: "student",
        });
      } else {
        setMessages([{ type: "error", text: "Registration failed." }]);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setMessages([{ type: "error", text: "Server error. Try again." }]);
    }
  };

  const strength = passwordStrength(form.password1);
  const confirmTouched = form.password2.length > 0;
  const passwordsMatch = confirmTouched && form.password1 === form.password2;

  return (
    <div className="auth-page su-page">
      {/* Animated scene fills the whole page (no images, pure CSS/SVG) */}
        <div className="auth-bg su-bg" aria-hidden="true">
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

      <header className="su-top">
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

      <div className="su-layout">
        {/* Left: headline + phone walkthrough, sitting on the same scene */}
        <section className="su-intro">
          <h1 className="auth-hero-title">
            <span className="auth-line" style={{ "--i": 0 }}>Join in seconds.</span>
            <span className="auth-line auth-line-accent" style={{ "--i": 1 }}>Get in with a scan.</span>
          </h1>
          <p className="auth-hero-text">
            Create your Event CIT account to discover campus events and keep every QR ticket in one place.
          </p>

          <div className="su-showcase">
            <div className="su-phone" aria-hidden="true">
              <div className="su-phone-screen">
                <div className="su-track">
                  {/* Screen 1: sign up */}
                  <div className="su-screen">
                    <p className="su-screen-title">Sign up</p>
                    <div className="su-avatar">
                      <svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
                    </div>
                    <div className="su-mini-field"><span className="su-typing su-typing-1" /></div>
                    <div className="su-mini-field"><span className="su-typing su-typing-2" /></div>
                    <div className="su-mini-field"><span className="su-dots">••••••••</span></div>
                    <div className="su-mini-btn">Create account</div>
                  </div>

                  {/* Screen 2: pick an event */}
                  <div className="su-screen">
                    <p className="su-screen-title">Events</p>
                    {["Tech Talk", "Org Fair", "Concert"].map((name, i) => (
                      <div key={name} className={`su-event ${i === 1 ? "su-event-pick" : ""}`}>
                        <span className="su-event-date"><b>{12 + i * 3}</b>NOV</span>
                        <span className="su-event-info">
                          <b>{name}</b>
                          <i />
                        </span>
                        {i === 1 && (
                          <span className="su-event-check">
                            <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Screen 3: QR ticket */}
                  <div className="su-screen">
                    <p className="su-screen-title">My ticket</p>
                    <div className="su-ticket">
                      <span className="su-ticket-name">Org Fair</span>
                      <span className="su-ticket-sub">Admit 1</span>
                      <div className="su-qr">
                        <svg viewBox="0 0 21 21" shapeRendering="crispEdges">
                          {QR_FINDERS.map(([fx, fy]) => (
                            <g key={`${fx}-${fy}`} className="su-qr-finder">
                              <rect x={fx} y={fy} width="7" height="7" className="su-qr-dark" />
                              <rect x={fx + 1} y={fy + 1} width="5" height="5" className="su-qr-light" />
                              <rect x={fx + 2} y={fy + 2} width="3" height="3" className="su-qr-dark" />
                            </g>
                          ))}
                          {QR_CELLS.map((c) => (
                            <rect
                              key={`${c.x}-${c.y}`}
                              x={c.x}
                              y={c.y}
                              width="1.02"
                              height="1.02"
                              className="su-qr-dark su-qr-cell"
                              style={{ "--d": `${(c.x + c.y) * 0.022}s` }}
                            />
                          ))}
                        </svg>
                      </div>
                      <span className="su-ready">
                        <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg> Ready to scan
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ol className="su-steps">
              {STEPS.map((s, i) => (
                <li key={s.title} className="su-step" style={{ "--i": i }}>
                  <span className="su-step-num">{i + 1}</span>
                  <span className="su-step-copy">
                    <b>{s.title}</b>
                    <span>{s.text}</span>
                  </span>
                  <span className="su-step-bar" aria-hidden="true" />
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Right: the registration form as a glass card on the scene */}
        <main className="su-card auth-card">
          <header className="auth-card-header">
            <h2 className="auth-title">Create your account</h2>
            <p className="auth-subtitle">It's free and takes less than a minute.</p>
          </header>

          <div aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`auth-alert auth-alert-${m.type}`} role={m.type === "error" ? "alert" : "status"}>
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

          <form className="auth-form su-form" onSubmit={handleSubmit}>
            <div className="auth-field" style={{ "--i": 0 }}>
              <label htmlFor="su-name" className="auth-label">Full name</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
                </span>
                <input
                  id="su-name"
                  className="auth-input"
                  type="text"
                  name="username"
                  placeholder="Juan Dela Cruz"
                  autoComplete="name"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="auth-field" style={{ "--i": 1 }}>
              <label htmlFor="su-email" className="auth-label">Gmail address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                </span>
                <input
                  id="su-email"
                  className="auth-input"
                  type="email"
                  name="gmail"
                  placeholder="you@gmail.com"
                  autoComplete="email"
                  value={form.gmail}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <fieldset className="auth-field su-roles" style={{ "--i": 2 }}>
              <legend className="auth-label">I am a</legend>
              <div className="su-role-grid">
                {ROLES.map((r) => (
                  <label key={r.value} className={`su-role ${form.role === r.value ? "su-role-on" : ""}`}>
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={form.role === r.value}
                      onChange={handleChange}
                      className="su-role-input"
                      required
                    />
                    <svg viewBox="0 0 24 24" aria-hidden="true">{r.icon}</svg>
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="auth-field" style={{ "--i": 3 }}>
              <label htmlFor="su-pw1" className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                </span>
                <input
                  id="su-pw1"
                  className="auth-input"
                  type={showPw1 ? "text" : "password"}
                  name="password1"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  value={form.password1}
                  onChange={handleChange}
                  aria-describedby="su-strength"
                  required
                />
                <button type="button" className="auth-toggle" onClick={() => setShowPw1((v) => !v)} aria-label={showPw1 ? "Hide password" : "Show password"} aria-pressed={showPw1}>
                  <EyeIcon open={showPw1} />
                </button>
              </div>
              <div className={`su-strength su-strength-${strength.score}`} id="su-strength">
                <span className="su-strength-bars" aria-hidden="true"><i /><i /><i /><i /></span>
                <span className="su-strength-label">
                  {form.password1 ? `Strength: ${strength.label}` : "Use 8+ characters with letters, numbers and a symbol."}
                </span>
              </div>
            </div>

            <div className="auth-field" style={{ "--i": 4 }}>
              <label htmlFor="su-pw2" className="auth-label">Confirm password</label>
              <div className={`auth-input-wrap ${confirmTouched ? (passwordsMatch ? "su-match" : "su-nomatch") : ""}`}>
                <span className="auth-input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></svg>
                </span>
                <input
                  id="su-pw2"
                  className="auth-input"
                  type={showPw2 ? "text" : "password"}
                  name="password2"
                  placeholder="Type it again"
                  autoComplete="new-password"
                  value={form.password2}
                  onChange={handleChange}
                  aria-describedby="su-match"
                  required
                />
                <button type="button" className="auth-toggle" onClick={() => setShowPw2((v) => !v)} aria-label={showPw2 ? "Hide password" : "Show password"} aria-pressed={showPw2}>
                  <EyeIcon open={showPw2} />
                </button>
              </div>
              <p id="su-match" className={`su-hint ${confirmTouched ? (passwordsMatch ? "su-hint-ok" : "su-hint-bad") : ""}`} aria-live="polite">
                {confirmTouched ? (passwordsMatch ? "Passwords match." : "Passwords don't match yet.") : " "}
              </p>
            </div>

            <button className="auth-submit" type="submit">
              <span>Create account</span>
              <svg className="auth-submit-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </form>

          <div className="auth-divider"><span>Already have an account?</span></div>

          <Link to="/login" className="auth-secondary">
            Log in
          </Link>

          <p className="auth-footnote">Event CIT · Skip the line, scan your way in.</p>
        </main>
      </div>
    </div>
  );
}
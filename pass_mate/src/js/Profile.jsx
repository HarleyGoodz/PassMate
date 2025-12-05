import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../css/profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8080/api/user/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          navigate("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUser(data);
          setFullname(data.fullname || "");
          setEmail(data.emailAddress || "");
          setRole(data.role || "");
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = async () => {
    await fetch("http://localhost:8080/api/user/logout", {
      method: "POST",
      credentials: "include",
    });
    navigate("/login");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const payload = {
      fullname,
      emailAddress: email,
      role,
    };

    try {
      const res = await fetch(
        `http://localhost:8080/api/user/update/${user.userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error(await res.text());

      const updated = await res.json();
      setUser(updated);
      setEditing(false);
    } catch {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (!user) return null;

  return (
    <div className="profile-page">

      {/* Back Button – FIXED placement */}
      <Link to="/home" className="eventlist-back">Back to home</Link>
      

      {/* MAIN WRAPPER */}
      <div className="profile-container">
        <h1 className="eventlist-title fade-in">Profile</h1>

        {/* PROFILE CARD */}
        <div className="profile-card fade-in">

          <div className="profile-header">
            <div className="profile-avatar">
              <span>👤</span>
            </div>
            <h2 className="profile-name">{user.fullname}</h2>
            <p className="profile-role-badge">{user.role}</p>
          </div>

          <div className="profile-info-box">
            {/* NAME */}
            <div className="profile-field">
              <label>Full Name</label>
              {!editing ? (
                <div className="profile-value">{fullname}</div>
              ) : (
                <input
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                />
              )}
            </div>

            {/* EMAIL */}
            <div className="profile-field">
              <label>Email Address</label>
              {!editing ? (
                <div className="profile-value">{email}</div>
              ) : (
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </div>

            {/* ROLE – visible always */}
            <div className="profile-field">
              <label>Role</label>
              {!editing ? (
                <div className="profile-value">{role}</div>
              ) : (
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              )}
            </div>

            {error && <div className="profile-error">⚠ {error}</div>}

            {/* BUTTONS */}
            <div className="profile-buttons">
              {!editing ? (
                <button onClick={() => setEditing(true)} className="profile-btn-primary">
                  Edit Profile
                </button>
              ) : (
                <>
                  <button onClick={handleSave} disabled={saving} className="profile-btn-primary">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setFullname(user.fullname);
                      setEmail(user.emailAddress);
                      setRole(user.role);
                    }}
                    className="profile-btn-secondary"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* WALLET BELOW CARD 👇 */}
        <div className="wallet-card fade-in delay-1">
          <div className="wallet-icon">💰</div>
          <h3 className="wallet-title">Wallet Balance</h3>
          <p className="wallet-amount">₱{Number(user.walletAmount).toFixed(2)}</p>
          <p className="wallet-sub">Available funds</p>
        </div>
      </div>
    </div>
  );
}

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

  // Delete-account confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

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

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);

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
    } catch (err) {
      console.error("Update failed:", err);
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // New: delete account (calls your Spring Boot DELETE endpoint)
  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`http://localhost:8080/api/user/delete/${user.userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        // try to read server message
        const text = await res.text();
        throw new Error(text || `Delete returned ${res.status}`);
      }

      // server returns a message on success — ignore and navigate to login
      // clear any local session data you keep
      try { localStorage.removeItem("userEmail"); localStorage.removeItem("userFullname"); localStorage.removeItem("userId"); } catch (e) {}
      navigate("/login");
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleteError("Failed to delete account. Try again later.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="profile-page">
      <Link to="/home" className="eventlist-back">← Back to home</Link>

      <div className="profile-container">
        <h1 className="title fade-in">Profile</h1>

        {/* PROFILE CARD */}
        <div className="profile-card fade-in">
          <div className="profile-header">
            <div className="profile-avatar">👤</div>
            <h2 className="profile-name">{user.fullname}</h2>
            <span className="profile-role-badge">{user.role}</span>
          </div>

          <div className="profile-info-box">
            {/* NAME */}
            <div className="profile-field">
              <label>Full Name</label>
              {!editing ? (
                <div className="profile-value">{fullname}</div>
              ) : (
                <input
                  type="text"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Enter your full name"
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
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              )}
            </div>

            {/* ROLE */}
            <div className="profile-field">
              <label>Role</label>
              {!editing ? (
                <div className="profile-value">{role}</div>
              ) : (
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Enter your role"
                />
              )}
            </div>

            {error && <div className="profile-error">⚠ {error}</div>}

            {/* BUTTONS */}
            <div className="profile-buttons">
              {!editing ? (
                <>
                  <button onClick={() => setEditing(true)} className="profile-btn-primary">
                    ✏ Edit Profile
                  </button>

                  {/* Replaced Logout with Delete-account trigger */}
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="profile-btn-danger"
                    title="Delete account"
                    aria-label="Delete account"
                  >
                    🗑 Delete Account
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleSave} disabled={saving} className="profile-btn-primary">
                    {saving ? "Saving..." : "✓ Save Changes"}
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
                    ✕ Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* WALLET CARD */}
        <div className="wallet-card fade-in">
          <div className="wallet-icon">💰</div>
          <h3 className="wallet-title">Wallet Balance</h3>
          <p className="wallet-amount">₱{Number(user.walletAmount).toFixed(2)}</p>
          <p className="wallet-sub">Available funds</p>
        </div>
      </div>

      {/* Inline confirmation modal for delete */}
      {showDeleteConfirm && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-modal">
            <h3>Delete account</h3>
            <p>Are you sure you want to permanently delete your account? This action cannot be undone.</p>

            {deleteError && <div className="profile-error">⚠ {deleteError}</div>}

            <div className="confirm-actions">
              <button
                className="confirm-cancel"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="confirm-delete"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Yes, delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

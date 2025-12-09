import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import "../css/buyTicket.css";

export default function BuyTicket({ qrImage: propQrImage = null, messages: propMessages = [] }) {
  const location = useLocation();
  const fromState = location.state || {};
  const qp = new URLSearchParams(location.search);

  const getParam = (key, fallback = "") =>
    fromState[key] ?? (qp.has(key) ? qp.get(key) : fallback);

  // GET PARAMS
  let userId = getParam("userId", "");
  let ticketId = getParam("ticketId", "");

  // handle numeric values from location.state
  if (!userId && fromState.userId) userId = fromState.userId;
  if (!ticketId && fromState.ticketId) ticketId = fromState.ticketId;

  // handle nested state structures
  if (!userId && fromState.user && fromState.user.userId) userId = fromState.user.userId;
  if (!ticketId && fromState.ticket && fromState.ticket.ticketId) ticketId = fromState.ticket.ticketId;

  const user = fromState.user ?? { email: qp.get("email") ?? "" };

  // REAL VALUES FROM BACKEND
  const [ticketPrice, setTicketPrice] = useState(null);
  const [remainingWallet, setRemainingWallet] = useState(null);

  // loading / error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // MESSAGE HANDLING
  const incomingMessages = Array.isArray(fromState.messages) ? fromState.messages : [];
  const initialMessages = propMessages.concat(incomingMessages);

  const [visibleMessages, setVisibleMessages] = useState(initialMessages);
  const [isExiting, setIsExiting] = useState(false);

  const displayMs = 2000;
  const exitAnimationMs = 600;

  useEffect(() => {
    if (!visibleMessages || visibleMessages.length === 0) return;

    const stayTimer = setTimeout(() => {
      setIsExiting(true);
      const removeTimer = setTimeout(() => {
        setVisibleMessages([]);
        setIsExiting(false);
      }, exitAnimationMs);

      return () => clearTimeout(removeTimer);
    }, displayMs);

    return () => clearTimeout(stayTimer);
  }, []); // run once on mount

  const dismissNow = () => {
    setIsExiting(true);
    setTimeout(() => {
      setVisibleMessages([]);
      setIsExiting(false);
    }, exitAnimationMs);
  };

  // FORMATTING CURRENCY
  const fmt = (v) => {
    const n = typeof v === "number" ? v : parseFloat(String(v || "0"));
    if (Number.isNaN(n)) return "₱0.00";
    return `₱${n.toFixed(2)}`;
  };

  // ▶️ CALL BACKEND WHEN PAGE LOADS
  useEffect(() => {
    // guard: we need both ids
    if (!userId || !ticketId) {
      console.warn("Missing userId or ticketId in BuyTicket page", { userId, ticketId });
      setError("Missing purchase information. If you were redirected here, try again from the event page.");
      return;
    }

    // if we already have results, don't call again
    if (ticketPrice !== null || remainingWallet !== null) return;

    let mounted = true;
    async function purchase() {
      setLoading(true);
      setError(null);

      try {
        const resp = await fetch(
          `http://localhost:8080/api/payment/purchase?userId=${encodeURIComponent(userId)}&ticketId=${encodeURIComponent(ticketId)}`,
          {
            method: "POST",
            credentials: "include"
          }
        );

        if (!resp.ok) {
          // try to parse body for a helpful message
          let bodyText = "";
          try {
            const potential = await resp.json();
            bodyText = potential?.message || JSON.stringify(potential);
          } catch {
            bodyText = await resp.text().catch(() => "");
          }
          throw new Error(`Server returned ${resp.status}${bodyText ? `: ${bodyText}` : ""}`);
        }

        const data = await resp.json();

        console.log("BACKEND RESULT =", data);

        if (!mounted) return;

        // Set values if present; tolerate different keys
        setTicketPrice(data.ticketPrice ?? data.ticket_price ?? null);
        setRemainingWallet(data.remainingWallet ?? data.remaining_wallet ?? data.remaining ?? null);
        setLoading(false);
      } catch (err) {
        console.error("Purchase error:", err);
        if (!mounted) return;
        setError(err.message || "Purchase failed");
        setLoading(false);
      }
    }

    purchase();

    return () => {
      mounted = false;
    };
  }, [userId, ticketId, ticketPrice, remainingWallet]);

  // DEBUG logs (remove in production)
  console.log("DEBUG → userId:", userId);
  console.log("DEBUG → ticketId:", ticketId);
  console.log("DEBUG → location.state:", fromState);
  console.log("DEBUG → qp:", Object.fromEntries(qp.entries()));

  return (
    <div className="buyticket-page">

      <div className="buyticket-card fade-in">

        <h1 className="buyticket-title">Ticket Purchase Successful!</h1>

        <p className="lead-text">
          Your payment was successful. Here is your transaction summary:
        </p>

        {/* show loader / error */}
        {loading && <div className="loading">Loading transaction details…</div>}
        {error && (
          <div className="error-box">
            <strong>Error:</strong> {error}
            <div style={{ marginTop: 8 }}>
              <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
            </div>
          </div>
        )}

        {/* PRICE / BALANCE BOX */}
        <div className="summary-box">
          <div className="row">
            <strong>Ticket Price:</strong>
            <span>
              {ticketPrice !== null ? fmt(ticketPrice) : (loading ? "Loading..." : "—")}
            </span>
          </div>

          <div className="row balance">
            <strong>Remaining Wallet Balance:</strong>
            <span className="green">
              {remainingWallet !== null ? fmt(remainingWallet) : (loading ? "Loading..." : "—")}
            </span>
          </div>
        </div>

        {/* EMAIL SENT INFO */}
        <div className="info-box">
          Your ticket details have been sent to your email!
          <br />
          {user?.email ? <span>Sent to: <strong>{user.email}</strong></span> : null}
        </div>

        {/* NOTE */}
        <div className="note-box">
          <strong>Note:</strong> Please check your inbox or spam folder for details.
        </div>

        {/* BUTTON */}
        <div className="center-btn">
          <Link to="/home" className="home-btn">Back To Home</Link>
        </div>

      </div>
    </div>
  );
}

BuyTicket.propTypes = {
  qrImage: PropTypes.string,
  messages: PropTypes.array,
};

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import "./buyTicket.css";

export default function BuyTicket({ qrImage: propQrImage = null, messages: propMessages = [] }) {
  const location = useLocation();
  const fromState = location.state || {};
  const qp = new URLSearchParams(location.search);

  const getParam = (key, fallback = "") =>
    fromState[key] ?? (qp.has(key) ? qp.get(key) : fallback);

  const rawPrice = getParam("price", "0");
  const rawBalance = getParam("balance", "0");
  const rawTxSuccess = getParam("transaction_success", getParam("transactionSuccess", "true"));
  const transaction_success = String(rawTxSuccess).toLowerCase() === "true";

  const user = fromState.user ?? { email: qp.get("email") ?? "" };

  const incomingMessages = Array.isArray(fromState.messages) ? fromState.messages : [];
  const initialMessages = propMessages.concat(incomingMessages);

  const [visibleMessages, setVisibleMessages] = useState(initialMessages);
  const [isExiting, setIsExiting] = useState(false);

  const displayMs = 3000;
  const exitAnimationMs = 700;

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
  }, [/* run when mounted or when visibleMessages initial value set */]);

  const dismissNow = () => {
    setIsExiting(true);
    setTimeout(() => {
      setVisibleMessages([]);
      setIsExiting(false);
    }, exitAnimationMs);
  };

  const fmt = (v) => {
    const n = typeof v === "number" ? v : parseFloat(String(v || "0"));
    if (Number.isNaN(n)) return "₱0.00";
    return `₱${n.toFixed(2)}`;
  };

  return (
    <div>
      {visibleMessages && visibleMessages.length > 0 && (
        <div className="messages">
          {visibleMessages.map((m, i) => (
            <div
              key={i}
              role="status"
              aria-live="polite"
              className={`message auto-banner ${isExiting ? "auto-exit" : "auto-enter"} ${m.type || m.tags || ""}`}
              onClick={dismissNow}
              style={{ cursor: "pointer" }}
            >
              {m.text || m}
            </div>
          ))}
        </div>
      )}

      <div className="back-btn-container fade-in-btn">
        <Link to="/home" className="back-btn">← Back to Home</Link>
      </div>

      <div className="qr-container">
        <h1>🎉 Ticket Purchase Successful!</h1>

        {transaction_success ? (
          <>
            <p className="lead-note smaller">
              Your <strong>simulated payment intent</strong> was successful. Here is your transaction summary:
            </p>

            <div className="transaction-summary">
              <p>
                <strong>Ticket Price:</strong>
                <span style={{ float: "right" }}>
                  <strong>{fmt(rawPrice)}</strong>
                </span>
              </p>

              <div className="new-balance">
                <p>
                  <strong>Remaining Wallet Balance:</strong>
                  <span style={{ float: "right" }}>
                    <strong>{fmt(rawBalance)}</strong>
                  </span>
                </p>
              </div>
            </div>

            <p className="message">
              Your unique QR code and ticket details have been sent to your email ({user.email || "—"}).
            </p>
          </>
        ) : (
          <p className="message">
            Your ticket has been successfully availed, and your unique QR code has been sent to your email.
          </p>
        )}

        <div className="info-box">
          <p><strong>Note:</strong> Please check your inbox (or spam folder) for the email containing your QR code.</p>
        </div>

        <div className="button-container">
          <Link to="/home" className="buy-btn">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

BuyTicket.propTypes = {
  qrImage: PropTypes.string,
  messages: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        text: PropTypes.string,
        type: PropTypes.string,
        tags: PropTypes.string,
      }),
    ])
  ),
};

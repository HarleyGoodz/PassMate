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

  const rawPrice = getParam("price", "0");
  const rawBalance = getParam("balance", "0");
  const rawTxSuccess = getParam("transaction_success", getParam("transactionSuccess", "true"));
  const transaction_success = String(rawTxSuccess).toLowerCase() === "true";

  const user = fromState.user ?? { email: qp.get("email") ?? "" };

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
  }, []);

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
    <div className="buyticket-page">

      <div className="buyticket-card fade-in">

        <h1 className="buyticket-title">Ticket Purchase Successful!</h1>

        <p className="lead-text">
          Your simulated payment was successful. Here is your transaction summary:
        </p>

        {/* PRICE / BALANCE BOX */}
        <div className="summary-box">
          <div className="row">
            <strong>Ticket Price:</strong>
            <span>{fmt(rawPrice)}</span>
          </div>

          <div className="row balance">
            <strong>Remaining Wallet Balance:</strong>
            <span className="green">{fmt(rawBalance)}</span>
          </div>
        </div>

        {/* EMAIL SENT INFO */}
        <div className="info-box">
          Your unique QR code and ticket details have been sent to your email:
          <br />
          <strong>{user.email || "N/A"}</strong>
        </div>

        {/* NOTE */}
        <div className="note-box">
          <strong>Note:</strong> Please check your inbox or spam folder for your QR code email.
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

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

  // 🔥 FIX #1: handle numeric values from location.state
  if (!userId && fromState.userId) userId = fromState.userId;
  if (!ticketId && fromState.ticketId) ticketId = fromState.ticketId;

  // 🔥 FIX #2: handle nested state structures (most common React cause)
  if (!userId && fromState.user && fromState.user.userId) userId = fromState.user.userId;
  if (!ticketId && fromState.ticket && fromState.ticket.ticketId) ticketId = fromState.ticket.ticketId;

  const user = fromState.user ?? { email: qp.get("email") ?? "" };

  // REAL VALUES FROM BACKEND
  const [ticketPrice, setTicketPrice] = useState(null);
  const [remainingWallet, setRemainingWallet] = useState(null);

  // MESSAGE HANDLING (unchanged)
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

  // FORMATTING CURRENCY
  const fmt = (v) => {
    const n = typeof v === "number" ? v : parseFloat(String(v || "0"));
    if (Number.isNaN(n)) return "₱0.00";
    return `₱${n.toFixed(2)}`;
  };

  // ▶️ CALL BACKEND WHEN PAGE LOADS
  useEffect(() => {
    if (!userId || !ticketId) {
      console.log("❌ Missing userId or ticketId", { userId, ticketId });
      return;
    }

    async function purchase() {

      try {
        const resp = await fetch(
          `http://localhost:8080/api/payment/purchase?userId=${userId}&ticketId=${ticketId}`,
          { method: "POST" }
        );

        const data = await resp.json();

        // 🔥 DEBUG LOG (REQUIRED)
        console.log("BACKEND RESULT =", data);

        // SET REAL VALUES
        setTicketPrice(data.ticketPrice);
        setRemainingWallet(data.remainingWallet);
      } catch (err) {
        console.error("Purchase error:", err);
      }
    }

    purchase();
  }, [userId, ticketId]);

  console.log("DEBUG → userId:", userId);
  console.log("DEBUG → ticketId:", ticketId);
  console.log("DEBUG → location.state:", fromState);
  console.log("DEBUG → qp:", Object.fromEntries(qp.entries()));

  return (
    <div className="buyticket-page">

      <div className="buyticket-card fade-in">

        <h1 className="buyticket-title">Ticket Purchase Successful!</h1>

        {/* EMAIL SENT INFO */}
        <div className="info-box">
          Your ticket details have been sent to your email!
          <br />
          
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
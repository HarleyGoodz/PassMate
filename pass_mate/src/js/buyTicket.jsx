// BuyTicket.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import "../css/buyTicket.css";

// Helper: Determine event status
const getEventStatus = (date, timeIn, timeOut) => {
  if (!date || !timeIn || !timeOut) return "AVAILABLE";

  try {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const start = new Date(`${date}T${timeIn}:00`);
    const end = new Date(`${date}T${timeOut}:00`);

    if (now > end) return "FINISHED";
    if (now >= start && now <= end) return "STARTING";
  } catch {}

  return "AVAILABLE";
};

export default function BuyTicket({ qrImage: propQrImage = null, messages: propMessages = [] }) {
  const location = useLocation();
  const navigate = useNavigate();

  const fromState = location.state || {};
  const qp = new URLSearchParams(location.search);

  const getParam = (key) => fromState[key] ?? qp.get(key) ?? "";

  let userId = getParam("userId");
  let ticketId = getParam("ticketId");

  const event_date = fromState.event_date;
  const event_time_in = fromState.event_time_in;
  const event_time_out = fromState.event_time_out;

  const status = getEventStatus(event_date, event_time_in, event_time_out);

  const [ticketPrice, setTicketPrice] = useState(null);
  const [remainingWallet, setRemainingWallet] = useState(null);

  const initialMessages = propMessages.concat(fromState.messages || []);
  const [visibleMessages, setVisibleMessages] = useState(initialMessages);

  // BLOCK PURCHASE WHEN EVENT IS HAPPENING OR FINISHED
  useEffect(() => {
    if (status !== "AVAILABLE") {

      setVisibleMessages([
        {
          text:
            status === "STARTING"
              ? "This event is currently happening. You cannot buy this ticket."
              : "This event has already ended. Ticket purchase is disabled.",
          type: "error",
        },
      ]);

      const timer = setTimeout(() => navigate("/home"), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Proceed with purchase when event is available
  useEffect(() => {
    if (!userId || !ticketId || status !== "AVAILABLE") return;

    async function purchase() {
      try {
        const resp = await fetch(
          `http://localhost:8080/api/payment/purchase?userId=${userId}&ticketId=${ticketId}`,
          { method: "POST" }
        );

        const data = await resp.json();

        setTicketPrice(data.ticketPrice);
        setRemainingWallet(data.remainingWallet);
      } catch (err) {
        console.error("Purchase error:", err);
      }
    }

    purchase();
  }, [userId, ticketId, status]);

  return (
    <div className="buyticket-page">
      <div className="buyticket-card fade-in">
        <h1 className="buyticket-title">
          {status !== "AVAILABLE" ? "Purchase Blocked" : "Ticket Purchase Successful!"}
        </h1>

        <div className="info-box">
          {status === "STARTING" && "This event is currently happening. Purchase is disabled."}
          {status === "FINISHED" && "This event has already ended. Purchase is disabled."}
          {status === "AVAILABLE" && "Your ticket details have been sent to your email!"}
        </div>

        <div className="note-box">
          {status === "AVAILABLE"
            ? "Please check your inbox or spam folder for details."
            : "Redirecting you back home…"}
        </div>

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

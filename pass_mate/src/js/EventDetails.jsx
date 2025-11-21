import React, { useState } from "react";
import "../css/eventDetails.css";
import { Link } from "react-router-dom";

export default function EventDetails({ event, soldOut, userHasTicket }) {
  const [messages, setMessages] = useState([]);

  return (
    <div className="event-page">

      {/* Back */}
      <Link to="/home" className="back-btn">Back to home </Link>

      {/* CARD WRAPPER WITH GRADIENT */}
      <div className="event-detail-card fade-in">

        <h1 className="details-title">Event Details</h1>

        {/* INFO BOXES */}
        <div className="details-list">
          <div className="detail-item"><strong>Venue:</strong> {event.event_venue}</div>
          <div className="detail-item"><strong>Date:</strong> {event.event_date}</div>
          <div className="detail-item">
            <strong>Time:</strong> {event.event_time_in} – {event.event_time_out}
          </div>
          <div className="detail-item"><strong>Category:</strong> {event.event_category}</div>
          <div className="detail-item"><strong>Ticket Price:</strong> ₱{event.ticket_price}</div>
          <div className="detail-item"><strong>Ticket Limit:</strong> {event.ticket_limit}</div>

          <div className="description-box">
            {event.event_description}
          </div>
        </div>

        {/* BUTTON */}
        <div className="buy-btn-container">
          {soldOut ? (
            <button className="buy-btn disabled">SOLD OUT</button>
          ) : userHasTicket ? (
            <button className="buy-btn disabled">Ticket Owned</button>
          ) : (
            <Link to={`/event/${event.id}/buy`} className="buy-btn">
              BUY TICKET NOW
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}

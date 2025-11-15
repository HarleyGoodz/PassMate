import React, { useState } from "react";
import "./eventDetails.css"; // your CSS file
import { Link } from "react-router-dom";

export default function EventDetails({ event, soldOut, userHasTicket }) {
  // Messages state (like Django messages)
  const [messages, setMessages] = useState([
    // Example: { text: "Ticket purchased!", type: "success" }
  ]);

  return (
    <div className="event-page">

      {/* Messages */}
      {messages.length > 0 && (
        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {/* Event Details */}
      <div className="event-detail-container fade-in">
        <h1>{event.event_name}</h1>

        <div className="event-info">
          <div className="info-box"><strong>📍 Venue:</strong> {event.event_venue}</div>
          <div className="info-box"><strong>📅 Date:</strong> {new Date(event.event_date).toLocaleDateString()}</div>
          <div className="info-box">
            <strong>🕒 Time:</strong> {event.event_time_in} - {event.event_time_out}
          </div>
          <div className="info-box"><strong>💵 Ticket Price:</strong> ₱{event.ticket_price}</div>
          <div className="info-box"><strong>🎟️ Ticket Limit:</strong> {event.ticket_limit}</div>
        </div>

        <div className="event-description">
          <p>{event.event_description}</p>
        </div>

        <div className="button-container">
          {soldOut ? (
            <button className="buy-btn disabled" disabled>🎟️ Sold Out</button>
          ) : userHasTicket ? (
            <button className="buy-btn disabled" disabled>✅ Ticket Owned</button>
          ) : (
            <Link to={`/event/${event.id}/buy`} className="buy-btn">🎟️ Buy Ticket Now!</Link>
          )}
        </div>
      </div>

      {/* Back Button */}
      <div className="back-btn-container fade-in">
        <Link to="/home" className="back-btn">⬅ Back to Events</Link>
      </div>
    </div>
  );
}

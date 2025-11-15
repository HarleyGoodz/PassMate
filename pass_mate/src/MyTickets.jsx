import React, { useState } from "react";
import "./myTickets_styles.css";
import { Link } from "react-router-dom";

export default function MyTickets({ ticketsData }) {
  // messages state
  const [messages, setMessages] = useState([
    // Example: { text: "Ticket deleted!", type: "success" }
  ]);

  // tickets state
  const [tickets, setTickets] = useState(ticketsData || []);

  // handle delete/refund
  const handleDelete = (ticketId) => {
    setTickets(tickets.filter((t) => t.id !== ticketId));
    setMessages([...messages, { text: "Ticket deleted and refunded!", type: "success" }]);
  };

  return (
    <div className="ticket-page">
      {/* Header */}
      <div className="header">
        <h1>🎟️ My Tickets</h1>
        <Link to="/home" className="back-btn">⬅ Back to Home</Link>
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`alert ${msg.type}`}>
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {/* Tickets Grid */}
      {tickets.length > 0 ? (
        <div className="ticket-grid">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="ticket-card">
              <h3>{ticket.event.event_name}</h3>
              <p><strong>Venue:</strong> {ticket.event.event_venue}</p>
              <p><strong>Date:</strong> {new Date(ticket.event.event_date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {ticket.event.event_time_in} - {ticket.event.event_time_out}</p>
              <p><strong>Price:</strong> ₱{ticket.event.ticket_price}</p>
              
              <button
                className="delete-btn"
                onClick={() => handleDelete(ticket.id)}
              >
                Delete & Refund
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-tickets">You don’t own any tickets yet.</p>
      )}
    </div>
  );
}

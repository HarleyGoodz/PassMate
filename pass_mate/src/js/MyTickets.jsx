import React, { useState } from "react";
import "../css/myTickets_styles.css";
import { Link } from "react-router-dom";

export default function MyTickets({ ticketsData }) {
  const [messages, setMessages] = useState([]);
  const [tickets, setTickets] = useState(ticketsData || []);

  const handleDelete = (ticketId) => {
    setTickets(tickets.filter((t) => t.id !== ticketId));
    setMessages([
      ...messages,
      { text: "Ticket deleted and refunded!", type: "success" },
    ]);
  };

  return (
    <div className="ticket-page">
      {/* Header */}
      <div className="tickets-header">
        <Link to="/home" className="btn-back-home">Back to home</Link>
        <h1 className="tickets-title">My Tickets</h1>
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

      {/* Tickets Section */}
      <div className="tickets-container">
        {tickets.length > 0 ? (
          <div className="tickets-grid">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="ticket-card-new">
                <h3 className="ticket-event">{ticket.event.event_name}</h3>

                <p><strong>Venue:</strong> {ticket.event.event_venue}</p>
                <p><strong>Date:</strong> {new Date(ticket.event.event_date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {ticket.event.event_time_in} – {ticket.event.event_time_out}</p>
                <p><strong>Price:</strong> ₱{ticket.event.ticket_price}</p>

                <button
                  className="btn-delete-refund"
                  onClick={() => handleDelete(ticket.id)}
                >
                  Delete and Refund
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-tickets">You don’t own any tickets yet.</p>
        )}
      </div>
    </div>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import "./eventList.css";

export default function EventList({ events = [] }) {
  return (
    <div className="event-list-page">

      {/* 🔙 Back Button */}
      <div className="eventlist-back-btn-container">
        <Link to="/home" className="eventlist-back-btn">← Back</Link>
      </div>

      <div className="eventlist-container">

        {/* Header */}
        <header className="eventlist-header">
          <h1 className="fade-in" style={{ animationDelay: "0.2s" }}>
            Upcoming Events
          </h1>

          <Link
            to="/create-event"
            className="eventlist-btn-create fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            + Create Event
          </Link>
        </header>

        {/* Event Grid */}
        <div className="eventlist-grid fade-in" style={{ animationDelay: "0.6s" }}>
          {events.length === 0 ? (
            <p className="eventlist-no-events">No events created yet.</p>
          ) : (
            events.map((event, index) => (
              <div
                key={event.id}
                className="eventlist-card fade-in"
                style={{ animationDelay: `${0.2 * (index + 4)}s` }}
              >
                <h2>{event.event_name}</h2>
                <p><strong>Venue:</strong> {event.event_venue}</p>
                <p><strong>Category:</strong> {event.event_category}</p>
                <p><strong>Date:</strong> {event.event_date}</p>
                <p><strong>Time In:</strong> {event.event_time_in}</p>
                <p><strong>Time Out:</strong> {event.event_time_out}</p>
                <p><strong>Ticket Price:</strong> ₱{event.ticket_price}</p>
                <p><strong>Ticket Limit:</strong> {event.ticket_limit}</p>
                <p className="desc"><strong>Description:</strong> {event.event_description}</p>

                <div className="eventlist-actions">
                  <button className="edit">Edit</button>
                  <button className="delete">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

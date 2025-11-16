import React, { useState } from "react";
import "./home_style.css";
import { Link } from "react-router-dom";

export default function Home({ user }) {
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState([
    { id: 1, event_name: "Concert A" },
    { id: 2, event_name: "Exhibition B" },
    { id: 3, event_name: "Comedy Show C" },
    { id: 4, event_name: "Totoys band" },
    { id: 5, event_name: "Harley's Band" },
  ]);

  const filteredEvents = query
    ? events.filter((e) =>
        e.event_name.toLowerCase().includes(query.toLowerCase())
      )
    : events;

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching for:", query);
  };

  return (
    <div className="home-root">
      {/* Top left My Tickets */}
      <div className="ticket-container">
        <Link to="/my-tickets" className="ticket-btn-top fade-button fade-hover">
          🎟️ My Tickets
        </Link>

        <Link to="/create-event" className="ticket-btn-top fade-button fade-hover create-event-btn">
          Create Event
        </Link>
      </div>

      {/* Top right Logout (only shown when authenticated) */}
      <div className="top-right-buttons">
        {user?.isAuthenticated ? (
          <Link to="/logout" className="logout-btn">
            Logout
          </Link>
        ) : (
          <Link to="/login" className="logout-btn fade-button fade-hover">
            Logout
          </Link>
        )}
      </div>

      {/* Hero Section */}
      <div className="hero fade-in">
        <h1>
          Skip the Line.<br />
          <span>Join the Fun.</span>
        </h1>

        <div className="search-bar fade-in delay-1">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search for event"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" aria-label="Search">🔍</button>
          </form>
        </div>

        <p className="fade-in delay-2">
          Get tickets to concerts, exhibitions, and entertainment events.
          <br />
          All in one place.
        </p>
      </div>

      {/* Event Grid Section */}
      <div className="events-section fade-in">
        <h2>Available Events</h2>

        {filteredEvents.length > 0 ? (
          <div className="event-grid">
            {filteredEvents.map((event) => (
              <div key={event.id} className="event-card">
                <h3>{event.event_name}</h3>
                <Link to={`/event/${event.id}`} className="view-btn">
                  View Details
                </Link>
              </div>
            ))}
          </div>
        ) : query ? (
          <div className="no-results">
            <p>No event named "<strong>{query}</strong>" found.</p>
            <Link to="/" className="back-btn">⬅ Go Back</Link>
          </div>
        ) : (
          <p>No events available yet.</p>
        )}
      </div>
    </div>
  );
}

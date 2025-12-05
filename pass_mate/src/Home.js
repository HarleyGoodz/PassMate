// Home.jsx
import React, { useState, useEffect } from "react";
import "./home_style.css";
import { Link, useNavigate } from "react-router-dom";

import bg1 from "./assets/event_background3.png";
import bg2 from "./assets/event_background2.png";
import bg3 from "./assets/event_background.png";

export default function Home() {
  const navigate = useNavigate();
  const backgrounds = [bg1, bg2, bg3];

  const [bgIndex, setBgIndex] = useState(0);
  const [prevBgIndex, setPrevBgIndex] = useState(0);
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const SLIDE_INTERVAL = 10000;

  useEffect(() => {
    let mounted = true;

    fetch("http://localhost:8080/api/user/me", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          navigate("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        if (data) setUser(data);
      })
      .catch(() => navigate("/login"))
      .finally(() => mounted && setLoadingUser(false));

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8080/api/user/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    navigate("/login");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setPrevBgIndex(bgIndex);
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, [bgIndex]);

  useEffect(() => {
    let mounted = true;

    async function loadEvents() {
      try {
        const res = await fetch("http://localhost:8080/api/events/all");
        const data = await res.json();
        if (!mounted) return;

        const mapped = Array.isArray(data)
          ? data.map((srv) => ({
              id: srv.eventId ?? srv.id,
              event_name: srv.eventName ?? srv.event_name,
              event_venue: srv.eventVenue ?? srv.event_venue,
              event_category: srv.eventCategory ?? srv.event_category,
              event_date: srv.eventStartTime
                ? String(srv.eventStartTime).split("T")[0]
                : "",
              event_time_in: srv.eventStartTime
                ? String(srv.eventStartTime).split("T")[1]?.slice(0, 5)
                : "",
              event_time_out: srv.eventEndTime
                ? String(srv.eventEndTime).split("T")[1]?.slice(0, 5)
                : "",
              event_description: srv.eventDescription ?? "",
              ticket_limit: srv.ticketLimit ?? 0,
              serverUserId: srv.user?.userId ?? null,
            }))
          : [];

        const notMine = mapped.filter(
          (ev) => ev.serverUserId !== user?.userId
        );

        setEvents(notMine);
      } catch (err) {
        console.error("Event loading error:", err);
      }
    }

    if (user) loadEvents();

    return () => {
      mounted = false;
    };
  }, [user]);

  if (loadingUser) return <div>Loading session...</div>;
  if (!user) return null;

  const filteredEvents = query
    ? events.filter((e) =>
        e.event_name.toLowerCase().includes(query.toLowerCase())
      )
    : events;

  return (
    <div className="home-root">
      {/* Top Left Buttons */}
      <div className="ticket-container">
        <Link to="/my-tickets" className="ticket-btn-top fade-hover">
          🎟️ My Tickets
        </Link>

        <Link to="/create-event" className="ticket-btn-top fade-hover">
          Create Event
        </Link>

        <Link to="/events" className="ticket-btn-top fade-hover">
          Your Events
        </Link>

        {/* NEW: Profile button */}
        <Link to="/profile" className="ticket-btn-top fade-hover">
          👤 Profile
        </Link>
      </div>

      {/* Logout Button */}
      <div className="top-right-buttons">
        <button onClick={handleLogout} className="logout-btn fade-hover">
          Logout
        </button>
      </div>

      {/* Hero Section */}
      <div className="hero">
        <div
          className="hero-bg hero-bg-base"
          style={{ backgroundImage: `url(${backgrounds[prevBgIndex]})` }}
        />
        <div
          key={bgIndex}
          className="hero-bg hero-bg-slide"
          style={{ backgroundImage: `url(${backgrounds[bgIndex]})` }}
        />

        <h1>
          Skip the Line.
          <br />
          <span className="headline-subtitle">Join the Fun.</span>
        </h1>

        <div className="search-bar fade-in delay-1">
          <input
            type="text"
            placeholder="Search for events..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <p className="fade-in delay-2">
          Find concerts, entertainment, and more — all from your dashboard.
        </p>
      </div>

      {/* Events List */}
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
        ) : (
          <p>No available events yet.</p>
        )}
      </div>
    </div>
  );
}

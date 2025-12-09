// src/js/Home.jsx
import React, { useState, useEffect } from "react";
import "./home_style.css";
import { Link, useNavigate } from "react-router-dom";

import bg1 from "./assets/event_background3.png";
import bg2 from "./assets/event_background2.png";
import bg3 from "./assets/event_background.png";

// Helper: Determine Event Status
const getEventStatus = (event_date, time_in, time_out) => {
  if (!event_date || !time_in || !time_out) return "AVAILABLE";

  try {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const start = new Date(`${event_date}T${time_in}:00`);
    const end = new Date(`${event_date}T${time_out}:00`);

    if (now > end) return "FINISHED";
    if (now >= start && now <= end) return "STARTING";
    return "AVAILABLE";
  } catch {
    return "AVAILABLE";
  }
};

export default function Home() {
  const navigate = useNavigate();
  const backgrounds = [bg1, bg2, bg3];

  const [bgIndex, setBgIndex] = useState(0);
  const [prevBgIndex, setPrevBgIndex] = useState(0);
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("ALL"); // ⭐ NEW STATE
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const SLIDE_INTERVAL = 10000;

  useEffect(() => {
    let mounted = true;

    fetch("http://localhost:8080/api/user/me", { credentials: "include" })
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

    return () => { mounted = false; };
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
              event_name: srv.eventName ?? srv.event_name ?? "",
              event_venue: srv.eventVenue ?? srv.event_venue ?? "",
              event_category: srv.eventCategory ?? srv.event_category ?? "",
              event_date: srv.eventStartTime ? String(srv.eventStartTime).split("T")[0] : (srv.event_date || ""),
              event_time_in: srv.eventStartTime
                ? String(srv.eventStartTime).split("T")[1]?.slice(0, 5)
                : (srv.event_time_in || ""),
              event_time_out: srv.eventEndTime
                ? String(srv.eventEndTime).split("T")[1]?.slice(0, 5)
                : (srv.event_time_out || ""),
              event_description: srv.eventDescription ?? srv.event_description ?? "",
              serverUserId: srv.user?.userId ?? null,
              // IMPORTANT: capture server-side event status (so we can hide CANCELLED)
              event_status: (srv.eventStatus ?? srv.event_status ?? null),
            }))
          : [];

        // Remove events where server flagged status = CANCELLED (case-insensitive)
        const notCancelled = mapped.filter((ev) => {
          const s = (ev.event_status ?? "").toString();
          return s.trim().toUpperCase() !== "CANCELLED";
        });

        // Keep only events not created by current user
        const notMine = notCancelled.filter((ev) => ev.serverUserId !== user?.userId);

        setEvents(notMine);
      } catch (err) {
        console.error("Event loading error:", err);
      }
    }

    if (user) loadEvents();
    return () => { mounted = false; };
  }, [user]);

  if (loadingUser) return <div>Loading session...</div>;
  if (!user) return null;

  // ⭐ FILTER BY NAME (search)
  let filteredEvents = query
    ? events.filter((e) =>
        (e.event_name || "").toLowerCase().includes(query.toLowerCase())
      )
    : events;

  // ⭐ EXTRA FILTERING BY STATUS
  const applyStatusFilter = (eventList) => {
    if (eventFilter === "ALL") return eventList;

    return eventList.filter((ev) => {
      const status = getEventStatus(ev.event_date, ev.event_time_in, ev.event_time_out);
      if (eventFilter === "FINISHED") return status === "FINISHED";
      if (eventFilter === "AVAILABLE") return status === "AVAILABLE";
      if (eventFilter === "STARTING") return status === "STARTING";
      return true;
    });
  };

  filteredEvents = applyStatusFilter(filteredEvents);

  const bannerStyles = {
    FINISHED: { backgroundColor: "#e53935", color: "#fff" },
    STARTING: { backgroundColor: "#fb8c00", color: "#fff" },
    AVAILABLE: { backgroundColor: "#1e88e5", color: "#fff" },
  };

  return (
    <div className="home-root">
      <div className="ticket-container">
        <Link to="/my-tickets" className="ticket-btn-top fade-hover">🎟️ My Tickets</Link>
        <Link to="/create-event" className="ticket-btn-top fade-hover">Create Event</Link>
        <Link to="/events" className="ticket-btn-top fade-hover">Your Events</Link>
        <Link to="/profile" className="ticket-btn-top fade-hover">👤 Profile</Link>
      </div>

      <div className="top-right-buttons">
        <button onClick={handleLogout} className="logout-btn fade-hover">Logout</button>
      </div>

      {/* HERO SECTION */}
      <div className="hero">
        <div className="hero-bg hero-bg-base" style={{ backgroundImage: `url(${backgrounds[prevBgIndex]})` }} />
        <div key={bgIndex} className="hero-bg hero-bg-slide" style={{ backgroundImage: `url(${backgrounds[bgIndex]})` }} />

        <h1>
          Skip the Line.<br />
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
      </div>

      {/* EVENTS LIST */}
      <div className="events-section fade-in">
        <h2>Published Events</h2>

        {/* ⭐ FILTER BUTTONS SECTION */}
        <div className="filter-buttons" style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
          <button
            className={`filter-btn ${eventFilter === "ALL" ? "active-filter" : ""}`}
            onClick={() => setEventFilter("ALL")}
          >
            All Events
          </button>

          <button
            className={`filter-btn ${eventFilter === "FINISHED" ? "active-filter" : ""}`}
            onClick={() => setEventFilter("FINISHED")}
          >
            Finished Events
          </button>

          <button
            className={`filter-btn ${eventFilter === "AVAILABLE" ? "active-filter" : ""}`}
            onClick={() => setEventFilter("AVAILABLE")}
          >
            Available Events
          </button>

          <button
            className={`filter-btn ${eventFilter === "STARTING" ? "active-filter" : ""}`}
            onClick={() => setEventFilter("STARTING")}
          >
            Started Events
          </button>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="event-grid">
            {filteredEvents.map((event) => {
              const status = getEventStatus(
                event.event_date,
                event.event_time_in,
                event.event_time_out
              );

              return (
                <div key={event.id} className="event-card">
                  <div
                    style={{
                      ...bannerStyles[status],
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontWeight: "700",
                      marginBottom: "8px",
                      textAlign: "center",
                    }}
                  >
                    {status === "FINISHED"
                      ? "EVENT FINISHED"
                      : status === "STARTING"
                      ? "EVENT IS STARTING"
                      : "EVENT AVAILABLE"}
                  </div>

                  <h3>{event.event_name}</h3>

                  {status !== "AVAILABLE" ? (
                    <button className="disabled-btn ended-btn" disabled>
                      {status === "STARTING" ? "Event Started – Cannot Buy" : "Event Ended – Cannot Buy"}
                    </button>
                  ) : (
                    <Link to={`/event/${event.id}`} className="view-btn">
                      View Details
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p>No events found.</p>
        )}
      </div>
    </div>
  );
}

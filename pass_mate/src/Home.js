// Home.jsx
import React, { useState, useEffect } from "react";
import "./home_style.css";
import { Link, useNavigate } from "react-router-dom";

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

/* ---------- Display helpers (UI only) ---------- */
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const splitDate = (d) => {
  const [y, m, day] = (d || "").split("-");
  if (!y || !m || !day) return null;
  return { month: MONTHS[Number(m) - 1] || "", day: String(Number(day)), year: y };
};
const to12h = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h)) return t;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, "0")} ${suffix}`;
};
const STATUS_UI = {
  AVAILABLE: { label: "Available", className: "hm-pill-available" },
  STARTING: { label: "Happening now", className: "hm-pill-live" },
  FINISHED: { label: "Finished", className: "hm-pill-finished" },
};
const FILTERS = [
  { value: "ALL", label: "All events" },
  { value: "AVAILABLE", label: "Available" },
  { value: "STARTING", label: "Started" },
  { value: "FINISHED", label: "Finished" },
];
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  x: (i * 37 + 11) % 100,
  delay: ((i * 1.4) % 9).toFixed(1),
  dur: 10 + (i % 5) * 2,
  size: 4 + (i % 4) * 3,
}));

const Icon = {
  ticket: <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4zM14 6v12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  calendar: <path d="M4 5h16v15H4zM16 3v4M8 3v4M4 10h16" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />,
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
  search: <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5" />,
  pin: <path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  lock: <path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4" />,
};
const Svg = ({ d, className = "" }) => <svg className={className} viewBox="0 0 24 24" aria-hidden="true">{d}</svg>;

export default function Home() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("ALL"); // ⭐ NEW STATE
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

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

  if (loadingUser) {
    return (
      <div className="hm-loading" role="status">
        <span className="hm-loading-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32"><rect x="6" y="6" width="8" height="8" rx="1.5" /><rect x="18" y="6" width="8" height="8" rx="1.5" /><rect x="6" y="18" width="8" height="8" rx="1.5" /><path d="M18 18h3v3h-3zM23 23h3v3h-3zM23 18h3M18 23v3" /></svg>
        </span>
        <span>Loading session...</span>
      </div>
    );
  }
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

  // counts for the summary tiles (display only)
  const counts = events.reduce(
    (acc, ev) => {
      acc[getEventStatus(ev.event_date, ev.event_time_in, ev.event_time_out)] += 1;
      return acc;
    },
    { AVAILABLE: 0, STARTING: 0, FINISHED: 0 }
  );
  const firstName = (user.fullname || "").trim().split(" ")[0] || "there";
  const initials = (user.fullname || user.emailAddress || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="hm-root">
      {/* Animated background (pure CSS, no images) */}
      <div className="hm-bg" aria-hidden="true">
        <span className="hm-blob hm-blob-1" />
        <span className="hm-blob hm-blob-2" />
        <span className="hm-blob hm-blob-3" />
        <span className="hm-grid" />
        {PARTICLES.map((p, i) => (
          <span key={i} className="hm-particle" style={{ "--x": `${p.x}%`, "--d": `${p.delay}s`, "--t": `${p.dur}s`, "--s": `${p.size}px` }} />
        ))}
      </div>

      {/* ===== Top navigation ===== */}
      <header className="hm-nav">
        <div className="hm-nav-in">
          <Link to="/home" className="hm-brand" aria-label="Event CIT home">
            <span className="hm-logo" aria-hidden="true">
              <svg viewBox="0 0 32 32"><rect x="6" y="6" width="8" height="8" rx="1.5" /><rect x="18" y="6" width="8" height="8" rx="1.5" /><rect x="6" y="18" width="8" height="8" rx="1.5" /><path d="M18 18h3v3h-3zM23 23h3v3h-3zM23 18h3M18 23v3" /></svg>
            </span>
            <span className="hm-brand-name">Event <span>CIT</span></span>
          </Link>

          <nav className="hm-links" aria-label="Main">
            <Link to="/my-tickets" className="hm-link"><Svg d={Icon.ticket} />My Tickets</Link>
            <Link to="/create-event" className="hm-link"><Svg d={Icon.plus} />Create Event</Link>
            <Link to="/events" className="hm-link"><Svg d={Icon.calendar} />Your Events</Link>
            <Link to="/profile" className="hm-link"><Svg d={Icon.user} />Profile</Link>
          </nav>

          <div className="hm-user">
            <Link to="/profile" className="hm-avatar" title={user.fullname || "Profile"} aria-label="Open profile">{initials}</Link>
            <button onClick={handleLogout} className="hm-logout" type="button">
              <Svg d={Icon.logout} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="hm-main">
        {/* ===== Hero ===== */}
        <section className="hm-hero">
          <p className="hm-kicker"><span className="hm-wave" aria-hidden="true" />Welcome back, {firstName}</p>
          <h1 className="hm-title">
            <span className="hm-line" style={{ "--i": 0 }}>Skip the Line.</span>
            <span className="hm-line hm-line-accent" style={{ "--i": 1 }}>Join the Fun.</span>
          </h1>
          <p className="hm-sub">Find events happening around campus and grab your QR ticket in seconds.</p>

          <div className="hm-search">
            <label htmlFor="hm-search-input" className="hm-sr">Search events</label>
            <Svg d={Icon.search} className="hm-search-icon" />
            <input
              id="hm-search-input"
              type="text"
              placeholder="Search for events..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" className="hm-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
                <Svg d={Icon.x} />
              </button>
            )}
          </div>

          <div className="hm-stats">
            <button type="button" className="hm-stat" onClick={() => setEventFilter("AVAILABLE")} style={{ "--i": 0 }}>
              <b>{counts.AVAILABLE}</b><span><i className="hm-dot hm-dot-available" />Available</span>
            </button>
            <button type="button" className="hm-stat" onClick={() => setEventFilter("STARTING")} style={{ "--i": 1 }}>
              <b>{counts.STARTING}</b><span><i className="hm-dot hm-dot-live" />Happening now</span>
            </button>
            <button type="button" className="hm-stat" onClick={() => setEventFilter("FINISHED")} style={{ "--i": 2 }}>
              <b>{counts.FINISHED}</b><span><i className="hm-dot hm-dot-finished" />Finished</span>
            </button>
          </div>
        </section>

        {/* ===== Events ===== */}
        <section className="hm-events" aria-labelledby="hm-events-title">
          <div className="hm-events-head">
            <div>
              <h2 id="hm-events-title">Published Events</h2>
              <p className="hm-count">
                {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}
                {query ? <> matching “{query}”</> : null}
              </p>
            </div>

            {/* ⭐ FILTER BUTTONS SECTION */}
            <div className="hm-filters" role="group" aria-label="Filter events by status">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={`hm-filter ${eventFilter === f.value ? "hm-filter-on" : ""}`}
                  aria-pressed={eventFilter === f.value}
                  onClick={() => setEventFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredEvents.length > 0 ? (
            <div className="hm-grid-cards">
              {filteredEvents.map((event, idx) => {
                const status = getEventStatus(
                  event.event_date,
                  event.event_time_in,
                  event.event_time_out
                );
                const ui = STATUS_UI[status];
                const date = splitDate(event.event_date);
                const time = event.event_time_in
                  ? `${to12h(event.event_time_in)}${event.event_time_out ? ` – ${to12h(event.event_time_out)}` : ""}`
                  : "";

                return (
                  <article key={event.id} className={`hm-card hm-card-${status.toLowerCase()}`} style={{ "--i": Math.min(idx, 11) }}>
                    <div className="hm-card-top">
                      <div className="hm-date" aria-label={date ? `${date.month} ${date.day}, ${date.year}` : "Date to be announced"}>
                        {date ? (<><span>{date.month}</span><b>{date.day}</b></>) : (<><span>DATE</span><b>TBA</b></>)}
                      </div>
                      <span className={`hm-pill ${ui.className}`}><i />{ui.label}</span>
                    </div>

                    {event.event_category && <span className="hm-category">{event.event_category}</span>}
                    <h3 className="hm-card-title">{event.event_name}</h3>

                    <ul className="hm-meta">
                      {event.event_venue && <li><Svg d={Icon.pin} />{event.event_venue}</li>}
                      {time && <li><Svg d={Icon.clock} />{time}</li>}
                    </ul>

                    {event.event_description && <p className="hm-desc">{event.event_description}</p>}

                    <div className="hm-card-foot">
                      {status !== "AVAILABLE" ? (
                        <button className="hm-btn-disabled" disabled>
                          <Svg d={Icon.lock} />
                          {status === "STARTING" ? "Event Started – Cannot Buy" : "Event Ended – Cannot Buy"}
                        </button>
                      ) : (
                        <Link to={`/event/${event.id}`} className="hm-btn">
                          View Details
                          <Svg d={Icon.arrow} />
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="hm-empty">
              <div className="hm-empty-art" aria-hidden="true">
                <Svg d={Icon.ticket} />
              </div>
              <p className="hm-empty-title">No events found.</p>
              <p className="hm-empty-text">
                {query || eventFilter !== "ALL"
                  ? "Try a different search or filter."
                  : "New events will show up here once they're published."}
              </p>
              {(query || eventFilter !== "ALL") && (
                <button type="button" className="hm-empty-btn" onClick={() => { setQuery(""); setEventFilter("ALL"); }}>
                  Show all events
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
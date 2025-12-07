// src/js/EventDetails.jsx
import React, { useState, useEffect } from "react";
import "../css/eventDetails.css";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";

const formatTo12Hour = (time) => {
  if (!time) return "";

  let [hour, minute] = time.split(":");
  hour = Number(hour);

  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12; // convert 0 → 12

  return `${hour}:${minute}${ampm}`;
};

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [event, setEvent] = useState(null);
  const [user, setUser] = useState(null);
  const [soldOut, setSoldOut] = useState(false);
  const [userHasTicket, setUserHasTicket] = useState(false);
  const [loading, setLoading] = useState(true);

  const [tickets, setTickets] = useState([]);
  const [regularInfo, setRegularInfo] = useState({ count: 0, available: 0, price: null, id: null });
  const [vipInfo, setVipInfo] = useState({ count: 0, available: 0, price: null, id: null });

  // ------------------------
  // helper fetch functions
  // ------------------------

  // fetch current session user
  async function fetchUser() {
    try {
      const res = await fetch("http://localhost:8080/api/user/me", { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        return null;
      }
      const data = await res.json();
      setUser(data);
      return data;
    } catch (err) {
      setUser(null);
      return null;
    }
  }

  // fetch event details
  async function fetchEvent() {
    try {
      const res = await fetch(`http://localhost:8080/api/events/${id}`);
      if (!res.ok) {
        console.error("Event not found", res.status);
        navigate("/home");
        return null;
      }
      const data = await res.json();

      const mapped = {
        id: data.eventId ?? data.id,
        event_name: data.eventName ?? data.event_name,
        event_venue: data.eventVenue ?? data.event_venue,
        event_category: data.eventCategory ?? data.event_category,
        event_date: data.eventStartTime ? String(data.eventStartTime).split("T")[0] : (data.event_date || ""),
        event_time_in: data.eventStartTime ? String(data.eventStartTime).split("T")[1]?.slice(0, 5) : (data.event_time_in || ""),
        event_time_out: data.eventEndTime ? String(data.eventEndTime).split("T")[1]?.slice(0, 5) : (data.event_time_out || ""),
        event_description: data.eventDescription ?? data.event_description ?? "",
        ticket_limit: data.ticketLimit ?? data.ticket_limit ?? 0,
        ticketsSold: data.ticketsSold ?? data.tickets_sold ?? null
      };

      setEvent(mapped);

      if ((data.ticketsSold ?? data.tickets_sold) != null) {
        const sold = (data.ticketsSold ?? data.tickets_sold) >= (data.ticketLimit ?? data.ticket_limit ?? Infinity);
        setSoldOut(Boolean(sold));
      } else {
        setSoldOut(false);
      }

      return mapped;
    } catch (err) {
      console.error("Failed to load event", err);
      return null;
    }
  }

  // fetch tickets for event and update regular/vip info
  async function fetchTickets(currentEvent) {
    if (!currentEvent) return;
    try {
      const res = await fetch("http://localhost:8080/api/ticket/all");
      if (!res.ok) {
        console.warn("Failed to load tickets", res.status);
        return;
      }
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];

      const forEvent = arr.filter((t) => {
        try {
          if (!t) return false;
          if (t.event && (t.event.eventId === currentEvent.id || t.event.id === currentEvent.id)) return true;
          if (t.eventId === currentEvent.id || t.event_id === currentEvent.id) return true;
          return false;
        } catch {
          return false;
        }
      });

      setTickets(forEvent);

      const regular = forEvent.filter((t) => String(t.ticketType ?? "").toLowerCase() === "regular");
      const vip = forEvent.filter((t) => String(t.ticketType ?? "").toLowerCase() === "vip");

      const regularAvailable = regular.filter((t) => t.availability !== false).length;
      const vipAvailable = vip.filter((t) => t.availability !== false).length;

      const regularPrice = regular.length ? (regular[0].ticketPrice ?? regular[0].ticket_price ?? null) : null;
      const vipPrice = vip.length ? (vip[0].ticketPrice ?? vip[0].ticket_price ?? null) : null;

      const regularId = regular.length ? (regular[0].ticketId ?? regular[0].id ?? null) : null;
      const vipId = vip.length ? (vip[0].ticketId ?? vip[0].id ?? null) : null;

      setRegularInfo({ count: regular.length, available: regularAvailable, price: regularPrice, id: regularId });
      setVipInfo({ count: vip.length, available: vipAvailable, price: vipPrice, id: vipId });

      if (currentEvent.ticket_limit) {
        const totalAvailable = regularAvailable + vipAvailable;
        setSoldOut(totalAvailable <= 0);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    }
  }

  // check if user already owns a ticket for this event
  async function fetchOwnership(currentUser, currentEvent) {
    if (!currentUser || !currentEvent) return;
    try {
      const res = await fetch(
        `http://localhost:8080/api/ticket/has?userId=${currentUser.userId}&eventId=${currentEvent.id}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        setUserHasTicket(false);
        return;
      }
      const body = await res.json();
      setUserHasTicket(Boolean(body.hasTicket ?? body));
    } catch (err) {
      console.warn("Could not check ticket ownership", err);
      setUserHasTicket(false);
    }
  }

  // refresh everything related to event (event + tickets + ownership)
  async function refreshAll() {
    const fetchedEvent = await fetchEvent();
    await fetchTickets(fetchedEvent);
    // ensure we have the latest user (session might have changed)
    const fetchedUser = await fetchUser();
    await fetchOwnership(fetchedUser, fetchedEvent);
  }

  // ------------------------
  // initial loads
  // ------------------------

  // 1) Load session user (keeps initial behavior)
  useEffect(() => {
    let mounted = true;
    fetchUser().then(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
    // keep empty deps to run once on mount (same as original)
  }, []);

  // 2) Load event details (keeps initial behavior)
  useEffect(() => {
    let mounted = true;
    async function doLoad() {
      const fetchedEvent = await fetchEvent();
      if (!mounted) return;
      // after loading event, also load tickets (keeps original sequence)
      await fetchTickets(fetchedEvent);
      setLoading(false);
    }
    doLoad();
    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  // 3) When `event` or `user` changes, re-check tickets & ownership (keeps original behavior)
  useEffect(() => {
    if (!event) return;
    let mounted = true;

    async function run() {
      await fetchTickets(event);
      if (!mounted) return;
      if (user) {
        await fetchOwnership(user, event);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [event, user]);

  // 4) Watch location.search so when the app returns to this page
  //    (for example after a purchase redirect), we refresh data immediately.
  useEffect(() => {
    // if any query changes (for example ?purchased=true), refresh tickets/ownership
    // keep this light — it calls refreshAll which retries fetches
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  if (loading) return <div>Loading event...</div>;
  if (!event) return <div>Event not found.</div>;

  const formatPrice = (p) => {
    if (p == null) return "₱0";
    return `₱${Number(p)}`;
  };

  // 🔥 Prevent buying twice — popup alert
  const blockMultiplePurchase = () => {
    alert("You can only buy one ticket for this event.");
  };

  return (
    <div className="event-page">
      <Link to="/home" className="back-btn">Back to home</Link>

      <div className="event-detail-card fade-in">
        <h1 className="details-title">{event.event_name}</h1>

        <div className="details-list">

          <div className="detail-item"><strong>Venue:</strong> {event.event_venue}</div>
          <div className="detail-item"><strong>Date:</strong> {event.event_date}</div>
          <div className="detail-item"><strong>Time:</strong> {formatTo12Hour(event.event_time_in)} – {formatTo12Hour(event.event_time_out)}</div>
          <div className="detail-item"><strong>Category:</strong> {event.event_category}</div>
          <div className="detail-item"><strong>Ticket Limit:</strong> {event.ticket_limit}</div>

          <div className="description-box">{event.event_description}</div>

          {/* Ticket Cards */}
          <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>

            {/* REGULAR */}
            <div className="ticket-box">
              <div className="ticket-title">Regular</div>
              <div><strong>Price:</strong> {formatPrice(regularInfo.price)}</div>
              <div><strong>Available:</strong> {regularInfo.available} / {regularInfo.count}</div>

              <div>
                {!user ? (
  <Link to="/login" className="buy-btn">Login to Buy</Link>
) : soldOut || regularInfo.available <= 0 ? (
  <button className="buy-btn disabled">SOLD OUT</button>
) : userHasTicket ? (
  <button className="buy-btn disabled" onClick={blockMultiplePurchase}>
    You've already bought this ticket!
  </button>
) : (
  <Link
    to={`/event/${event.id}/buy?type=Regular&userId=${user.userId}&ticketId=${regularInfo.id}`}
    className="buy-btn"
  >
    Buy Regular
  </Link>
)}
              </div>
            </div>

            {/* VIP */}
            <div className="ticket-box">
              <div className="ticket-title">VIP</div>
              <div><strong>Price:</strong> {formatPrice(vipInfo.price)}</div>
              <div><strong>Available:</strong> {vipInfo.available} / {vipInfo.count}</div>

              <div>
                {!user ? (
  <Link to="/login" className="buy-btn">Login to Buy</Link>
) : soldOut || vipInfo.available <= 0 ? (
  <button className="buy-btn disabled">SOLD OUT</button>
) : userHasTicket ? (
  <button className="buy-btn disabled" onClick={blockMultiplePurchase}>
    You've already bought this ticket!
  </button>
) : (
  <Link
    to={`/event/${event.id}/buy?type=VIP&userId=${user.userId}&ticketId=${vipInfo.id}`}
    className="buy-btn"
  >
    Buy VIP
  </Link>
)}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

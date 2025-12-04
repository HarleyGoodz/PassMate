// src/js/EventDetails.jsx
import React, { useState, useEffect } from "react";
import "../css/eventDetails.css";
import { Link, useParams, useNavigate } from "react-router-dom";

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [user, setUser] = useState(null);
  const [soldOut, setSoldOut] = useState(false);
  const [userHasTicket, setUserHasTicket] = useState(false);
  const [loading, setLoading] = useState(true);

  // ticket details
  const [tickets, setTickets] = useState([]); // all tickets for this event
  const [regularInfo, setRegularInfo] = useState({ count: 0, available: 0, price: null });
  const [vipInfo, setVipInfo] = useState({ count: 0, available: 0, price: null });

  // 1) Load session user
  useEffect(() => {
    let mounted = true;
    fetch("http://localhost:8080/api/user/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setUser(data);
      })
      .catch(() => setUser(null));

    return () => {
      mounted = false;
    };
  }, []);

  // 2) Load event details
  useEffect(() => {
    let mounted = true;
    async function loadEvent() {
      try {
        const res = await fetch(`http://localhost:8080/api/events/${id}`);
        if (!res.ok) {
          console.error("Event not found", res.status);
          navigate("/home");
          return;
        }
        const data = await res.json();
        if (!mounted) return;

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

        // determine soldOut using server-provided ticketsSold if available, otherwise we'll use tickets fetch below
        if ((data.ticketsSold ?? data.tickets_sold) != null) {
          const sold = (data.ticketsSold ?? data.tickets_sold) >= (data.ticketLimit ?? data.ticket_limit ?? Infinity);
          setSoldOut(Boolean(sold));
        } else {
          // leave soldOut false for now until tickets load
          setSoldOut(false);
        }
      } catch (err) {
        console.error("Failed to load event", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadEvent();
    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  // 2.5) Load tickets for this event and compute regular/vip info
  useEffect(() => {
    if (!event) return;
    let mounted = true;

    async function loadTickets() {
      try {
        // your backend doesn't appear to provide a direct /api/ticket/byEvent endpoint,
        // so fetch all and filter here (you have this pattern elsewhere)
        const res = await fetch("http://localhost:8080/api/ticket/all");
        if (!res.ok) {
          console.warn("Failed to load tickets", res.status);
          return;
        }
        const data = await res.json();
        if (!mounted) return;

        const arr = Array.isArray(data) ? data : [];

        // filter tickets for this event - account for different server shapes
        const forEvent = arr.filter((t) => {
          try {
            if (!t) return false;
            if (t.event && (t.event.eventId === event.id || t.event.id === event.id)) return true;
            // maybe server sends eventId directly on ticket
            if (t.eventId === event.id || t.event_id === event.id) return true;
            return false;
          } catch (e) {
            return false;
          }
        });

        setTickets(forEvent);

        const regular = forEvent.filter((t) => String(t.ticketType ?? "").toLowerCase() === "regular");
        const vip = forEvent.filter((t) => String(t.ticketType ?? "").toLowerCase() === "vip");

        const regularAvailable = regular.filter((t) => t.availability !== false).length;
        const vipAvailable = vip.filter((t) => t.availability !== false).length;

        // choose the price to show — prefer the first ticket's price if present
        const regularPrice = regular.length > 0 ? (regular[0].ticketPrice ?? regular[0].ticket_price ?? null) : null;
        const vipPrice = vip.length > 0 ? (vip[0].ticketPrice ?? vip[0].ticket_price ?? null) : null;

        setRegularInfo({ count: regular.length, available: regularAvailable, price: regularPrice });
        setVipInfo({ count: vip.length, available: vipAvailable, price: vipPrice });

        // if server didn't give ticketsSold earlier, compute sold out here using available counts and ticket_limit
        if (event.ticket_limit && Number.isFinite(Number(event.ticket_limit))) {
          const totalAvailable = regularAvailable + vipAvailable;
          // if totalAvailable is 0 then sold out
          setSoldOut(totalAvailable <= 0);
        }
      } catch (err) {
        console.error("Failed to load tickets:", err);
      }
    }

    loadTickets();

    return () => {
      mounted = false;
    };
  }, [event]);

  // 3) Check if user owns a ticket for this event (calls backend if user present)
  useEffect(() => {
    if (!user || !event) return;
    let mounted = true;

    async function checkOwnership() {
      try {
        const res = await fetch(`http://localhost:8080/api/ticket/has?userId=${user.userId}&eventId=${event.id}`, {
          credentials: "include",
        });
        if (!mounted) return;
        if (!res.ok) {
          setUserHasTicket(false);
          return;
        }
        const body = await res.json();
        if (typeof body === "object" && body.hasTicket != null) {
          setUserHasTicket(Boolean(body.hasTicket));
        } else if (typeof body === "boolean") {
          setUserHasTicket(body);
        } else {
          setUserHasTicket(false);
        }
      } catch (err) {
        console.warn("Could not check ticket ownership", err);
        setUserHasTicket(false);
      }
    }

    checkOwnership();

    return () => {
      mounted = false;
    };
  }, [user, event]);

  if (loading) return <div>Loading event...</div>;
  if (!event) return <div>Event not found.</div>;

  const formatPrice = (p) => {
    if (p == null || p === "") return "₱0";
    const num = Number(p);
    if (Number.isNaN(num)) return String(p);
    return `₱${num}`;
  };

  return (
    <div className="event-page">
      <Link to="/home" className="back-btn">Back to home</Link>

      <div className="event-detail-card fade-in">
        <h1 className="details-title">{event.event_name}</h1>

        <div className="details-list">
          <div className="detail-item"><strong>Venue:</strong> {event.event_venue}</div>
          <div className="detail-item"><strong>Date:</strong> {event.event_date}</div>
          <div className="detail-item"><strong>Time:</strong> {event.event_time_in} – {event.event_time_out}</div>
          <div className="detail-item"><strong>Category:</strong> {event.event_category}</div>
          <div className="detail-item"><strong>Ticket Limit:</strong> {event.ticket_limit}</div>

          <div className="description-box">{event.event_description}</div>

          {/* NEW: Ticket breakdown */}
          <div style={{ marginTop: 18, display: "flex", gap: 12, alignItems: "stretch", flexWrap: "wrap" }}>
            <div style={{
              flex: "1 1 220px",
              background: "#fff",
              borderRadius: 10,
              padding: 14,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Regular</div>
              <div style={{ marginBottom: 6 }}><strong>Price:</strong> {regularInfo.price != null ? formatPrice(regularInfo.price) : "Not set"}</div>
              <div style={{ marginBottom: 8 }}><strong>Available:</strong> {regularInfo.available} / {regularInfo.count}</div>
              <div>
                {(!user) ? (
                  <Link to="/login" className="buy-btn">Login to Buy</Link>
                ) : soldOut || regularInfo.available <= 0 ? (
                  <button className="buy-btn disabled">SOLD OUT</button>
                ) : userHasTicket ? (
                  <button className="buy-btn disabled">Ticket Owned</button>
                ) : (
                  <Link to={`/event/${event.id}/buy?type=Regular`} className="buy-btn">Buy Regular</Link>
                )}
              </div>
            </div>

            <div style={{
              flex: "1 1 220px",
              background: "#fff",
              borderRadius: 10,
              padding: 14,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>VIP</div>
              <div style={{ marginBottom: 6 }}><strong>Price:</strong> {vipInfo.price != null ? formatPrice(vipInfo.price) : "Not set"}</div>
              <div style={{ marginBottom: 8 }}><strong>Available:</strong> {vipInfo.available} / {vipInfo.count}</div>
              <div>
                {(!user) ? (
                  <Link to="/login" className="buy-btn">Login to Buy</Link>
                ) : soldOut || vipInfo.available <= 0 ? (
                  <button className="buy-btn disabled">SOLD OUT</button>
                ) : userHasTicket ? (
                  <button className="buy-btn disabled">Ticket Owned</button>
                ) : (
                  <Link to={`/event/${event.id}/buy?type=VIP`} className="buy-btn">Buy VIP</Link>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

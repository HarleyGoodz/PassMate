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

  const [, setTickets] = useState([]);
  const [regularInfo, setRegularInfo] = useState({ count: 0, available: 0, price: null, id: null });
  const [vipInfo, setVipInfo] = useState({ count: 0, available: 0, price: null, id: null });

  // Modal state
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
    loading: false
  });

  // Simple modal component
  const Modal = ({ show, title, message, onClose, onConfirm, loading }) => {
    if (!show) return null;
    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
      }}>
        <div style={{
          width: 360, background: "#fff", padding: 20,
          borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.2)"
        }}>
          <h3 style={{ margin: "0 0 8px 0", textAlign: "center" }}>{title}</h3>
          <div style={{ marginBottom: 16, color: "#333", whiteSpace: "pre-line", textAlign: "center" }}>{message}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd",
                background: "#f5f5f5", cursor: loading ? "not-allowed" : "pointer"
              }}>
              Close
            </button>
            {onConfirm && (
              <button
                onClick={onConfirm}
                disabled={loading}
                style={{
                  flex: 1, padding: "8px 10px", borderRadius: 8, border: "none",
                  background: loading ? "#f0a86b" : "#ff8a00", color: "#fff",
                  cursor: loading ? "not-allowed" : "pointer", fontWeight: "700"
                }}>
                {loading ? "Processing..." : "Confirm"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ------------------------
  // helper fetch functions
  // ------------------------

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
    } catch {
      setUser(null);
      return null;
    }
  }

  async function fetchEvent() {
    try {
      const res = await fetch(`http://localhost:8080/api/events/${id}`);
      if (!res.ok) {
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
        event_time_in: data.eventStartTime ? String(data.eventStartTime).split("T")[1].slice(0, 5) : (data.event_time_in || ""),
        event_time_out: data.eventEndTime ? String(data.eventEndTime).split("T")[1].slice(0, 5) : (data.event_time_out || ""),
        event_description: data.eventDescription ?? data.event_description ?? "",
        ticket_limit: data.ticketLimit ?? data.ticket_limit ?? 0,
        ticketsSold: data.ticketsSold ?? data.tickets_sold ?? null
      };

      setEvent(mapped);

      if ((data.ticketsSold ?? data.tickets_sold) != null) {
        setSoldOut((data.ticketsSold ?? data.tickets_sold) >= mapped.ticket_limit);
      }

      return mapped;
    } catch (err) {
      console.error("Failed to load event", err);
      return null;
    }
  }

  async function fetchTickets(currentEvent) {
    if (!currentEvent) return;
    try {
      const res = await fetch("http://localhost:8080/api/ticket/all");
      if (!res.ok) return;

      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];

      const forEvent = arr.filter((t) =>
        t.event?.eventId === currentEvent.id ||
        t.event?.id === currentEvent.id ||
        t.eventId === currentEvent.id ||
        t.event_id === currentEvent.id
      );

      setTickets(forEvent);

      const regular = forEvent.filter((t) => String(t.ticketType).toLowerCase() === "regular");
      const vip = forEvent.filter((t) => String(t.ticketType).toLowerCase() === "vip");

      const regularAvailable = regular.filter((t) => t.availability !== false).length;
      const vipAvailable = vip.filter((t) => t.availability !== false).length;

      setRegularInfo({
        count: regular.length,
        available: regularAvailable,
        price: regular[0]?.ticketPrice ?? regular[0]?.ticket_price ?? null,
        id: regular[0]?.ticketId ?? regular[0]?.id ?? null
      });

      setVipInfo({
        count: vip.length,
        available: vipAvailable,
        price: vip[0]?.ticketPrice ?? vip[0]?.ticket_price ?? null,
        id: vip[0]?.ticketId ?? vip[0]?.id ?? null
      });

      if (currentEvent.ticket_limit) {
        setSoldOut((regularAvailable + vipAvailable) <= 0);
      }
    } catch (err) {
      console.error("Failed to load tickets", err);
    }
  }

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
    } catch {
      setUserHasTicket(false);
    }
  }

  async function refreshAll() {
    const e = await fetchEvent();
    await fetchTickets(e);
    const u = await fetchUser();
    await fetchOwnership(u, e);
  }

  // ------------------------
  // initial loads
  // ------------------------
  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    async function load() {
      const e = await fetchEvent();
      await fetchTickets(e);
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!event) return;
    async function run() {
      await fetchTickets(event);
      if (user) await fetchOwnership(user, event);
    }
    run();
  }, [event, user]);

  // handle ?already=true redirect
  useEffect(() => {
    if (location.search.includes("already=true")) {
      setModal({
        show: true,
        title: "You Already Purchased",
        message: "You can only buy one ticket per event.",
        onConfirm: null
      });

      const clean = window.location.pathname + location.search.replace(/[?&]already=true/, "");
      window.history.replaceState({}, "", clean);
    }
  }, [location.search]);

  if (loading) return <div>Loading event...</div>;
  if (!event) return <div>Event not found.</div>;

  const formatPrice = (p) => p == null ? "₱0" : `₱${Number(p)}`;

  const handleConfirmPurchase = async (ticketIdToBuy) => {
    if (!user) {
      setModal({
        show: true,
        title: "Login required",
        message: "Please log in to purchase tickets.",
        onConfirm: null
      });
      return;
    }

    setModal({
      show: true,
      loading: true,
      title: "Processing...",
      message: "Please wait...",
      onConfirm: null
    });

    try {
      const checkRes = await fetch(
        `http://localhost:8080/api/ticket/has?userId=${user.userId}&eventId=${event.id}`,
        { credentials: "include" }
      );

      if (checkRes.ok) {
        const j = await checkRes.json();
        if (Boolean(j.hasTicket ?? j)) {
          setModal({
            show: true,
            title: "You Already Purchased",
            message: "You already have a ticket for this event.",
            onConfirm: null
          });
          return;
        }
      }

      const resp = await fetch(
        `http://localhost:8080/api/payment/purchase?userId=${user.userId}&ticketId=${ticketIdToBuy}`,
        {
          method: "POST",
          credentials: "include"
        }
      );

      if (!resp.ok) {
        setModal({
          show: true,
          title: "Purchase Unsuccessful",
          message: "Purchase failed. Please try again.",
          onConfirm: null
        });
        return;
      }

      const body = await resp.json();

      // Navigate to the correct route: /event/:id/buy
      navigate(`/event/${event.id}/buy`, {
        state: {
          ticketPrice: body.ticketPrice,
          remainingWallet: body.remainingWallet,
          referenceCode: body.referenceCode ?? body.reference_code ?? null,
          eventId: event.id,
          ticketId: ticketIdToBuy,
          email: user.emailAddress ?? user.email
        }
      });

      await refreshAll();

    } catch (err) {
      setModal({
        show: true,
        title: "Error",
        message: `An error occurred: ${err.message}`,
        onConfirm: null
      });
    }
  };


  return (
    <div className="event-page">
      <Modal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        loading={modal.loading}
        onClose={() => setModal({ ...modal, show: false, loading: false })}
        onConfirm={modal.onConfirm}
      />

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

              {!user ? (
                <Link to="/login" className="buy-btn">Login to Buy</Link>
              ) : soldOut || regularInfo.available <= 0 ? (
                <button className="buy-btn disabled" disabled>SOLD OUT</button>
              ) : userHasTicket ? (
                <button className="buy-btn disabled" disabled>You already bought this</button>
              ) : (
                <button
                  className="buy-btn"
                  onClick={() =>
                    setModal({
                      show: true,
                      title: "Confirm Purchase",
                      message: `Buy Regular Ticket for ₱${regularInfo.price}?`,
                      onConfirm: () => handleConfirmPurchase(regularInfo.id)
                    })
                  }
                >
                  Buy Regular
                </button>
              )}
            </div>

            {/* VIP */}
            <div className="ticket-box">
              <div className="ticket-title">VIP</div>
              <div><strong>Price:</strong> {formatPrice(vipInfo.price)}</div>
              <div><strong>Available:</strong> {vipInfo.available} / {vipInfo.count}</div>

              {!user ? (
                <Link to="/login" className="buy-btn">Login to Buy</Link>
              ) : soldOut || vipInfo.available <= 0 ? (
                <button className="buy-btn disabled" disabled>SOLD OUT</button>
              ) : userHasTicket ? (
                <button className="buy-btn disabled" disabled>You already bought this</button>
              ) : (
                <button
                  className="buy-btn"
                  onClick={() =>
                    setModal({
                      show: true,
                      title: "Confirm Purchase",
                      message: `Buy VIP Ticket for ₱${vipInfo.price}?`,
                      onConfirm: () => handleConfirmPurchase(vipInfo.id)
                    })
                  }
                >
                  Buy VIP
                </button>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../css/eventList.css";
import Modal from "../Modal";

export default function EventList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [localEvents, setLocalEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState(null);
  const [ticketsByEvent, setTicketsByEvent] = useState({});
  const [openBreakdownId, setOpenBreakdownId] = useState(null);

  const userId = Number(localStorage.getItem("userId") || 0);

  const groupTicketsByEvent = (ticketsArr) => {
    const map = {};
    ticketsArr.forEach((t) => {
      const eid =
        t.event?.eventId ??
        t.event?.id ??
        t.eventId ??
        t.event_id;
      if (eid == null) return;
      const key = Number(eid);
      if (!map[key]) map[key] = { regular: [], vip: [], raw: [] };
      map[key].raw.push(t);
      const type = String(t.ticketType ?? t.type ?? "").toLowerCase();
      if (type.includes("vip")) map[key].vip.push(t);
      else map[key].regular.push(t);
    });
    return map;
  };

  const mapServerEvent = (srv) => ({
    id: srv.eventId ?? srv.id,
    event_name: srv.eventName ?? srv.event_name,
    event_venue: srv.eventVenue ?? srv.event_venue,
    event_category: srv.eventCategory ?? srv.event_category,
    event_date: srv.eventStartTime
      ? String(srv.eventStartTime).split("T")[0]
      : srv.event_date || "",
    event_time_in: srv.eventStartTime
      ? String(srv.eventStartTime).split("T")[1]?.slice(0, 5)
      : srv.event_time_in || "",
    event_time_out: srv.eventEndTime
      ? String(srv.eventEndTime).split("T")[1]?.slice(0, 5)
      : srv.event_time_out || "",
    ticket_limit: srv.ticketLimit ?? srv.ticket_limit ?? 0,
    event_description: srv.eventDescription ?? srv.event_description ?? "",
    serverUser: srv.user ?? srv.createdBy ?? null,
    ticket_price_vip: null,
    ticket_price_standard: null,
  });

  const formatPrice = (p) => {
    if (p === null || p === undefined) return "Free";
    const n = Number(p);
    if (isNaN(n)) return "Free";
    if (n === 0) return "Free";
    return `₱${n.toLocaleString("en-PH")}`;
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const [eventsRes, ticketsRes] = await Promise.all([
        axios.get("http://localhost:8080/api/events/all", { withCredentials: true }),
        axios.get("http://localhost:8080/api/ticket/all", { withCredentials: true }),
      ]);

      const eventsData = Array.isArray(eventsRes.data) ? eventsRes.data : [];
      const ticketsData = Array.isArray(ticketsRes.data) ? ticketsRes.data : [];

      const grouped = groupTicketsByEvent(ticketsData);
      setTicketsByEvent(grouped);

      const mapped = eventsData.map((srv) => {
        const base = mapServerEvent(srv);
        const tb = grouped[Number(base.id)];

        if (tb) {
          const reg = tb.regular[0] ?? tb.raw[0];
          const vip = tb.vip[0];

          base.ticket_price_standard = reg
            ? reg.ticketPrice ?? reg.ticket_price ?? reg.price ?? 0
            : 0;

          base.ticket_price_vip = vip
            ? vip.ticketPrice ?? vip.ticket_price ?? vip.price ?? 0
            : 0;
        }

        return base;
      });

      const mine = mapped.filter((e) => {
        if (e.serverUser && typeof e.serverUser === "object" && e.serverUser.userId) {
          return Number(e.serverUser.userId) === userId;
        }
        const full = (localStorage.getItem("userFullname") || "").toLowerCase();
        const email = (localStorage.getItem("userEmail") || "").toLowerCase();
        if (typeof e.serverUser === "string") {
          const s = e.serverUser.toLowerCase();
          if (full && s.includes(full)) return true;
          if (email && s.includes(email)) return true;
        }
        return false;
      });

      setLocalEvents(mine);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch events or tickets:", err);
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEdit = (event) => {
    navigate(`/edit-event/${event.id}`, { state: { event } });
  };

  const confirmDelete = (event) => {
    setDeleteTarget(event);
    setShowDeleteModal(true);
  };

  const ticketGetId = (ticket) => ticket.ticketId ?? ticket.id ?? ticket.ticket_id ?? ticket._id;

  const deleteEvent = async () => {
    if (!deleteTarget) return;
    try {
      const ticketsRes = await axios.get("http://localhost:8080/api/ticket/all", { withCredentials: true });
      const ticketsData = Array.isArray(ticketsRes.data) ? ticketsRes.data : [];

      const ticketsForEvent = ticketsData.filter((t) => {
        const eid = t.event?.eventId ?? t.event?.id ?? t.eventId ?? t.event_id;
        return Number(eid) === Number(deleteTarget.id);
      });

      if (ticketsForEvent.length > 0) {
        const deletePromises = ticketsForEvent.map((t) => {
          const tid = ticketGetId(t);
          if (!tid) return Promise.resolve();
          return axios.delete(`http://localhost:8080/api/ticket/delete/${tid}`, { withCredentials: true });
        });
        await Promise.all(deletePromises);
      }

      const res = await axios.delete(`http://localhost:8080/api/events/delete/${deleteTarget.id}`, { withCredentials: true });

      if (res.status >= 200 && res.status < 300) {
        setLocalEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
        setShowDeleteModal(false);
        setDeleteTarget(null);
        setOpenBreakdownId((prev) => (prev === deleteTarget.id ? null : prev));
      } else {
        const msg = res.data ?? `Delete returned ${res.status}`;
        alert("Failed to delete event: " + JSON.stringify(msg, null, 2));
      }
    } catch (err) {
      console.error("Delete failed:", err);
      let msg = "Failed to delete event.";
      if (err.response) {
        if (typeof err.response.data === "string") msg = err.response.data;
        else if (err.response.data?.message) msg = err.response.data.message;
        else msg = JSON.stringify(err.response.data, null, 2);
      } else msg = err.message;
      alert(msg);
    }
  };

  const toggleBreakdown = (eventId) => {
    setOpenBreakdownId((prev) => (prev === eventId ? null : eventId));
  };

  const renderTicketRow = (t) => {
    const id = ticketGetId(t) ?? "(no id)";
    const type = t.ticketType ?? t.type ?? "Unknown";
    const price = formatPrice(t.ticketPrice ?? t.ticket_price ?? t.price ?? 0);
    const status = t.status ?? t.available ?? (t.isSold ? "Sold" : "Available");
    const availability = status === undefined || status === null ? (t.isSold ? "Sold" : "Available") : String(status);

    return (
      <div key={id} className="ticket-row">
        <div className="ticket-cell ticket-id">{id}</div>
        <div className="ticket-cell ticket-type">{type}</div>
        <div className="ticket-cell ticket-price">{price}</div>
        <div className={`ticket-cell ticket-availability availability-${String(availability).toLowerCase()}`}>
          {availability}
        </div>
      </div>
    );
  };

  return (
    <div className="eventlist-page">
      <Link to="/home" className="eventlist-back">Back to home</Link>
      <h1 className="eventlist-title fade-in">Your Events</h1>

      <div className="eventlist-wrapper fade-in">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading events…</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>⚠ Error: {String(error)}</p>
          </div>
        ) : localEvents.length === 0 ? (
          <div className="empty-state">
            <p>No events created yet.</p>
            <span>Create your first event to get started</span>
          </div>
        ) : (
          localEvents.map((event, index) => {
            const tb = ticketsByEvent[Number(event.id)] ?? { regular: [], vip: [], raw: [] };
            const regCount = tb.regular.length;
            const vipCount = tb.vip.length;
            const totalCount = tb.raw.length;

            return (
              <div
                key={event.id}
                className="eventlist-card fade-in"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="card-header">
                  <h2 className="event-title">{event.event_name}</h2>
                  <span className="event-category-badge">{event.event_category}</span>
                </div>

                <div className="event-details-box">
                  <div className="detail-row">
                    <span className="detail-label">📍 Venue</span>
                    <span className="detail-value">{event.event_venue}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">📅 Date</span>
                    <span className="detail-value">{event.event_date}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">🕐 Time</span>
                    <span className="detail-value">{event.event_time_in} – {event.event_time_out}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">💰 Price</span>
                    <span className="detail-value">
                      <span className="price-regular">{formatPrice(event.ticket_price_standard)} Regular</span>
                      <span className="price-vip">{formatPrice(event.ticket_price_vip)} VIP</span>
                    </span>
                  </div>
                  {event.event_description && (
                    <div className="detail-row description">
                      <span className="detail-label">📝 About</span>
                      <span className="detail-value">{event.event_description}</span>
                    </div>
                  )}
                </div>

                <div className="eventlist-actions">
                  <button
                    className="view-breakdown-btn"
                    onClick={() => toggleBreakdown(event.id)}
                    aria-expanded={openBreakdownId === event.id}
                  >
                    {openBreakdownId === event.id ? "Hide breakdown" : "View breakdown"}
                    <span className="ticket-count">{totalCount}</span>
                  </button>
                </div>

                {openBreakdownId === event.id && (
                  <div className="breakdown-panel">
                    <h3>Ticket Breakdown</h3>

                    <div className="breakdown-summary">
                      <div className="summary-item">
                        <span className="summary-label">Total</span>
                        <span className="summary-value">{totalCount}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Regular</span>
                        <span className="summary-value regular">{regCount}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">VIP</span>
                        <span className="summary-value vip">{vipCount}</span>
                      </div>
                    </div>

                    <div className="breakdown-list">
                      {tb.raw.length === 0 ? (
                        <div className="no-tickets">No tickets created for this event.</div>
                      ) : (
                        <>
                          <div className="ticket-header">
                            <div className="ticket-cell">ID</div>
                            <div className="ticket-cell">Type</div>
                            <div className="ticket-cell">Price</div>
                            <div className="ticket-cell">Status</div>
                          </div>
                          {tb.raw.map((t) => renderTicketRow(t))}
                        </>
                      )}
                    </div>

                    <div className="breakdown-actions">
                      <button className="secondary-btn" onClick={() => handleEdit(event)}>✏ Edit</button>
                      <button
                        className="icon-btn danger"
                        title="Delete event"
                        onClick={() => confirmDelete(event)}
                        aria-label="Delete event"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Modal
        open={showDeleteModal}
        title="Delete Event"
        message={deleteTarget ? `Delete "${deleteTarget.event_name}"?` : ""}
        showCancel={true}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={deleteEvent}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
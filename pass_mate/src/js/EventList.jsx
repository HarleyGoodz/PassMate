// src/js/EventList.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../css/eventList.css";
import Modal from "../Modal";

// 12-hour format
const formatTo12Hour = (time) => {
  if (!time) return "";
  const parts = String(time).split(":");
  if (parts.length < 2) return time;

  let [hour, minute] = parts;
  hour = Number(hour);
  if (Number.isNaN(hour)) return time;

  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;

  return `${hour}:${minute}${ampm}`;
};

// Helper: Determine Event Status
const getEventStatus = (event_date, time_in, time_out) => {
  if (!event_date || !time_in || !time_out) return "AVAILABLE";

  try {
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
    );
    const start = new Date(`${event_date}T${time_in}:00`);
    const end = new Date(`${event_date}T${time_out}:00`);

    if (now > end) return "FINISHED";
    if (now >= start && now <= end) return "STARTING";
    return "AVAILABLE";
  } catch {
    return "AVAILABLE";
  }
};

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
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteWillCancel, setDeleteWillCancel] = useState(false);
  // default changed to NON_CANCELLED so CANCELLED events are hidden by default
  const [eventFilter, setEventFilter] = useState("NON_CANCELLED");

  // Attendees modal: list attendees for a single event
  const [attendeesModal, setAttendeesModal] = useState({
    show: false,
    eventId: null,
    list: [],
  });

  const userId = Number(localStorage.getItem("userId") || 0);

  // =====================
  // Attendees helpers
  // =====================
  const openAttendees = async (eventId) => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/payment/get-by-event/${eventId}`,
        { withCredentials: true }
      );

      const list = Array.isArray(res.data) ? res.data : [];

      setAttendeesModal({
        show: true,
        eventId,
        list,
      });
    } catch (err) {
      console.error("Failed to fetch attendees", err);
      alert("Failed to load attendees for this event.");
    }
  };

  const approve = async (paymentId) => {
    if (!paymentId) return;
    try {
      await axios.post(
        `http://localhost:8080/api/payment/attendee/approve/${paymentId}`,
        {},
        { withCredentials: true }
      );

      // reload current attendees
      if (attendeesModal.eventId) {
        openAttendees(attendeesModal.eventId);
      }
    } catch (err) {
      console.error("Failed to approve attendee", err);
      alert("Failed to approve attendee.");
    }
  };

  const decline = async (paymentId) => {
    if (!paymentId) return;
    try {
      await axios.post(
        `http://localhost:8080/api/payment/attendee/decline/${paymentId}`,
        {},
        { withCredentials: true }
      );

      // reload current attendees
      if (attendeesModal.eventId) {
        openAttendees(attendeesModal.eventId);
      }
    } catch (err) {
      console.error("Failed to decline attendee", err);
      alert("Failed to decline attendee.");
    }
  };

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
    id: Number(srv.eventId),
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
    // expose raw status coming from backend so we can filter CANCELLED explicitly
    event_status: (srv.eventStatus ?? srv.event_status ?? "").toString(),
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
        axios.get("http://localhost:8080/api/events/all", {
          withCredentials: true,
        }),
        axios.get("http://localhost:8080/api/ticket/all", {
          withCredentials: true,
        }),
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

      // filter to events that belong to this user
      const mine = mapped.filter((e) => {
        if (
          e.serverUser &&
          typeof e.serverUser === "object" &&
          e.serverUser.userId
        ) {
          return Number(e.serverUser.userId) === userId;
        }

        const full = (localStorage.getItem("userFullname") || "").toLowerCase();
        const email = (localStorage.getItem("userEmail") || "").toLowerCase();

        if (typeof e.serverUser === "string") {
          const str = e.serverUser.toLowerCase();
          if (full && str.includes(full)) return true;
          if (email && str.includes(email)) return true;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!location || !location.search) return;
    if (
      location.search.includes("purchased=true") ||
      location.search.includes("already=true")
    ) {
      fetchEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    const onFocus = () => fetchEvents();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEdit = (event) => {
    navigate(`/edit-event/${event.id}`, { state: { event } });
  };

  // confirmDelete now inspects ticketsByEvent to determine whether deletion will actually be a cancel
  const confirmDelete = (event) => {
    setDeleteTarget(event);

    const tb = ticketsByEvent[Number(event.id)] ?? { raw: [] };
    const raw = tb.raw ?? [];

    // heuristics: consider ticket "purchased" if any of these common fields are present
    const hasPurchased = raw.some((t) => {
      if (!t) return false;
      if (t.payment || t.payments) return true;
      if (t.paid === true) return true;
      if (t.user) return true;
      // availability semantics: true => available, false => sold
      if (t.available === false || t.availability === false) return true;
      if (t.sold === true) return true;
      return false;
    });

    setDeleteWillCancel(hasPurchased);
    setShowDeleteModal(true);
  };

  const ticketGetId = (ticket) =>
    ticket.ticketId ?? ticket.id ?? ticket.ticket_id ?? ticket._id;

  const deleteEvent = async () => {
    if (!deleteTarget) return;

    setDeleting(true); // <-- START loading

    try {
      const res = await axios.delete(
        `http://localhost:8080/api/events/delete/${deleteTarget.id}`,
        { withCredentials: true }
      );

      const msg = res?.data ?? "Event cancelled";
      console.log(msg);

      // remove from UI
      setLocalEvents((prev) =>
        prev.filter((e) => e.id !== deleteTarget.id)
      );
      setShowDeleteModal(false);
      setDeleteTarget(null);
      setOpenBreakdownId((prev) =>
        prev === deleteTarget.id ? null : prev
      );
    } catch (err) {
      const serverMsg = err?.response?.data
        ? typeof err.response.data === "string"
          ? err.response.data
          : JSON.stringify(err.response.data)
        : err.message;

      alert("Error deleting event: " + serverMsg);
    } finally {
      setDeleting(false); // <-- END loading
    }
  };

  const toggleBreakdown = (eventId) => {
    setOpenBreakdownId((prev) => (prev === eventId ? null : eventId));
  };

  // FIXED: filter function that excludes explicit CANCELLED events
  const applyEventFilter = (events) => {
    if (!eventFilter || eventFilter === "ALL") return events;

    // always allow explicit NON_CANCELLED filter
    if (eventFilter === "NON_CANCELLED") {
      return events.filter(
        (e) =>
          (e.event_status ?? "").toString().toUpperCase() !== "CANCELLED"
      );
    }

    // show only cancelled when user asked for cancelled
    if (eventFilter === "CANCELLED") {
      return events.filter(
        (e) =>
          (e.event_status ?? "").toString().toUpperCase() === "CANCELLED"
      );
    }

    // For time-based filters (AVAILABLE / STARTING / FINISHED) exclude explicit CANCELLED events
    return events.filter((e) => {
      const explicit = (e.event_status ?? "").toString().toUpperCase();
      if (explicit === "CANCELLED") return false; // important: don't show cancelled in these buckets

      const status = getEventStatus(
        e.event_date,
        e.event_time_in,
        e.event_time_out
      );
      if (eventFilter === "FINISHED") return status === "FINISHED";
      if (eventFilter === "STARTING") return status === "STARTING";
      if (eventFilter === "AVAILABLE") return status === "AVAILABLE";
      return true;
    });
  };

  const filteredEvents = applyEventFilter(
    localEvents.filter((event) => {
      const txt = `${event.event_name} ${event.event_venue} ${event.event_category}`.toLowerCase();
      return txt.includes(search.toLowerCase());
    })
  );

  // Banner Styles
  const statusStyles = {
    FINISHED: {
      backgroundColor: "#e53935",
      color: "#fff",
      padding: "6px 10px",
      fontWeight: "700",
      borderRadius: "6px",
      marginBottom: "10px",
      textAlign: "center",
    },
    STARTING: {
      backgroundColor: "#fb8c00",
      color: "#fff",
      padding: "6px 10px",
      fontWeight: "700",
      borderRadius: "6px",
      marginBottom: "10px",
      textAlign: "center",
    },
    AVAILABLE: {
      backgroundColor: "#1e88e5",
      color: "#fff",
      padding: "6px 10px",
      fontWeight: "700",
      borderRadius: "6px",
      marginBottom: "10px",
      textAlign: "center",
    },
    CANCELLED: {
      backgroundColor: "#9e9e9e",
      color: "#fff",
      padding: "6px 10px",
      fontWeight: "700",
      borderRadius: "6px",
      marginBottom: "10px",
      textAlign: "center",
    },
  };

  return (
    <div className="eventlist-page">
      <Link to="/home" className="eventlist-back">
        Back to home
      </Link>
      <h1 className="eventlist-title fade-in">Your Events</h1>

      <div
        className="search-bar-container fade-in"
        style={{ marginBottom: "18px" }}
      >
        <input
          type="text"
          className="ticket-search-input"
          placeholder="Search events by name, venue, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* FILTER BUTTONS - added below search */}
      <div className="filter-buttons" style={{ marginBottom: 30 }}>
        <button
          className={`filter-btn ${
            eventFilter === "ALL" ? "active-filter" : ""
          }`}
          onClick={() => setEventFilter("ALL")}
        >
          All Events
        </button>

        <button
          className={`filter-btn ${
            eventFilter === "AVAILABLE" ? "active-filter" : ""
          }`}
          onClick={() => setEventFilter("AVAILABLE")}
        >
          Available
        </button>

        <button
          className={`filter-btn ${
            eventFilter === "STARTING" ? "active-filter" : ""
          }`}
          onClick={() => setEventFilter("STARTING")}
        >
          Starting
        </button>

        <button
          className={`filter-btn ${
            eventFilter === "FINISHED" ? "active-filter" : ""
          }`}
          onClick={() => setEventFilter("FINISHED")}
        >
          Finished
        </button>

        {/* NEW: show cancelled events explicitly */}
        <button
          className={`filter-btn ${
            eventFilter === "CANCELLED" ? "active-filter" : ""
          }`}
          onClick={() => setEventFilter("CANCELLED")}
        >
          Cancelled
        </button>
      </div>

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
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state">
            <p>No events match your search.</p>
            <span>Try adjusting your keywords</span>
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            const explicitStatus = (event.event_status ?? "")
              .toString()
              .toUpperCase();
            const derivedStatus = getEventStatus(
              event.event_date,
              event.event_time_in,
              event.event_time_out
            );
            const status =
              explicitStatus === "CANCELLED" ? "CANCELLED" : derivedStatus;
            const style = statusStyles[status];

            const tb =
              ticketsByEvent[Number(event.id)] ?? {
                regular: [],
                vip: [],
                raw: [],
              };
            const regCount = tb.regular.length;
            const vipCount = tb.vip.length;
            const totalCount = tb.raw.length;

            return (
              <div
                key={event.id}
                className="eventlist-card fade-in"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div style={style}>
                  {status === "FINISHED"
                    ? "EVENT FINISHED"
                    : status === "STARTING"
                    ? "EVENT IS STARTING"
                    : status === "CANCELLED"
                    ? "EVENT CANCELLED"
                    : "EVENT AVAILABLE"}
                </div>

                <div className="card-header">
                  <h2 className="event-title">{event.event_name}</h2>
                  <span className="event-category-badge">
                    {event.event_category}
                  </span>
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
                    <span className="detail-value">
                      {formatTo12Hour(event.event_time_in)} –{" "}
                      {formatTo12Hour(event.event_time_out)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">💰 Price</span>
                    <span className="detail-value">
                      <span className="price-regular">
                        {formatPrice(event.ticket_price_standard)} Regular
                      </span>
                      <span
                        className="price-vip"
                        style={{ marginLeft: 8 }}
                      >
                        {formatPrice(event.ticket_price_vip)} VIP
                      </span>
                    </span>
                  </div>
                  {event.event_description && (
                    <div className="detail-row description">
                      <span className="detail-label">📝 About</span>
                      <span className="detail-value">
                        {event.event_description}
                      </span>
                    </div>
                  )}
                </div>

                <div className="eventlist-actions">
                  <button
                    className="view-breakdown-btn"
                    onClick={() => toggleBreakdown(event.id)}
                    aria-expanded={openBreakdownId === event.id}
                  >
                    {openBreakdownId === event.id
                      ? "Hide breakdown"
                      : "View breakdown"}
                    <span
                      className="ticket-count"
                      style={{ pointerEvents: "none", marginLeft: 8 }}
                    >
                      {totalCount}
                    </span>
                  </button>

                  <button
                    className="view-breakdown-btn"
                    style={{ marginTop: 10 }}
                    onClick={() => openAttendees(event.id)}
                  >
                    View Attendees
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
                        <span className="summary-value regular">
                          {regCount}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">VIP</span>
                        <span className="summary-value vip">
                          {vipCount}
                        </span>
                      </div>
                    </div>

                    <div className="breakdown-list">
                      {tb.raw.length === 0 ? (
                        <div className="no-tickets">
                          No tickets created for this event.
                        </div>
                      ) : (
                        <>
                          <div className="ticket-header">
                            <div className="ticket-cell">ID</div>
                            <div className="ticket-cell">Type</div>
                            <div className="ticket-cell">Price</div>
                            <div className="ticket-cell">Status</div>
                          </div>
                          {tb.raw.map((t) => {
                            const id = ticketGetId(t) ?? "(no id)";
                            const type = t.ticketType ?? t.type ?? "Unknown";
                            const price = formatPrice(
                              t.ticketPrice ?? t.ticket_price ?? t.price ?? 0
                            );
                            const availability =
                              t.available || t.availability
                                ? "Available"
                                : "Sold";

                            return (
                              <div key={id} className="ticket-row">
                                <div className="ticket-cell ticket-id">
                                  {id}
                                </div>
                                <div className="ticket-cell ticket-type">
                                  {type}
                                </div>
                                <div className="ticket-cell ticket-price">
                                  {price}
                                </div>
                                <div
                                  className={`ticket-cell availability-${availability.toLowerCase()}`}
                                >
                                  {availability}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>

                    <div className="breakdown-actions">
                      <button
                        className="secondary-btn"
                        onClick={() => {
                          if (status !== "STARTING") handleEdit(event);
                        }}
                        disabled={
                          status === "STARTING" || status === "CANCELLED"
                        }
                        title={
                          status === "STARTING"
                            ? "Cannot edit while event is happening"
                            : status === "CANCELLED"
                            ? "Cannot edit a cancelled event"
                            : "Edit Event"
                        }
                        style={
                          status === "STARTING" || status === "CANCELLED"
                            ? { opacity: 0.5, cursor: "not-allowed" }
                            : {}
                        }
                      >
                        ✏ Edit
                      </button>

                      <button
                        className="icon-btn danger"
                        onClick={() => {
                          if (
                            status !== "STARTING" &&
                            status !== "CANCELLED"
                          )
                            confirmDelete(event);
                        }}
                        disabled={
                          status === "STARTING" || status === "CANCELLED"
                        }
                        title={
                          status === "STARTING"
                            ? "Cannot delete an event that is currently happening"
                            : status === "CANCELLED"
                            ? "Event already cancelled"
                            : "Delete event"
                        }
                        style={
                          status === "STARTING" || status === "CANCELLED"
                            ? { opacity: 0.5, cursor: "not-allowed" }
                            : {}
                        }
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

      {/* Attendees Modal */}
      {attendeesModal.show && (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <div className="modal-header-row">
              <h2>Attendees</h2>
              <button
                className="close-btn"
                onClick={() =>
                  setAttendeesModal((prev) => ({ ...prev, show: false }))
                }
              >
                ✕
              </button>
            </div>

            {attendeesModal.list.length === 0 ? (
              <p style={{ marginTop: 10 }}>No attendees yet for this event.</p>
            ) : (
              attendeesModal.list.map((a) => {
                const paymentId = a.paymentId ?? a.id;
                return (
                  <div key={paymentId} className="attendee-row">
                    <div>
                      <strong>Gmail:</strong> {a.user?.emailAddress}
                    </div>
                    <div>
                      <strong>Username:</strong> {a.user?.fullname}
                    </div>
                    <div>
                      <strong>Status:</strong>{" "}
                      {(a.attendee_status ?? "NONE").toString()}
                    </div>

                    <div className="attendee-actions">
                      <button
                        className="btn-approve"
                        onClick={() => approve(paymentId)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-decline"
                        onClick={() => decline(paymentId)}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <Modal
        open={showDeleteModal}
        title={deleteWillCancel ? "Cancel Event" : "Delete Event"}
        message={
          deleteTarget
            ? deleteWillCancel
              ? `This event has purchased tickets — deleting will CANCEL the event and attempt refunds for buyers. Proceed?`
              : `Delete "${deleteTarget.event_name}"? This will permanently remove the event.`
            : ""
        }
        showCancel={true}
        confirmText={
          deleting ? (
            <span>
              <span className="delete-loading-spinner" /> Deleting…
            </span>
          ) : (
            "Delete"
          )
        }
        cancelText="Cancel"
        onConfirm={deleting ? null : deleteEvent}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}

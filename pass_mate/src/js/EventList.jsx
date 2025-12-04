// src/js/EventList.jsx
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

  // current user id stored after login
  const userId = Number(localStorage.getItem("userId") || 0);

  const mapServerEvent = (srv) => ({
    id: srv.eventId ?? srv.id,
    event_name: srv.eventName ?? srv.event_name,
    event_venue: srv.eventVenue ?? srv.event_venue,
    event_category: srv.eventCategory ?? srv.event_category,
    event_date: srv.eventStartTime ? String(srv.eventStartTime).split("T")[0] : (srv.event_date || ""),
    event_time_in: srv.eventStartTime ? String(srv.eventStartTime).split("T")[1]?.slice(0,5) : (srv.event_time_in || ""),
    event_time_out: srv.eventEndTime ? String(srv.eventEndTime).split("T")[1]?.slice(0,5) : (srv.event_time_out || ""),
    ticket_price: srv.ticketPrice ?? srv.ticket_price ?? 0,
    ticket_limit: srv.ticketLimit ?? srv.ticket_limit ?? 0,
    event_description: srv.eventDescription ?? srv.event_description ?? "",
    serverUser: srv.user ?? srv.createdBy ?? null
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8080/api/events/all");
      const data = Array.isArray(res.data) ? res.data : [];
      const mapped = data.map(mapServerEvent);

      // Filter events created by current user
      const mine = mapped.filter(e => {
        // if server returned nested user object with userId
        if (e.serverUser && typeof e.serverUser === "object" && e.serverUser.userId) {
          return Number(e.serverUser.userId) === userId;
        }
        // fallback: server returned createdBy string -> compare to stored userFullname or userEmail
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
      console.error("Failed to fetch events:", err);
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      setError("Not logged in");
      setLoading(false);
      return;
    }
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // If navigated here with a createdEvent, prepend it (only if belongs to current user)
  useEffect(() => {
    const created = location.state?.createdEvent;
    if (created) {
      const mapped = mapServerEvent(created);
      let belongs = false;
      if (mapped.serverUser && typeof mapped.serverUser === "object" && mapped.serverUser.userId) {
        belongs = Number(mapped.serverUser.userId) === userId;
      } else {
        const full = (localStorage.getItem("userFullname") || "").toLowerCase();
        const email = (localStorage.getItem("userEmail") || "").toLowerCase();
        if (typeof mapped.serverUser === "string") {
          const s = mapped.serverUser.toLowerCase();
          belongs = (full && s.includes(full)) || (email && s.includes(email));
        }
      }

      if (belongs) {
        setLocalEvents(prev => {
          if (prev.some(e => e.id === mapped.id)) return prev;
          return [mapped, ...prev];
        });
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handleEdit = (event) => {
    navigate(`/edit-event/${event.id}`, { state: { event } });
  };

  const confirmDelete = (event) => {
    setDeleteTarget(event);
    setShowDeleteModal(true);
  };

  const deleteEvent = async () => {
    try {
      // Call Spring Boot delete endpoint
      await axios.delete(`http://localhost:8080/api/events/delete/${deleteTarget.id}`);

      // Remove from UI
      setLocalEvents(prev => prev.filter(e => e.id !== deleteTarget.id));

      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete event. Check server console.");
    }
  };

  return (
    <div className="eventlist-page">
      <Link to="/home" className="eventlist-back">Back to home</Link>
      <h1 className="eventlist-title fade-in">Your Events</h1>

      <div className="eventlist-wrapper fade-in">
        {loading ? (
          <p>Loading events…</p>
        ) : error ? (
          <p style={{ color: "red" }}>Error: {String(error)}</p>
        ) : localEvents.length === 0 ? (
          <p className="no-events">No events created yet.</p>
        ) : (
          localEvents.map((event, index) => (
            <div key={event.id} className="eventlist-card fade-in" style={{ animationDelay: `${0.2 * (index + 1)}s` }}>
              <h2 className="event-title">{event.event_name}</h2>

              <div className="event-details-box">
                <p><strong>Venue:</strong> {event.event_venue}</p>
                <p><strong>Category:</strong> {event.event_category}</p>
                <p><strong>Date:</strong> {event.event_date}</p>
                <p><strong>Time:</strong> {event.event_time_in} – {event.event_time_out}</p>
                <p><strong>Price:</strong> ₱{event.ticket_price}</p>
                <p><strong>Ticket Limit:</strong> {event.ticket_limit}</p>
                <p><strong>Description:</strong> {event.event_description}</p>
              </div>

              <div className="eventlist-actions">
                <button className="edit-btn" onClick={() => handleEdit(event)}>Edit</button>
                <button className="delete-btn" onClick={() => confirmDelete(event)}>Delete</button>
              </div>
            </div>
          ))
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

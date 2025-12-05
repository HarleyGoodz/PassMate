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
 
  const userId = Number(localStorage.getItem("userId") || 0);
 
  // group tickets based on eventId -> {regular:[], vip:[]}
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
 
  // maps server event to UI shape
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
 
  // fetch events + tickets and merge so we can show VIP/Regular prices like EventDetails
  const fetchEvents = async () => {
    setLoading(true);
    try {
      // fetch both in parallel
      const [eventsRes, ticketsRes] = await Promise.all([
        axios.get("http://localhost:8080/api/events/all", { withCredentials: true }),
        axios.get("http://localhost:8080/api/ticket/all", { withCredentials: true }),
      ]);
 
      const eventsData = Array.isArray(eventsRes.data) ? eventsRes.data : [];
      const ticketsData = Array.isArray(ticketsRes.data) ? ticketsRes.data : [];
 
      const ticketsByEvent = groupTicketsByEvent(ticketsData);
 
      const mapped = eventsData.map((srv) => {
        const base = mapServerEvent(srv);
        const tb = ticketsByEvent[Number(base.id)];
 
        if (tb) {
          // pick first ticket's price for each tier (same as EventDetails)
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
 
      // filter events to those created by current user (same logic you used)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  const handleEdit = (event) => {
    navigate(`/edit-event/${event.id}`, { state: { event } });
  };
 
  const confirmDelete = (event) => {
    setDeleteTarget(event);
    setShowDeleteModal(true);
  };
 
  // Helper: get ticket id from ticket object - adapt if your ticket id field differs
  const ticketGetId = (ticket) => ticket.ticketId ?? ticket.id ?? ticket.ticket_id ?? ticket._id;
 
  // FRONTEND-only delete flow:
  // 1) fetch tickets (from /api/ticket/all), filter those for the event
  // 2) delete each ticket by calling the ticket delete endpoint
  // 3) once all ticket deletes succeed, call event delete endpoint
  //
  // IMPORTANT: this assumes you have `DELETE /api/ticket/delete/{id}` on the backend.
  // If your endpoint path or parameter name is different, change the `axios.delete` URL below.
  const deleteEvent = async () => {
    if (!deleteTarget) return;
    try {
      // 1) fetch all tickets
      const ticketsRes = await axios.get("http://localhost:8080/api/ticket/all", { withCredentials: true });
      const ticketsData = Array.isArray(ticketsRes.data) ? ticketsRes.data : [];
 
      // 2) filter tickets that belong to this event
      const ticketsForEvent = ticketsData.filter((t) => {
        const eid = t.event?.eventId ?? t.event?.id ?? t.eventId ?? t.event_id;
        return Number(eid) === Number(deleteTarget.id);
      });
 
      // 3) delete tickets (if any)
      if (ticketsForEvent.length > 0) {
        // build array of delete promises
        const deletePromises = ticketsForEvent.map((t) => {
          const tid = ticketGetId(t);
          if (!tid) {
            // if ticket has no id we cannot delete it; return a resolved promise to continue
            return Promise.resolve();
          }
          // ======== CHANGE THIS PATH IF YOUR TICKET DELETE ENDPOINT IS DIFFERENT =========
          // example assumed: DELETE /api/ticket/delete/{id}
          return axios.delete(`http://localhost:8080/api/ticket/delete/${tid}`, { withCredentials: true });
          // =================================================================================
        });
 
        // run all deletes in parallel and wait
        await Promise.all(deletePromises);
      }
 
      // 4) finally delete the event
      const res = await axios.delete(`http://localhost:8080/api/events/delete/${deleteTarget.id}`, { withCredentials: true });
 
      if (res.status >= 200 && res.status < 300) {
        setLocalEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
        setShowDeleteModal(false);
        setDeleteTarget(null);
      } else {
        // show server response
        const msg = res.data ?? `Delete returned ${res.status}`;
        alert("Failed to delete event: " + JSON.stringify(msg, null, 2));
      }
    } catch (err) {
      console.error("Delete failed:", err);
      // Friendly extraction of server message
      let msg = "Failed to delete event.";
      if (err.response) {
        if (typeof err.response.data === "string") msg = err.response.data;
        else if (err.response.data?.message) msg = err.response.data.message;
        else msg = JSON.stringify(err.response.data, null, 2);
      } else msg = err.message;
      alert(msg);
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
            <div
              key={event.id}
              className="eventlist-card fade-in"
              style={{ animationDelay: `${0.2 * (index + 1)}s` }}
            >
              <h2 className="event-title">{event.event_name}</h2>
 
              <div className="event-details-box">
                <p><strong>Venue:</strong> {event.event_venue}</p>
                <p><strong>Category:</strong> {event.event_category}</p>
                <p><strong>Date:</strong> {event.event_date}</p>
                <p><strong>Time:</strong> {event.event_time_in} – {event.event_time_out}</p>
 
                {/* Price Display - Matches EventDetails */}
                <p>
                  <strong>Price:</strong>{" "}
                  Regular {formatPrice(event.ticket_price_standard)} / VIP {formatPrice(event.ticket_price_vip)}
                </p>
 
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
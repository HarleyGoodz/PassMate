// EditEvent.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../css/edit_event_style.css";
import Modal from "../Modal";

export default function EditEvent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const eventData = location.state?.event; // If navigated from EventList

  const [event, setEvent] = useState({
    id: "",
    event_name: "",
    event_venue: "",
    event_category: "",
    event_date: "",
    event_time_in: "",
    event_time_out: "",
    ticket_limit: "",
    event_description: "",
    // ticket fields we'll show/edit
    regular_price: "",
    regular_limit: 0,
    vip_price: "",
    vip_limit: 0
  });

  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [tickets, setTickets] = useState([]); // all tickets for this event

  // Helper: map server LocalDateTime strings to form date/time
  const parseDateTime = (ld) => {
    if (!ld) return { date: "", time: "" };
    const s = String(ld);
    const [datePart, timePart = ""] = s.split("T");
    return { date: datePart, time: (timePart || "").slice(0, 5) };
  };

  // Load from state (fast)
  const loadFromState = (e) => {
    setEvent((prev) => ({
      ...prev,
      id: e.id,
      event_name: e.event_name || e.eventName || "",
      event_venue: e.event_venue || e.eventVenue || "",
      event_category: e.event_category || e.eventCategory || "",
      event_date: e.event_date || e.eventStartTime?.split("T")[0] || "",
      event_time_in: e.event_time_in || e.eventStartTime?.split("T")[1]?.slice(0,5) || "",
      event_time_out: e.event_time_out || e.eventEndTime?.split("T")[1]?.slice(0,5) || "",
      ticket_limit: e.ticket_limit ?? e.ticketLimit ?? 0,
      event_description: e.event_description || e.eventDescription || ""
    }));
  };

  // Fetch event from backend and tickets
  const fetchFromBackend = async () => {
    try {
      // 1) fetch event
      const res = await axios.get(`http://localhost:8080/api/events/${id}`);
      const d = res.data;
      const start = d.eventStartTime || "";
      const end = d.eventEndTime || "";
      const date = start ? String(start).split("T")[0] : "";

      setEvent((prev) => ({
        ...prev,
        id: d.eventId,
        event_name: d.eventName || "",
        event_venue: d.eventVenue || "",
        event_category: d.eventCategory || "",
        event_date: date,
        event_time_in: start ? String(start).split("T")[1]?.slice(0,5) : "",
        event_time_out: end ? String(end).split("T")[1]?.slice(0,5) : "",
        ticket_limit: d.ticketLimit ?? 0,
        event_description: d.eventDescription ?? ""
      }));
    } catch (err) {
      console.error("Failed to load event:", err);
      alert("Error loading event.");
    }
  };

  // Fetch tickets for this event and set regular/vip fields
  const loadTicketsForEvent = async (eventId) => {
    try {
      const tres = await axios.get("http://localhost:8080/api/ticket/all");
      const all = Array.isArray(tres.data) ? tres.data : [];
      // filter tickets belonging to this event
      const forEvent = all.filter(t => {
        try {
          return t.event && (t.event.eventId === eventId || t.event.id === eventId);
        } catch (e) {
          return false;
        }
      });

      setTickets(forEvent);

      const regular = forEvent.filter(t => String(t.ticketType).toLowerCase() === "regular");
      const vip = forEvent.filter(t => String(t.ticketType).toLowerCase() === "vip");

      setEvent(prev => ({
        ...prev,
        regular_limit: regular.length,
        vip_limit: vip.length,
        regular_price: regular.length > 0 ? regular[0].ticketPrice : prev.regular_price,
        vip_price: vip.length > 0 ? vip[0].ticketPrice : prev.vip_price
      }));
    } catch (err) {
      console.error("Failed to load tickets:", err);
      // not fatal — we just won't prefill ticket fields
    }
  };

  // Initial load sequence
  useEffect(() => {
    (async () => {
      setLoading(true);
      if (eventData) {
        // eventData may be in frontend shape or server shape; load form and tickets
        loadFromState(eventData);
        const eventId = eventData.id ?? eventData.eventId;
        await loadTicketsForEvent(Number(eventId));
        setLoading(false);
        return;
      }

      // else, fetch from backend
      try {
        await fetchFromBackend();
        // after event is loaded, get its id and load tickets
        const eventId = Number(id);
        await loadTicketsForEvent(eventId);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // force numbers where needed
    if (name === "regular_limit" || name === "vip_limit" || name === "ticket_limit") {
      setEvent(prev => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    } else if (name === "regular_price" || name === "vip_price") {
      setEvent(prev => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    } else {
      setEvent(prev => ({ ...prev, [name]: value }));
    }
  };

  // Save changes: update event and adjust tickets (create/delete/update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      // build start/end ISO strings
      const start = `${event.event_date}T${event.event_time_in}:00`;
      const end = `${event.event_date}T${event.event_time_out}:00`;

      const updatePayload = {
        eventName: event.event_name,
        eventVenue: event.event_venue,
        eventCategory: event.event_category,
        eventDescription: event.event_description,
        ticketLimit: Number(event.ticket_limit || (Number(event.regular_limit || 0) + Number(event.vip_limit || 0))),
        eventStartTime: start,
        eventEndTime: end
      };

      // 1) update event
      await axios.put(
        `http://localhost:8080/api/events/update/${event.id}`,
        updatePayload,
        { headers: { "Content-Type": "application/json" } }
      );

      // 2) tickets handling
      // fetch latest tickets again (in case concurrent changes)
      const tres = await axios.get("http://localhost:8080/api/ticket/all");
      const all = Array.isArray(tres.data) ? tres.data : [];
      const forEvent = all.filter(t => t.event && (t.event.eventId === event.id || t.event.id === event.id));

      // categorize
      const regularTickets = forEvent.filter(t => String(t.ticketType).toLowerCase() === "regular");
      const vipTickets = forEvent.filter(t => String(t.ticketType).toLowerCase() === "vip");

      // Regular tickets: update price, add/remove to match regular_limit
      const desiredRegular = Number(event.regular_limit || 0);
      const currentRegular = regularTickets.length;
      const regularPrice = event.regular_price != null ? Number(event.regular_price) : null;

      // If price changed (or provided), update all existing regular tickets
      if (regularPrice != null) {
        await Promise.all(regularTickets.map(t => {
          const payload = {
            event: { eventId: event.id },
            ticketPrice: regularPrice,
            ticketType: "Regular",
            availability: t.availability ?? true
          };
          return axios.put(`http://localhost:8080/api/ticket/update/${t.ticketId}`, payload, { headers: { "Content-Type": "application/json" } });
        }));
      }

      // If need to add regular tickets
      if (desiredRegular > currentRegular) {
        const toAdd = desiredRegular - currentRegular;
        const creates = [];
        for (let i=0;i<toAdd;i++) {
          const payload = {
            event: { eventId: event.id },
            ticketPrice: regularPrice ?? 0,
            ticketType: "Regular",
            availability: true
          };
          creates.push(axios.post("http://localhost:8080/api/ticket/add", payload, { headers: { "Content-Type": "application/json" } }));
        }
        await Promise.all(creates);
      } else if (desiredRegular < currentRegular) {
        // delete extra regular tickets (delete the last ones)
        const toRemove = currentRegular - desiredRegular;
        const removeCandidates = regularTickets.slice(-toRemove);
        await Promise.all(removeCandidates.map(t => axios.delete(`http://localhost:8080/api/ticket/delete/${t.ticketId}`)));
      }

      // VIP tickets: similar flow
      const desiredVip = Number(event.vip_limit || 0);
      const currentVip = vipTickets.length;
      const vipPrice = event.vip_price != null ? Number(event.vip_price) : null;

      if (vipPrice != null) {
        await Promise.all(vipTickets.map(t => {
          const payload = {
            event: { eventId: event.id },
            ticketPrice: vipPrice,
            ticketType: "VIP",
            availability: t.availability ?? true
          };
          return axios.put(`http://localhost:8080/api/ticket/update/${t.ticketId}`, payload, { headers: { "Content-Type": "application/json" } });
        }));
      }

      if (desiredVip > currentVip) {
        const toAdd = desiredVip - currentVip;
        const creates = [];
        for (let i=0;i<toAdd;i++) {
          const payload = {
            event: { eventId: event.id },
            ticketPrice: vipPrice ?? 0,
            ticketType: "VIP",
            availability: true
          };
          creates.push(axios.post("http://localhost:8080/api/ticket/add", payload, { headers: { "Content-Type": "application/json" } }));
        }
        await Promise.all(creates);
      } else if (desiredVip < currentVip) {
        const toRemove = currentVip - desiredVip;
        const removeCandidates = vipTickets.slice(-toRemove);
        await Promise.all(removeCandidates.map(t => axios.delete(`http://localhost:8080/api/ticket/delete/${t.ticketId}`)));
      }

      // success:
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Could not update event or tickets. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    navigate("/events");
  };

  if (loading) return <p>Loading event...</p>;

  return (
    <div className="edit-event-wrapper">
      <div className="back-btn-container fade-in delay-1">
        <Link to="/events" className="eventlist-back">
          Back to Events
        </Link>
      </div>

      <h1 className="title fade-in delay-2">Edit Event</h1>

      <form className="form-grid fade-in delay-3" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Event Name</label>
          <input name="event_name" value={event.event_name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Event Date</label>
          <input type="date" name="event_date" value={event.event_date} onChange={handleChange} required />
        </div>

        <div className="form-group small">
          <label>Start Time</label>
          <input type="time" name="event_time_in" value={event.event_time_in} onChange={handleChange} required />
        </div>

        <div className="form-group small">
          <label>End Time</label>
          <input type="time" name="event_time_out" value={event.event_time_out} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Event Venue</label>
          <input name="event_venue" value={event.event_venue} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Category</label>
          <input name="event_category" value={event.event_category} onChange={handleChange} />
        </div>

        {/* REGULAR */}
        <div className="form-group">
          <label>Regular Ticket Price</label>
          <input type="number" step="0.01" name="regular_price" value={event.regular_price} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Regular Ticket Limit</label>
          <input type="number" name="regular_limit" value={event.regular_limit} onChange={handleChange} />
        </div>

        {/* VIP */}
        <div className="form-group">
          <label>VIP Ticket Price</label>
          <input type="number" step="0.01" name="vip_price" value={event.vip_price} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>VIP Ticket Limit</label>
          <input type="number" name="vip_limit" value={event.vip_limit} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Ticket Limit (total)</label>
          <input type="number" name="ticket_limit" value={event.ticket_limit} onChange={handleChange} />
        </div>

        <div className="description">
          <label>Description</label>
          <textarea name="event_description" rows="4" value={event.event_description} onChange={handleChange} />
        </div>

        <div className="action-buttons">
          <button type="submit" className="btn-save" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</button>
          <button type="button" className="btn-cancel" onClick={() => navigate("/events")}>Cancel</button>
        </div>
      </form>

      <Modal
        open={showSuccessModal}
        title="Event Updated"
        message="Your changes have been saved successfully."
        confirmText="OK"
        onConfirm={closeSuccessModal}
      />
    </div>
  );
}

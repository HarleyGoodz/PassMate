// Create_Event.jsx
import React, { useState } from "react";
import axios from "axios";
import "../css/edit_event_style.css";
import { Link, useNavigate } from "react-router-dom";

export default function CreateEvent() {
  const navigate = useNavigate();

  // GET LOGGED-IN USER ID
  const userId = Number(localStorage.getItem("userId") || 0);

  const [event, setEvent] = useState({
    event_name: "",
    event_date: "",
    event_time_in: "",
    event_time_out: "",
    event_venue: "",
    event_category: "",
    event_description: "",
    regular_price: "",
    vip_price: "",
    regular_limit: "",
    vip_limit: "",
  });

  const handleChange = (e) => {
    setEvent({ ...event, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const regularLimit = Number(event.regular_limit) || 0;
    const vipLimit = Number(event.vip_limit) || 0;
    const regularPrice = Number(event.regular_price) || null;
    const vipPrice = Number(event.vip_price) || null;

    const totalLimit = regularLimit + vipLimit;

    // ✅ Validate required fields
const requiredFields = [
  "event_name",
  "event_date",
  "event_time_in",
  "event_time_out",
  "event_venue",
  "event_category",
  "event_description",
  "regular_price",
  "vip_price",
  "regular_limit",
  "vip_limit",
];

for (const field of requiredFields) {
  if (!event[field] || String(event[field]).trim() === "") {
    alert("All fields must be filled!");
    return;
  }
}

// ✅ Ticket price validation
if (regularPrice !== null && regularPrice <= 0) {
  alert("Regular ticket price must be greater than 0.");
  return;
}

if (vipPrice !== null && vipPrice <= 0) {
  alert("VIP ticket price must be greater than 0.");
  return;
}

// ✅ Ticket limit validation
if (regularLimit <= 0) {
  alert("Regular ticket limit must be greater than 0.");
  return;
}

if (vipLimit <= 0) {
  alert("VIP ticket limit must be greater than 0.");
  return;
}

if (totalLimit <= 0) {
  alert("Total ticket limit must be greater than 0.");
  return;
}
    if (!event.event_description.trim()) {
      alert("Description is required!");
      return;
    }

    if (!userId) {
      alert("You are not logged in!");
      return;
    }

    // ⏰ Prevent creating events in the past (Asia/Manila time)
    const nowInManila = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
    );

    if (!event.event_date || !event.event_time_in) {
      alert("Please select event date and start time.");
      return;
    }

    const eventStartDate = new Date(`${event.event_date}T${event.event_time_in}:00`);

    if (eventStartDate < nowInManila) {
      alert("You cannot create an event that is scheduled before the current Manila date/time.");
      return;
    }

    // ⏰ Validate Start-End Time Logic
    if (event.event_time_in && event.event_time_out) {
      const startTimeValue = new Date(`${event.event_date}T${event.event_time_in}:00`);
      const endTimeValue = new Date(`${event.event_date}T${event.event_time_out}:00`);

      if (endTimeValue <= startTimeValue) {
        alert("End time must be later than the start time.");
        return;
      }
    }

    const start =
      event.event_date && event.event_time_in
        ? `${event.event_date}T${event.event_time_in}:00`
        : null;

    const end =
      event.event_date && event.event_time_out
        ? `${event.event_date}T${event.event_time_out}:00`
        : null;


    const eventPayload = {
      userId: userId,
      eventName: event.event_name,
      eventDescription: event.event_description,
      eventVenue: event.event_venue,
      eventStartTime: start,
      eventEndTime: end,
      eventCategory: event.event_category,
      ticketLimit: totalLimit,
    };

    try {
      const eventRes = await axios.post(
        "http://localhost:8080/api/events/add",
        eventPayload,
        { headers: { "Content-Type": "application/json" } }
      );

      const createdEvent = eventRes.data;
      const eventId = createdEvent.eventId;

      const ticketRequests = [];

      if (regularPrice !== null && regularLimit > 0) {
        for (let i = 0; i < regularLimit; i++) {
          ticketRequests.push(
            axios.post("http://localhost:8080/api/ticket/add", {
              event: { eventId },
              ticketPrice: regularPrice,
              ticketType: "Regular",
              availability: true,
            })
          );
        }
      }

      if (vipPrice !== null && vipLimit > 0) {
        for (let i = 0; i < vipLimit; i++) {
          ticketRequests.push(
            axios.post("http://localhost:8080/api/ticket/add", {
              event: { eventId },
              ticketPrice: vipPrice,
              ticketType: "VIP",
              availability: true,
            })
          );
        }
      }

      await Promise.all(ticketRequests);

      navigate("/events", { state: { createdEvent } });
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.response?.data || err.message));
    }
  };

  return (
    <div className="edit-event-wrapper">
      <div className="back-btn-container fade-in delay-1">
        <Link to="/home" className="eventlist-back">
          Back to Home
        </Link>
      </div>

      <h1 className="title fade-in delay-2">Create New Event</h1>

      <form className="form-grid fade-in delay-3" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Event Name</label>
          <input name="event_name" value={event.event_name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Event Date</label>
          <input type="date" name="event_date" value={event.event_date} onChange={handleChange} />
        </div>

        <div className="form-group small">
          <label>Start Time</label>
          <input type="time" name="event_time_in" value={event.event_time_in} onChange={handleChange} />
        </div>

        <div className="form-group small">
          <label>End Time</label>
          <input type="time" name="event_time_out" value={event.event_time_out} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Event Venue</label>
          <input name="event_venue" value={event.event_venue} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Category</label>
          <input name="event_category" value={event.event_category} onChange={handleChange} />
        </div>

        {/* REGULAR PRICE + LIMIT */}
        <div className="form-group">
          <label>Regular Ticket Price</label>
          <input type="number" name="regular_price" value={event.regular_price} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Regular Ticket Limit</label>
          <input type="number" name="regular_limit" value={event.regular_limit} onChange={handleChange} />
        </div>

        {/* VIP PRICE + LIMIT */}
        <div className="form-group">
          <label>VIP Ticket Price</label>
          <input type="number" name="vip_price" value={event.vip_price} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>VIP Ticket Limit</label>
          <input type="number" name="vip_limit" value={event.vip_limit} onChange={handleChange} />
        </div>

        {/* DESCRIPTION */}
        <div className="description">
          <label>Description</label>
          <textarea
            name="event_description"
            rows="4"
            value={event.event_description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="action-buttons">
          <button type="submit" className="btn-save">Create Event</button>
        </div>
      </form>
    </div>
  );
}

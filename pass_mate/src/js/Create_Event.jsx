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

    if (!userId) {
      alert("You are not logged in!");
      return;
    }

    const start =
      event.event_date && event.event_time_in
        ? `${event.event_date}T${event.event_time_in}:00`
        : null;

    const end =
      event.event_date && event.event_time_out
        ? `${event.event_date}T${event.event_time_out}:00`
        : null;

    // Extract limits and prices
    const regularLimit = Number(event.regular_limit) || 0;
    const vipLimit = Number(event.vip_limit) || 0;
    const regularPrice = Number(event.regular_price) || null;
    const vipPrice = Number(event.vip_price) || null;

    const totalLimit = regularLimit + vipLimit;

    // ✅ Use actual userId from session
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
      // 1️⃣ Create the event
      const eventRes = await axios.post(
        "http://localhost:8080/api/events/add",
        eventPayload,
        { headers: { "Content-Type": "application/json" } }
      );

      const createdEvent = eventRes.data;
      const eventId = createdEvent.eventId;

      const ticketRequests = [];

      // 2️⃣ Create Regular tickets
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

      // 3️⃣ Create VIP tickets
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

      // 4️⃣ Execute all ticket creations
      await Promise.all(ticketRequests);

      // Redirect with event data
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
          <textarea name="event_description" rows="4" value={event.event_description} onChange={handleChange} />
        </div>

        <div className="action-buttons">
          <button type="submit" className="btn-save">Create Event</button>
        </div>
      </form>
    </div>
  );
}

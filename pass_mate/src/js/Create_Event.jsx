import React, { useState } from "react";
import "../css/edit_event_style.css"; // reuse same style for perfect match
import { Link, useNavigate } from "react-router-dom";

export default function CreateEvent() {
  const navigate = useNavigate();

  const [event, setEvent] = useState({
    event_name: "",
    event_date: "",
    event_time_in: "",
    event_time_out: "",
    event_venue: "",
    event_category: "",
    ticket_price: "",
    ticket_limit: "",
    event_description: "",
  });

  const handleChange = (e) => {
    setEvent({ ...event, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/events"); // redirect after create (replace with API later)
  };

  return (
    <div className="edit-event-wrapper">

      {/* Back Button */}
      <div className="back-btn-container fade-in delay-1">
        <Link to="/home" className="back-btn">Back to home</Link>
      </div>

      {/* Title */}
      <h1 className="title fade-in delay-2">Create New Event</h1>

      {/* Form */}
      <form className="form-grid fade-in delay-3" onSubmit={handleSubmit}>

        <div className="form-group">
          <label>Event Name</label>
          <input
            name="event_name"
            value={event.event_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Event Date</label>
          <input
            type="date"
            name="event_date"
            value={event.event_date}
            onChange={handleChange}
          />
        </div>

        {/* Start / End Time */}
        <div className="form-group small">
          <label>Start Time</label>
          <input
            type="time"
            name="event_time_in"
            value={event.event_time_in}
            onChange={handleChange}
          />
        </div>

        <div className="form-group small">
          <label>End Time</label>
          <input
            type="time"
            name="event_time_out"
            value={event.event_time_out}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Event Venue</label>
          <input
            name="event_venue"
            value={event.event_venue}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <input
            name="event_category"
            value={event.event_category}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Ticket Price</label>
          <input
            type="number"
            name="ticket_price"
            value={event.ticket_price}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Ticket Limit</label>
          <input
            type="number"
            name="ticket_limit"
            value={event.ticket_limit}
            onChange={handleChange}
          />
        </div>

        {/* Description */}
        <div className="description">
          <label>Description</label>
          <textarea
            name="event_description"
            rows="4"
            value={event.event_description}
            onChange={handleChange}
          />
        </div>

        {/* Buttons */}
        <div className="action-buttons">
          <button type="submit" className="btn-save">Create Event</button>
        </div>
      </form>
    </div>
  );
}

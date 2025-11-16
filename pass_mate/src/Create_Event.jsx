import React, { useState } from "react";
import "./events_creates.css";
import { Link } from "react-router-dom";

export default function CreateEvent() {
  const [values, setValues] = useState({
    eventName: "",
    venue: "",
    category: "",
    ticketLimit: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    ticketPrice: "",
    description: ""
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setValues({
      ...values,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreate = () => {
    console.log("Creating Event:", values);
  };

  return (
    <div className="create-event-wrapper">

      {/* Back Button */}
      <div className="back-btn-container fade-in delay-1">
        <Link to="/Home" className="back-btn">← Back</Link>
      </div>

      {/* Title */}
      <h1 className="fade-in delay-2">Create New Event</h1>

      {/* MAIN TWO COLUMN LAYOUT */}
      <div className="event-layout fade-in delay-3">

        {/* LEFT COLUMN */}
        <div className="event-column left-col fade-in delay-3">

          <div className="form-group">
            <span className="field-title">Event Name</span>
            <input
              type="text"
              id="eventName"
              name="eventName"
              value={values.eventName}
              onChange={handleChange}
              placeholder="Enter event name"
              required
            />
          </div>

          <div className="form-group">
            <span className="field-title">Venue</span>
            <input
              type="text"
              id="venue"
              name="venue"
              value={values.venue}
              onChange={handleChange}
              placeholder="Enter event venue"
              required
            />
          </div>

          <div className="form-group">
            <span className="field-title">Category</span>
            <select
              id="category"
              name="category"
              value={values.category}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select a category</option>
              <option value="Concerts">Concerts</option>
              <option value="Sports">Sports</option>
              <option value="Seminars">Seminars</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div className="form-group">
            <span className="field-title">Ticket Limit</span>
            <input
              type="number"
              id="ticketLimit"
              name="ticketLimit"
              value={values.ticketLimit}
              onChange={handleChange}
              placeholder="Enter ticket limit"
              min="1"
              required
            />
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="event-column right-col fade-in delay-4">

          <div className="form-group">
            <span className="field-title">Event Date</span>
            <input
              type="date"
              id="eventDate"
              name="eventDate"
              value={values.eventDate}
              onChange={handleChange}
              min="2025-01-01"
              max="2026-12-31"
              required
            />
            <small className="note">Select a date between 2025 and 2026.</small>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <span className="field-title">Start Time</span>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={values.startTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group half">
              <span className="field-title">End Time</span>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={values.endTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <span className="field-title">Ticket Price</span>
            <input
              type="number"
              id="ticketPrice"
              name="ticketPrice"
              value={values.ticketPrice}
              onChange={handleChange}
              placeholder="₱ Enter price"
              step="0.01"
              required
            />
          </div>

        </div>
      </div>

      {/* DESCRIPTION FIELD */}
      <div className="description-section form-group fade-in delay-5">
        <span className="field-title">Description</span>
        <textarea
          id="description"
          name="description"
          value={values.description}
          onChange={handleChange}
          placeholder="Enter event description"
          required
        />
      </div>

      {/* BUTTON */}
      <div className="submit-center fade-in delay-5">
        <Link to="/event-created">
        <button className="btn-submit">Create Event</button>
        </Link>
      </div>

    </div>
  );
}

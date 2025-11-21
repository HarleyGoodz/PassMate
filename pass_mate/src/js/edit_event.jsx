// EditEvent.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../css/edit_event_style.css";
import Modal from "../Modal";

export default function EditEvent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const eventData = location.state?.event;

  const [event, setEvent] = useState({
    id: id || "",
    event_name: "",
    event_venue: "",
    event_category: "",
    event_date: "",
    event_time_in: "",
    event_time_out: "",
    ticket_price: "",
    ticket_limit: "",
    event_description: "",
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (eventData) setEvent(eventData);
  }, [eventData]);

  const handleChange = (e) => {
    setEvent((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuccessModal(true);
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    navigate("/events");
  };

  return (
    <div className="edit-event-wrapper">

      {/* Back Button */}
      <div className="back-btn-container fade-in delay-1">
        <button className="back-btn" onClick={() => navigate("/events")}>
          Back
        </button>
      </div>

      {/* Title */}
      <h1 className="title fade-in delay-2">Edit Event</h1>

      {/* FORM GRID */}
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

        <div className="form-group">
          <label>Ticket Price</label>
          <input type="number" name="ticket_price" value={event.ticket_price} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Ticket Limit</label>
          <input type="number" name="ticket_limit" value={event.ticket_limit} onChange={handleChange} />
        </div>

        {/* Description full width */}
        <div className="description">
          <label>Description</label>
          <textarea
            name="event_description"
            rows="4"
            value={event.event_description}
            onChange={handleChange}
          />
        </div>

        <div className="action-buttons">
          <button type="submit" className="btn-save">Save Changes</button>
          <button type="button" className="btn-cancel" onClick={() => navigate("/events")}>
            Cancel
          </button>
        </div>

      </form>

      {/* Modal */}
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

// EditEvent.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./edit_event_style.css";
import Modal from "./Modal"; 

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
    setShowSuccessModal(true); // show modal instead of alert()
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    navigate("/events");
  };

  const handleCancel = () => navigate("/events");

  return (
    <div className="edit-event-page">
      <div className="back-btn-container">
        <button className="back-btn" onClick={() => navigate("/events")}>
          ← Back
        </button>
      </div>

      <div className="container">
        <header><h1>Edit Event</h1></header>

        <form className="edit-form" onSubmit={handleSubmit}>
          {/* form unchanged */}
          <div className="form-group">
            <label>Event Name</label>
            <input name="event_name" value={event.event_name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Venue</label>
            <input name="event_venue" value={event.event_venue} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select name="event_category" value={event.event_category} onChange={handleChange} required>
              <option value="Concerts">Concerts</option>
              <option value="Sports">Sports</option>
              <option value="Seminars">Seminars</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date</label>
            <input type="date" name="event_date" value={event.event_date} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Start Time</label>
            <input type="time" name="event_time_in" value={event.event_time_in} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>End Time</label>
            <input type="time" name="event_time_out" value={event.event_time_out} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Ticket Price</label>
            <input type="number" name="ticket_price" value={event.ticket_price} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Ticket Limit</label>
            <input type="number" name="ticket_limit" value={event.ticket_limit} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="event_description" rows="4" value={event.event_description} onChange={handleChange} />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save">💾 Save Changes</button>
            <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      <Modal
        open={showSuccessModal}
        title="Event Updated"
        message="Your changes have been saved successfully."
        showCancel={false}
        confirmText="OK"
        onConfirm={closeSuccessModal}
        onClose={closeSuccessModal}
      />
    </div>
  );
}

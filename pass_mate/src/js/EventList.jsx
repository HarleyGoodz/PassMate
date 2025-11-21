import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/eventList.css";
import Modal from "../Modal";

export default function EventList({ events = [] }) {
  const navigate = useNavigate();
  const [localEvents, setLocalEvents] = useState(events);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleEdit = (event) => {
    navigate(`/edit-event/${event.id}`, { state: { event } });
  };

  const confirmDelete = (event) => {
    setDeleteTarget(event);
    setShowDeleteModal(true);
  };

  const deleteEvent = () => {
    setLocalEvents(prev => prev.filter(e => e.id !== deleteTarget.id));
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  return (
    <div className="eventlist-page">

      {/* Back button */}
      <Link to="/home" className="eventlist-back">Back to home</Link>

      {/* Title */}
      <h1 className="eventlist-title fade-in">Upcoming Events</h1>

      {/* Event Cards */}
      <div className="eventlist-wrapper fade-in">
        {localEvents.length === 0 ? (
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

      {/* Modal */}
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

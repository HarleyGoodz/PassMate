import React from "react";
import "./event_created_styles.css";  
import { Link } from "react-router-dom";

export default function EventCreated() {
  return (
    <div className="event-created-wrapper">
      <div className="confirm-container fade-in">
        <div className="success-icon">✓</div>

        <h2>You've successfully created an event!</h2>
        <p>Your event has been added to the organizer dashboard.</p>

        <div className="btn-group">
          <Link to="/home" className="btn back-btn">Go to Dashboard</Link>
          <Link to="/create-event" className="btn create-btn">Create Another</Link>
        </div>
      </div>
    </div>
  );
}

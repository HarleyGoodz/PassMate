import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Login from './Login';
import SignUp from './SignUp';
import App from './App';
import Home from './Home';
import EventDetails from './EventDetails'; // ✅ import your new component
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Example event data for testing
const sampleEvent = {
  id: 1,
  event_name: "Sample Event",
  event_venue: "Cebu City",
  event_date: "2025-11-20",
  event_time_in: "10:00 AM",
  event_time_out: "2:00 PM",
  ticket_price: 500,
  ticket_limit: 100,
  event_description: "This is a sample event description."
};

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/home" element={<Home user={{ isAuthenticated: false }} />} />
        <Route path="/app" element={<App />} />

        {/* Event details route */}
        <Route
          path="/event/:id"
          element={
            <EventDetails
              event={sampleEvent}          // ✅ pass your event data here
              soldOut={false}             // example boolean
              userHasTicket={false}       // example boolean
            />
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Login from './Login';
import SignUp from './SignUp';
import App from './App';
import Home from './Home';
import EventDetails from './EventDetails'; // ✅ import your new component
import BuyTicket from './buyTicket';
import reportWebVitals from './reportWebVitals';
import CreateEvent from './Create_Event';
import MyTickets from './MyTickets';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EventCreated from "./EventCreated";
import EventList from "./EventList";
import EditEvent from "./edit_event";


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
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/event/:id/buy" element={<BuyTicket />} />
        <Route path="/event-created" element={<EventCreated />} />
        <Route path="/edit-event/:id" element={<EditEvent />} />
        <Route
  path="/events"
  element={
    <EventList
      events={[
        {
          id: 1,
          event_name: "Sample Event",
          event_venue: "CIT-U",
          event_category: "Seminar",
          event_date: "2025-11-20",
          event_time_in: "10:00 AM",
          event_time_out: "2:00 PM",
          ticket_price: 500,
          ticket_limit: 100,
          event_description: "Sample description"
        }
      ]}
    />
  }
/>


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
              <Route
  path="/my-tickets"
  element={
    <MyTickets
      ticketsData={[
        // Example tickets for testing
        {
          id: 1,
          event: {
            event_name: "Sample Event 1",
            event_venue: "Cebu City",
            event_date: "2025-11-20",
            event_time_in: "10:00 AM",
            event_time_out: "2:00 PM",
            ticket_price: 500,
          },
        },
        {
          id: 2,
          event: {
            event_name: "Sample Event 2",
            event_venue: "Mandaue City",
            event_date: "2025-11-25",
            event_time_in: "1:00 PM",
            event_time_out: "5:00 PM",
            ticket_price: 750,
          },
        },
      ]}
    />
  }
/>

        
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();

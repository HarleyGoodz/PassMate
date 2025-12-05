// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Login from './js/Login';
import SignUp from './js/SignUp';
import App from './App';
import Home from './Home';
import EventDetails from './js/EventDetails';
import BuyTicket from './js/buyTicket';
import reportWebVitals from './reportWebVitals';
import CreateEvent from './js/Create_Event';
import MyTickets from './js/MyTickets';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EventCreated from "./EventCreated";
import EventList from "./js/EventList";
import EditEvent from "./js/edit_event";
import Profile from './js/Profile';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/home" element={<Home />} />
        <Route path="/app" element={<App />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/event/:id/buy" element={<BuyTicket />} />
        <Route path="/event-created" element={<EventCreated />} />
        <Route path="/edit-event/:id" element={<EditEvent />} />
        <Route path="/events" element={<EventList />} />
        <Route path="/event/:id" element={<EventDetails />} />
        <Route
          path="/my-tickets"
          element={<MyTickets ticketsData={[]} />}
        />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();

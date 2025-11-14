import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Login from './Login';
import App from './App';
import reportWebVitals from './reportWebVitals';
import SignUp from './SignUp';    
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
 
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* redirect root to /login */}
        <Route path="/" element={<Navigate to="/ Login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        {/* other routes */}
        <Route path="/app" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
 
reportWebVitals();
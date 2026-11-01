import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import RoomPage from './pages/RoomPage';
import api from './api';
import './App.css';

function ProtectedRoute({ user, children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // Verify auth on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      api
        .get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        });
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar user={user} onLogout={handleLogout} />
        <Routes>
          <Route
            path="/auth"
            element={
              user ? <Navigate to="/dashboard" replace /> : <AuthPage onAuthSuccess={setUser} />
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <DashboardPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/room/:roomId"
            element={
              <ProtectedRoute user={user}>
                <RoomPage currentUser={user} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}


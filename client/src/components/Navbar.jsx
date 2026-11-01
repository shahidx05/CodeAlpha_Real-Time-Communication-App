import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/auth');
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => navigate('/dashboard')}>
        <span className="brand-logo">📹</span>
        <span className="brand-title">WebRTC Collab</span>
      </div>
      {user && (
        <div className="nav-user">
          <span className="user-info">
            <strong>{user.name}</strong> ({user.email})
          </span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function DashboardPage({ user }) {
  const [createRoomName, setCreateRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [createdRoom, setCreatedRoom] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!createRoomName.trim()) return;

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await api.post('/rooms', { name: createRoomName.trim() });
      setCreatedRoom(res.data);
      setCreateRoomName('');
    } catch (err) {
      console.error('Failed to create room:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    const cleanId = joinRoomId.trim();
    if (!cleanId) return;

    setErrorMsg('');
    setLoading(true);

    try {
      // Verify room exists
      await api.get(`/rooms/${cleanId}`);
      navigate(`/room/${cleanId}`);
    } catch (err) {
      console.error('Room lookup failed:', err);
      setErrorMsg(err.response?.data?.error || 'Room not found. Check the ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyRoomLink = (roomId) => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name || 'User'}!</h1>
        <p>Start a new collaboration room or join an existing meeting.</p>
      </div>

      {errorMsg && <div className="error-banner">{errorMsg}</div>}

      <div className="dashboard-grid">
        {/* Create Room Card */}
        <div className="dash-card">
          <div className="dash-card-icon">➕</div>
          <h2>Create New Room</h2>
          <p>Generate a secure room for video conferencing, chat, and whiteboard.</p>

          <form onSubmit={handleCreateRoom} className="dash-form">
            <div className="form-group">
              <label>Room Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Project Sprint Sync"
                value={createRoomName}
                onChange={(e) => setCreateRoomName(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || !createRoomName.trim()}
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </form>

          {createdRoom && (
            <div className="created-room-box">
              <div className="created-room-header">
                <strong>Room Created Successfully!</strong>
              </div>
              <p className="created-room-info">
                Room Name: <strong>{createdRoom.name}</strong>
                <br />
                Room ID: <code>{createdRoom.roomId}</code>
              </p>
              <div className="created-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => copyRoomLink(createdRoom.roomId)}
                >
                  {copied ? '✅ Link Copied!' : '📋 Copy Room Link'}
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/room/${createdRoom.roomId}`)}
                >
                  🚀 Enter Room
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Join Room Card */}
        <div className="dash-card">
          <div className="dash-card-icon">🔗</div>
          <h2>Join a Room</h2>
          <p>Have an invitation? Enter the Room ID to connect instantly.</p>

          <form onSubmit={handleJoinRoom} className="dash-form">
            <div className="form-group">
              <label>Room ID</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. e4f7a19c"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || !joinRoomId.trim()}
            >
              {loading ? 'Connecting...' : 'Join Room'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


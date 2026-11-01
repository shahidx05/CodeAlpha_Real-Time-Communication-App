import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoGrid from '../components/VideoGrid';
import ControlBar from '../components/ControlBar';
import SidePanel from '../components/SidePanel';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function RoomPage({ currentUser }) {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [roomInfo, setRoomInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [socket, setSocket] = useState(null);
  const [copied, setCopied] = useState(false);

  // Initialize Socket connection with JWT token in auth handshake
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    const s = io(SOCKET_SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    s.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setErrorMsg('Real-time connection failed: ' + err.message);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [navigate]);

  // Fetch and verify room
  useEffect(() => {
    let active = true;
    async function fetchRoom() {
      try {
        const res = await api.get(`/rooms/${roomId}`);
        if (active) {
          setRoomInfo(res.data);
        }
      } catch (err) {
        if (active) {
          setErrorMsg(err.response?.data?.error || 'Room does not exist or has expired.');
        }
      }
    }

    if (roomId) {
      fetchRoom();
    }

    return () => {
      active = false;
    };
  }, [roomId]);

  const {
    localStream,
    remoteUsers,
    isMuted,
    isVideoOff,
    isScreenSharing,
    mediaError,
    toggleMute,
    toggleVideo,
    toggleScreenShare
  } = useWebRTC(roomId, socket, currentUser);

  const handleLeaveRoom = () => {
    navigate('/dashboard');
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (errorMsg) {
    return (
      <div className="room-error-container">
        <div className="error-card">
          <h2>Room Notice</h2>
          <p>{errorMsg}</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="room-page">
      {/* Room Header Bar */}
      <div className="room-header">
        <div className="room-title-area">
          <h2 className="room-name">{roomInfo?.name || 'Meeting Room'}</h2>
          <span className="room-badge">ID: {roomId}</span>
        </div>
        <div className="room-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={copyRoomLink}>
            {copied ? '✅ Copied!' : '📋 Copy Link'}
          </button>
          <span className="participants-count">
            👥 {remoteUsers.length + 1} participant{remoteUsers.length > 0 ? 's' : ''}
          </span>
        </div>
      </div>

      {mediaError && <div className="media-warning-banner">⚠️ {mediaError}</div>}

      {/* Main Room Body: Left is Video + Controls, Right is SidePanel */}
      <div className="room-layout">
        <main className="room-main">
          <VideoGrid
            localStream={localStream}
            remoteUsers={remoteUsers}
            currentUser={currentUser}
            isVideoOff={isVideoOff}
          />
          <ControlBar
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isScreenSharing={isScreenSharing}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
            onToggleScreenShare={toggleScreenShare}
            onLeaveRoom={handleLeaveRoom}
          />
        </main>

        <SidePanel
          socket={socket}
          roomId={roomId}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}


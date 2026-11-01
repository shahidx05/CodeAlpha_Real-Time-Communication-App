import React, { useEffect, useRef } from 'react';

function VideoTile({ stream, isLocal, label, isVideoOff }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-tile">
      {stream && (!isVideoOff || !isLocal) ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="video-element"
        />
      ) : (
        <div className="video-placeholder">
          <div className="avatar-circle">
            {label ? label.charAt(0).toUpperCase() : '?'}
          </div>
          <span className="placeholder-text">Camera Off</span>
        </div>
      )}
      <div className="video-label">
        {label} {isLocal ? '(You)' : ''}
      </div>
    </div>
  );
}

export default function VideoGrid({
  localStream,
  remoteUsers,
  currentUser,
  isVideoOff
}) {
  return (
    <div className="video-grid-container">
      <div className="video-grid">
        {/* Local user video */}
        <VideoTile
          stream={localStream}
          isLocal={true}
          label={currentUser?.name || 'You'}
          isVideoOff={isVideoOff}
        />

        {/* Remote participants */}
        {remoteUsers.map((remote) => (
          <VideoTile
            key={remote.socketId}
            stream={remote.stream}
            isLocal={false}
            label={remote.user?.name || 'Participant'}
            isVideoOff={!remote.stream}
          />
        ))}
      </div>
    </div>
  );
}


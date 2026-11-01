import React from 'react';

export default function ControlBar({
  isMuted,
  isVideoOff,
  isScreenSharing,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onLeaveRoom
}) {
  return (
    <div className="control-bar">
      <button
        className={`ctrl-btn ${isMuted ? 'btn-danger' : 'btn-control'}`}
        onClick={onToggleMute}
        title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
      >
        <span>{isMuted ? '🔇' : '🎙️'}</span>
        <span className="ctrl-label">{isMuted ? 'Unmute' : 'Mute'}</span>
      </button>

      <button
        className={`ctrl-btn ${isVideoOff ? 'btn-danger' : 'btn-control'}`}
        onClick={onToggleVideo}
        title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
      >
        <span>{isVideoOff ? '🚫' : '📹'}</span>
        <span className="ctrl-label">{isVideoOff ? 'Start Cam' : 'Stop Cam'}</span>
      </button>

      <button
        className={`ctrl-btn ${isScreenSharing ? 'btn-active' : 'btn-control'}`}
        onClick={onToggleScreenShare}
        title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
      >
        <span>🖥️</span>
        <span className="ctrl-label">
          {isScreenSharing ? 'Stop Share' : 'Share Screen'}
        </span>
      </button>

      <button
        className="ctrl-btn btn-leave"
        onClick={onLeaveRoom}
        title="Leave Room"
      >
        <span>📞</span>
        <span className="ctrl-label">Leave</span>
      </button>
    </div>
  );
}


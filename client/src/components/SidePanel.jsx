import React, { useState } from 'react';
import ChatTab from './ChatTab';
import FilesTab from './FilesTab';
import WhiteboardTab from './WhiteboardTab';

export default function SidePanel({ socket, roomId, currentUser }) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'files' | 'whiteboard'

  return (
    <aside className="side-panel">
      <div className="tab-buttons">
        <button
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 Chat
        </button>
        <button
          className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          📁 Files
        </button>
        <button
          className={`tab-btn ${activeTab === 'whiteboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('whiteboard')}
        >
          🎨 Whiteboard
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'chat' && (
          <ChatTab
            socket={socket}
            roomId={roomId}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'files' && (
          <FilesTab
            socket={socket}
            roomId={roomId}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'whiteboard' && (
          <WhiteboardTab
            socket={socket}
            roomId={roomId}
          />
        )}
      </div>
    </aside>
  );
}


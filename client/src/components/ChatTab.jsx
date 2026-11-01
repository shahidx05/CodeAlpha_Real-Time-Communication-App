import React, { useState, useEffect, useRef } from 'react';

export default function ChatTab({ socket, roomId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chat-message', handleChatMessage);

    return () => {
      socket.off('chat-message', handleChatMessage);
    };
  }, [socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    socket.emit('chat-message', {
      roomId,
      text: inputText.trim()
    });

    setInputText('');
  };

  return (
    <div className="chat-tab">
      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="chat-empty">No messages yet. Say hello!</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?._id;
            return (
              <div
                key={msg.id}
                className={`chat-message ${isMe ? 'message-own' : 'message-other'}`}
              >
                <div className="message-header">
                  <span className="message-sender">{msg.sender}</span>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="message-body">{msg.text}</div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          type="text"
          className="input chat-input"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={!inputText.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}


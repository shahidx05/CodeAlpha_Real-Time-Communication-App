# 🌐 CodeAlpha Real-Time Communication App

<p align="center">
  <img src="https://img.shields.io/badge/WebRTC-P2P%20Video-orange?style=for-the-badge&logo=webrtc" alt="WebRTC" />
  <img src="https://img.shields.io/badge/Socket.io-Real--Time-black?style=for-the-badge&logo=socket.io" alt="Socket.io" />
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-brightgreen?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" />
</p>

<p align="center">
  A full-stack real-time video conferencing and collaboration platform built with the <strong>MERN stack</strong>, <strong>native browser WebRTC</strong> (mesh topology), and <strong>Socket.io</strong>.
  <br />
  Features peer-to-peer video/audio calling, screen sharing, live group chat, end-to-end encrypted file sharing at rest (AES-256-GCM), and a synchronized multi-user collaborative whiteboard.
</p>

---

## 👨‍💻 Author & Repository

- **GitHub Repository**: [shahidx05/CodeAlpha_Real-Time-Communication-App](https://github.com/shahidx05/CodeAlpha_Real-Time-Communication-App)
- **LinkedIn Profile**: [Shahid on LinkedIn](https://www.linkedin.com/in/shahidx05/)

---

## 📋 Features

- 📹 **Multi-Party Video & Audio**: Native browser WebRTC (`RTCPeerConnection`) mesh topology with Google's public STUN server (`stun:stun.l.google.com:19302`).
- 🎙️ **In-Call Controls**: Instant microphone mute/unmute, camera toggle with video-off placeholder, and room disconnect.
- 🖥️ **Screen Sharing**: Live display streaming via `getDisplayMedia` with automatic track replacement (`replaceTrack`) across all connected peers and detection of native "Stop sharing" actions.
- 💬 **Real-Time Group Chat**: Low-latency messaging powered by Socket.io, complete with participant badges and timestamps.
- 🔒 **Encrypted File Sharing**: In-meeting file transfers (up to 10MB) encrypted at rest using **AES-256-GCM** with unique initialization vectors (`iv`) and authentication tags (`authTag`). Files are decrypted only upon authorized download.
- 🎨 **Synchronized Whiteboard**: Interactive HTML5 canvas with mouse and touch drawing support, color selection, variable brush sizes, live stroke broadcasting, and canvas clearing.
- 🚪 **Instant Meeting Rooms**: Generate unique short room IDs with one-click shareable links.
- 🛡️ **End-to-End Security**: JWT authentication protecting REST endpoints and Socket.io handshakes, Helmet security headers, CORS origin enforcement, and DTLS-SRTP WebRTC stream encryption.

---

## 🛠 Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router DOM v6, Axios, Socket.io Client, Plain CSS (Flexbox & CSS Grid) |
| **Backend** | Node.js, Express, MongoDB, Mongoose, Socket.io, Multer, Helmet, CORS |
| **Security & Auth** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, Node.js native `crypto` (AES-256-GCM) |
| **Real-Time & Media** | Native WebRTC (`RTCPeerConnection`, `getUserMedia`, `getDisplayMedia`), Socket.io signaling |

---

## 📁 Project Architecture & Folder Structure

```text
CodeAlpha_Real-Time-Communication-App/
├── .gitignore                          # Excludes node_modules, .env, uploads, and build artifacts
├── LICENSE                             # MIT Open Source License
├── package.json                        # Root workspace scripts for unified install & run
├── README.md                           # Documentation, setup guide, API & event specs
├── server/
│   ├── .env.example                    # Backend environment variable template
│   ├── package.json                    # Backend dependencies and scripts
│   ├── server.js                       # Express app, HTTP/Socket.io server, signaling & static handling
│   ├── controllers/
│   │   ├── authController.js           # User registration, login, and profile lookup
│   │   ├── fileController.js           # AES-256-GCM encryption, disk storage, and decryption streaming
│   │   └── roomController.js           # Room creation with unique IDs and room validation
│   ├── middleware/
│   │   └── auth.js                     # JWT auth middleware for Express & Socket.io handshakes
│   ├── models/
│   │   ├── FileRecord.js               # Encrypted file metadata, IV, and authTag schema
│   │   ├── Room.js                     # Meeting room schema
│   │   └── User.js                     # User account credentials schema
│   ├── routes/
│   │   ├── auth.js                     # Authentication routes (/api/auth)
│   │   ├── file.js                     # Decrypted download route (/api/files)
│   │   └── room.js                     # Room and room-file endpoints (/api/rooms)
│   ├── uploads/
│   │   └── .gitkeep                    # Directory preservation for encrypted uploads
│   └── utils/
│       └── crypto.js                   # AES-256-GCM buffer encryption and decryption engine
└── client/
    ├── .env.example                    # Frontend environment variable template
    ├── index.html                      # Single-page application root HTML
    ├── package.json                    # Frontend dependencies and Vite configuration
    ├── vite.config.js                  # Vite bundler config
    └── src/
        ├── App.css                     # Responsive styling for video grid, sidebar, and controls
        ├── App.jsx                     # Root React component, router, and auth guard
        ├── api.js                      # Axios instance with automatic JWT Authorization header
        ├── index.css                   # Global CSS resets and typography
        ├── main.jsx                    # React application entry point
        ├── components/
        │   ├── ChatTab.jsx             # Live group chat feed and input
        │   ├── ControlBar.jsx          # Bottom conference control toolbar
        │   ├── FilesTab.jsx            # Encrypted file upload and download list
        │   ├── Navbar.jsx              # Navigation header with user info and logout
        │   ├── SidePanel.jsx           # Tab switcher (Chat, Files, Whiteboard)
        │   ├── VideoGrid.jsx           # Responsive peer video tiles with name labels
        │   └── WhiteboardTab.jsx       # Collaborative HTML5 canvas
        ├── hooks/
        │   └── useWebRTC.js            # Custom WebRTC hook managing mesh peer connections & media
        └── pages/
            ├── AuthPage.jsx            # Login & Registration with toggle
            ├── DashboardPage.jsx       # Meeting room creation and join interface
            └── RoomPage.jsx            # Video conference page orchestrating media & tabs
```

---

## 📡 WebRTC Mesh Signaling Flow

```
[Peer A]               [Socket.io Signaling Server]             [Peer B]
   |                                 |                             |
   |--- join-room {roomId} --------->|                             |
   |                                 |<--- join-room {roomId} -----|
   |<-- room-users [Peer A] ---------|                             |
   |                                 |--- user-joined {Peer B} --->|
   |                                                               |
   |--- offer {target: B} ---------->|                             |
   |                                 |--- offer {caller: A} ------>|
   |                                 |<-- answer {target: A} ------|
   |<-- answer {caller: B} ----------|                             |
   |                                                               |
   |--- ice-candidate -------------->|                             |
   |                                 |--- ice-candidate ---------->|
   |<==================== P2P Media Streams ======================>|
```

1. **Join Notification**: A joining peer emits `join-room`. The server sends back the list of current participants (`room-users`) and informs others via `user-joined`.
2. **Offer / Answer Exchange**: The new participant creates an `RTCPeerConnection` for each existing peer, adds its media tracks, generates an SDP offer, and sends it via Socket.io. The receiving peer sets the remote description and replies with an SDP answer.
3. **ICE Candidate Exchange**: STUN candidates (`stun:stun.l.google.com:19302`) are gathered and relayed through the server to establish direct P2P connections.
4. **Direct Media**: Audio and video flow directly between browsers using encrypted DTLS-SRTP.

---

## 🔐 Security & Encryption

- **Password Security**: Passwords hashed with `bcryptjs` using 10 salt rounds.
- **Unified JWT Authentication**: JSON Web Tokens validate both REST API calls and the Socket.io connection handshake (`socket.handshake.auth.token`). Unauthenticated sockets are rejected.
- **AES-256-GCM Encryption at Rest**: Uploaded files are encrypted in memory before write. Each file has a random 16-byte initialization vector (`iv`) and generates an authentication tag (`authTag`). Decryption happens strictly in-memory when authorized users download the file.
- **Helmet & CORS**: Strict HTTP security headers via `helmet` and origin whitelisting via `cors`.
- **Media DTLS-SRTP**: WebRTC media is end-to-end encrypted in transit by standard browser protocols.

---

## ⚡ Quick Start (Local Development)

### 1. Clone the Repository
```bash
git clone https://github.com/shahidx05/CodeAlpha_Real-Time-Communication-App.git
cd CodeAlpha_Real-Time-Communication-App
```

### 2. Configure Backend
```bash
cd server
cp .env.example .env
npm install
```

Configure `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/webrtc_collab
JWT_SECRET=your_super_secret_jwt_key
FILE_ENC_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
CLIENT_URL=http://localhost:5173
```

Start the backend:
```bash
npm start
```

### 3. Configure Frontend
In a new terminal window:
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🚢 Production Deployment Guide

### Option 1: Unified Full-Stack Service (Render / Railway / VPS)

The Express server in `server/server.js` is pre-configured to automatically serve the production build from `client/dist` when `NODE_ENV=production`.

1. **Build the Client**:
   ```bash
   npm run build:client
   ```
2. **Environment Variables**:
   Set the following on your hosting dashboard:
   - `NODE_ENV=production`
   - `PORT=5000` (or dynamically provided by provider)
   - `MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/collab`
   - `JWT_SECRET=long_random_production_secret`
   - `FILE_ENC_KEY=64_char_hex_encryption_key`
   - `CLIENT_URL=https://your-app-domain.com`
3. **Start the Service**:
   ```bash
   npm start
   ```

### Option 2: Split Deployment (Vercel Frontend + Render/Railway Backend)

1. **Deploy Backend**:
   - Host `server/` on Render or Railway.
   - Configure `CLIENT_URL=https://your-frontend.vercel.app`.
2. **Deploy Frontend**:
   - Host `client/` on Vercel.
   - Set environment variables:
     - `VITE_API_URL=https://your-backend.onrender.com/api`
     - `VITE_SOCKET_URL=https://your-backend.onrender.com`

---

## 🔌 REST API Reference

All protected endpoints require the `Authorization: Bearer <token>` header.

| Method | Endpoint | Description | Auth Required | Payload / Parameters |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No | `{ "name": "...", "email": "...", "password": "..." }` |
| `POST` | `/api/auth/login` | Login and receive JWT | No | `{ "email": "...", "password": "..." }` |
| `GET` | `/api/auth/me` | Fetch authenticated user | Yes | None |
| `POST` | `/api/rooms` | Create a new room | Yes | `{ "name": "Sprint Sync" }` |
| `GET` | `/api/rooms/:roomId` | Check room existence | Yes | URL param `:roomId` |
| `POST` | `/api/rooms/:roomId/files` | Upload file (AES-256-GCM) | Yes | `multipart/form-data` with `file` (max 10MB) |
| `GET` | `/api/rooms/:roomId/files` | List files shared in room | Yes | URL param `:roomId` |
| `GET` | `/api/files/:id/download` | Decrypt and stream file | Yes | URL param `:id` |
| `GET` | `/api/health` | Health check probe | No | None |

---

## ⚡ Socket.io Events Reference

| Event | Direction | Description |
|---|---|---|
| `join-room` | Client ➔ Server | Requests entry to room and retrieves current participants & whiteboard history |
| `room-users` | Server ➔ Client | Sends list of existing peers to the joining client |
| `user-joined` | Server ➔ Client | Broadcasts newly connected participant to existing peers |
| `offer` | Client ➔ Server ➔ Client | Relays WebRTC SDP offer to target peer |
| `answer` | Client ➔ Server ➔ Client | Relays WebRTC SDP answer to caller |
| `ice-candidate` | Client ➔ Server ➔ Client | Relays ICE candidate for NAT traversal |
| `user-left` | Server ➔ Client | Emitted when a peer disconnects or leaves |
| `chat-message` | Bidirectional | Live chat text messaging |
| `file-shared` | Bidirectional | Real-time notification of newly uploaded file |
| `whiteboard-draw` | Bidirectional | Real-time stroke coordinates `{ x0, y0, x1, y1, color, size }` |
| `whiteboard-clear` | Bidirectional | Clears canvas for all participants in room |
| `whiteboard-state` | Server ➔ Client | Delivers room stroke history to newly joined participants |

---

## 🧪 Manual Smoke Testing Checklist

- [x] **Registration & Login**: Create User A and User B; verify authentication tokens and persistence.
- [x] **Room Creation**: Generate room from Dashboard; confirm short ID and clipboard URL copying.
- [x] **WebRTC Video Mesh**: Connect two separate browsers; confirm bi-directional video and audio streams.
- [x] **Media Controls**: Mute mic and toggle camera off; confirm avatar placeholder displays.
- [x] **Screen Share**: Share screen from User A; confirm User B sees stream; stop share and verify camera stream returns.
- [x] **Chat Messaging**: Send real-time chat messages between participants.
- [x] **Encrypted File Sharing**: Upload a file; confirm instantaneous broadcast; download on second client and verify byte-for-byte decryption.
- [x] **Collaborative Whiteboard**: Draw synchronized strokes across clients; change brush color/size; verify canvas clearing.
- [x] **Clean Disconnect**: Leave room and confirm remote video tile removal and participant count update.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

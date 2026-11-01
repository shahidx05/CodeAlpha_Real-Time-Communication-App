import { useState, useEffect, useRef, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

export function useWebRTC(roomId, socket, currentUser) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]); // [{ socketId, user, stream }]
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef({}); // socketId -> RTCPeerConnection
  const remoteUsersRef = useRef({}); // socketId -> { socketId, user, stream }
  const iceCandidatesQueue = useRef({}); // socketId -> Array<candidate>

  // Helper to update remoteUsers state from ref
  const syncRemoteUsersState = () => {
    setRemoteUsers(Object.values(remoteUsersRef.current));
  };

  // Helper to add peer connection
  const createPeerConnection = useCallback((targetSocketId, targetUser) => {
    if (peersRef.current[targetSocketId]) {
      return peersRef.current[targetSocketId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[targetSocketId] = pc;
    iceCandidatesQueue.current[targetSocketId] = [];

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote track
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      remoteUsersRef.current[targetSocketId] = {
        socketId: targetSocketId,
        user: targetUser || { name: 'Participant' },
        stream: remoteStream
      };
      syncRemoteUsersState();
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          target: targetSocketId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed'
      ) {
        removePeer(targetSocketId);
      }
    };

    return pc;
  }, [socket]);

  const removePeer = useCallback((targetSocketId) => {
    if (peersRef.current[targetSocketId]) {
      peersRef.current[targetSocketId].close();
      delete peersRef.current[targetSocketId];
    }
    delete remoteUsersRef.current[targetSocketId];
    delete iceCandidatesQueue.current[targetSocketId];
    syncRemoteUsersState();
  }, []);

  // Initialize Local Media Stream
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        console.warn('Full media access failed, trying audio only:', err);
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          });
          if (!active) {
            audioOnly.getTracks().forEach((t) => t.stop());
            return;
          }
          localStreamRef.current = audioOnly;
          setLocalStream(audioOnly);
          setIsVideoOff(true);
          setMediaError('Camera not available or permission denied. Audio only enabled.');
        } catch (audioErr) {
          console.error('Microphone/Camera permission denied:', audioErr);
          setMediaError('Camera and microphone permission denied. You can still use chat and whiteboard.');
        }
      }
    }

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // WebRTC Signaling Socket Events
  useEffect(() => {
    if (!socket || !roomId) return;

    // Join room when socket is connected
    socket.emit('join-room', { roomId });

    // Existing users currently in the room - caller initiates offers
    const handleRoomUsers = async ({ users }) => {
      for (const existing of users) {
        if (existing.socketId === socket.id) continue;
        const pc = createPeerConnection(existing.socketId, existing.user);

        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', {
            target: existing.socketId,
            offer
          });
        } catch (err) {
          console.error('Error creating offer for existing user:', err);
        }
      }
    };

    // A new user joined
    const handleUserJoined = ({ socketId, user }) => {
      // Store placeholder or prepare connection
      remoteUsersRef.current[socketId] = {
        socketId,
        user,
        stream: null
      };
      syncRemoteUsersState();
    };

    // Received an offer
    const handleOffer = async ({ caller, offer, user }) => {
      const pc = createPeerConnection(caller, user);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Drain queued ICE candidates
        const queue = iceCandidatesQueue.current[caller] || [];
        while (queue.length > 0) {
          const cand = queue.shift();
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('answer', {
          target: caller,
          answer
        });
      } catch (err) {
        console.error('Error handling offer from', caller, err);
      }
    };

    // Received an answer
    const handleAnswer = async ({ caller, answer }) => {
      const pc = peersRef.current[caller];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));

          // Drain queued ICE candidates
          const queue = iceCandidatesQueue.current[caller] || [];
          while (queue.length > 0) {
            const cand = queue.shift();
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
        } catch (err) {
          console.error('Error setting remote description for answer:', err);
        }
      }
    };

    // Received ICE candidate
    const handleIceCandidate = async ({ caller, candidate }) => {
      const pc = peersRef.current[caller];
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      } else {
        if (!iceCandidatesQueue.current[caller]) {
          iceCandidatesQueue.current[caller] = [];
        }
        iceCandidatesQueue.current[caller].push(candidate);
      }
    };

    // Remote user left
    const handleUserLeft = ({ socketId }) => {
      removePeer(socketId);
    };

    socket.on('room-users', handleRoomUsers);
    socket.on('user-joined', handleUserJoined);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('room-users', handleRoomUsers);
      socket.off('user-joined', handleUserJoined);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('user-left', handleUserLeft);

      // Clean up peer connections
      Object.keys(peersRef.current).forEach((id) => {
        peersRef.current[id].close();
      });
      peersRef.current = {};
      remoteUsersRef.current = {};
      iceCandidatesQueue.current = {};
      setRemoteUsers([]);
      socket.emit('leave-room');
    };
  }, [socket, roomId, createPeerConnection, removePeer]);

  // Toggle Microphone
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Replace track on all active peer connections
  const replaceVideoTrackOnPeers = (newTrack) => {
    Object.values(peersRef.current).forEach((pc) => {
      const senders = pc.getSenders();
      const videoSender = senders.find(
        (s) => s.track && s.track.kind === 'video'
      );
      if (videoSender) {
        videoSender.replaceTrack(newTrack);
      }
    });
  };

  // Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      // Replace track on peer connections
      replaceVideoTrackOnPeers(screenTrack);

      // Handle browser native "Stop Sharing" button
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn('Screen sharing cancelled or failed:', err);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);

    // Revert to camera track on peer connections
    if (localStreamRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0] || null;
      replaceVideoTrackOnPeers(cameraTrack);
    }
  };

  return {
    localStream,
    remoteUsers,
    isMuted,
    isVideoOff,
    isScreenSharing,
    mediaError,
    toggleMute,
    toggleVideo,
    toggleScreenShare
  };
}


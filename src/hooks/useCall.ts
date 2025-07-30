// hooks/useCall.ts
import {useRef} from 'react';
import {RTCPeerConnection, mediaDevices} from 'react-native-webrtc';
import io from 'socket.io-client';

const SOCKET_URL = 'https://your-socket-server.com'; // Replace with actual server

type MediaType = 'audio' | 'video';

interface UseCallProps {
  senderId: string;
  receiverId: string;
}

const iceServers = {
  iceServers: [
    {
      urls: 'turn:fameely-api.deliciousdabbas.com:3478',
      username: 'your-username',
      credential: 'your-password',
    },
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
};

export default function useCall({senderId, receiverId}: UseCallProps) {
  const pc = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  const socket = useRef(io(SOCKET_URL, {transports: ['websocket']})).current;

  const initiateCall = async (mediaType: MediaType) => {
    try {
      // 1. Get local media stream
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: mediaType === 'video',
      });
      localStream.current = stream;

      // 2. Create peer connection
      pc.current = new RTCPeerConnection(iceServers);

      // 3. Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.current?.addTrack(track, stream);
      });

      // 4. Handle ICE candidates
      pc.current.onicecandidate = event => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            to: receiverId,
            candidate: event.candidate,
          });
        }
      };

      // 5. Create offer and send to receiver
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);

      socket.emit('call-user', {
        to: receiverId,
        mediaType,
        offer,
      });

      console.log(`[Caller] Offer sent to ${receiverId}`);
    } catch (err) {
      console.error('[Caller] Error initiating call:', err);
    }
  };

  return {initiateCall};
}

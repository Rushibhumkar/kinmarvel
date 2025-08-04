// src/hooks/useCall.ts

import {useEffect, useRef, useState} from 'react';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import socket from '../services/socket';
import ICE_SERVERS from '../utils/webrtcConfig';

export const useCall = (userId: string) => {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<null | {
    from: string;
    offer: RTCSessionDescriptionInit;
    mediaType: 'audio' | 'video';
  }>(null);
  const callEndedRef = useRef(false);

  useEffect(() => {
    console.log('[useCall] Initializing socket event listeners');

    socket.on('call-made', async ({from, offer, mediaType}) => {
      console.log(
        `[socket] Incoming call from: ${from}, mediaType: ${mediaType}`,
      );
      setIncomingCall({from, offer, mediaType});
    });

    socket.on('answer-made', async ({from, answer}) => {
      console.log(`[socket] Answer received from: ${from}`);
      try {
        await pcRef.current?.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
        console.log('[PeerConnection] Remote description set with answer');
      } catch (error) {
        console.error('[PeerConnection] Failed to set remote answer:', error);
      }
    });

    socket.on('ice-candidate', async ({from, candidate}) => {
      console.log(`[socket] Received ICE candidate from ${from}`);
      try {
        await pcRef.current?.addIceCandidate(candidate);
        console.log('[PeerConnection] ICE candidate added successfully');
      } catch (err) {
        console.error('[PeerConnection] Error adding ICE candidate:', err);
      }
    });

    socket.on('call-ended', ({from}) => {
      console.log(`[socket] Call ended by: ${from}`);
      endCall();
    });

    socket.on('error', err => {
      console.log('[socket] Error:', err); // Update from "undefined" to actual error
      endCall();
    });
    socket.on('call-rejected', ({from, reason}) => {
      console.log('[DEBUG] call-rejected received:', from, reason);
      setIncomingCall(null);
      endCall();
    });
    return () => {
      console.log('[useCall] Cleaning up socket listeners');
      socket.off('call-made');
      socket.off('answer-made');
      socket.off('ice-candidate');
      socket.off('call-ended');
      socket.off('error');
      socket.off('call-rejected');
    };
  }, []);

  const createPeerConnection = (remoteId: string) => {
    console.log(
      `[PeerConnection] Creating new RTCPeerConnection with: ${remoteId}`,
    );
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = event => {
      if (event.candidate) {
        console.log('[PeerConnection] Sending ICE candidate...');
        socket.emit('ice-candidate', {
          to: remoteId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = event => {
      console.log('[PeerConnection] onTrack event triggered');
      if (event.streams?.[0]) {
        setRemoteStream(event.streams[0]);
        console.log('[PeerConnection] Remote stream set');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(
        '[PeerConnection] Connection state changed:',
        pc.connectionState,
      );
    };

    return pc;
  };

  const getMedia = async (mediaType: 'audio' | 'video') => {
    console.log(`[Media] Requesting user media: ${mediaType}`);
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: mediaType === 'video',
      });
      console.log('[Media] Media stream acquired');
      return stream;
    } catch (error) {
      console.error('[Media] Failed to get media stream:', error);
      throw error;
    }
  };

  const startCall = async (to: string, mediaType: 'audio' | 'video') => {
    console.log(`[Call] Starting ${mediaType} call to: ${to}`);
    try {
      const stream = await getMedia(mediaType);
      localStreamRef.current = stream;
      setLocalStream(stream);
      callEndedRef.current = false;

      const pc = createPeerConnection(to);
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      console.log('[Call] Tracks added to PeerConnection');

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('[Call] Offer created and set as local description');

      socket.emit('call-user', {
        to,
        offer,
        mediaType,
      });

      console.log('[Socket] Emitted call-user event');
    } catch (error) {
      console.error('[Call] Error during startCall:', error);
    }
  };

  const answerCall = async () => {
    if (!incomingCall) {
      console.warn('[Answer] No incoming call to answer');
      return;
    }

    console.log(`[Answer] Answering call from ${incomingCall.from}`);
    try {
      const stream = await getMedia(incomingCall.mediaType);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(incomingCall.from);
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      console.log('[Answer] Local tracks added');

      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer),
      );
      console.log('[Answer] Remote description set with offer');

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('[Answer] Answer created and set as local description');

      socket.emit('make-answer', {
        to: incomingCall.from,
        answer,
      });
      console.log('[Socket] Emitted make-answer event');

      setIncomingCall(null);
    } catch (error) {
      console.error('[Answer] Error while answering call:', error);
    }
  };
  const endCall = () => {
    if (callEndedRef.current) return; // 🔐 prevent infinite loop
    callEndedRef.current = true;

    console.log('[Call] Ending call');

    try {
      pcRef.current?.close();
      pcRef.current = null;

      localStreamRef.current?.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;

      setRemoteStream(null);
      setLocalStream(null);

      socket.emit('end-call', {to: userId});
      console.log('[Socket] Emitted end-call event');
    } catch (error) {
      console.error('[Call] Error while ending call:', error);
    }
  };

  return {
    localStream,
    remoteStream,
    incomingCall,
    startCall,
    answerCall,
    endCall,
    setIncomingCall,
  };
};

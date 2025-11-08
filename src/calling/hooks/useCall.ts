import {useEffect, useRef, useState} from 'react';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import socket from '../services/socket';
import ICE_SERVERS from '../utils/webrtcConfig';
import {RTCSessionDescriptionInit} from 'react-native-webrtc/lib/typescript/RTCSessionDescription';
import InCallManager from 'react-native-incall-manager';
import Sound from 'react-native-sound';

export const useCall = (userId: string) => {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidates = useRef<any[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<null | {
    from: string;
    offer: RTCSessionDescriptionInit;
    mediaType: 'audio' | 'video';
  }>(null);

  const [currentPeerId, setCurrentPeerId] = useState<string | null>(null);
  const callEndedRef = useRef(false);

  // --- Audio tones ---
  const outgoingTone = useRef<Sound | null>(null);
  const incomingTone = useRef<Sound | null>(null);

  const playOutgoingTone = () => {
    try {
      if (outgoingTone.current) {
        outgoingTone.current.stop();
        outgoingTone.current.release();
      }
      outgoingTone.current = new Sound('outgoing.mp3', Sound.MAIN_BUNDLE, e => {
        if (!e) {
          outgoingTone.current?.setNumberOfLoops(-1);
          outgoingTone.current?.setVolume(1.0);
          outgoingTone.current?.play();
          console.log('[Sound] Outgoing tone started');
        } else console.log('[Sound] Load error:', e);
      });
    } catch (err) {
      console.log('[Sound] Outgoing play err', err);
    }
  };

  const playIncomingTone = () => {
    try {
      if (incomingTone.current) {
        incomingTone.current.stop();
        incomingTone.current.release();
      }
      incomingTone.current = new Sound('ringtone.mp3', Sound.MAIN_BUNDLE, e => {
        if (!e) {
          incomingTone.current?.setNumberOfLoops(-1);
          incomingTone.current?.setVolume(1.0);
          incomingTone.current?.play();
          console.log('[Sound] Incoming tone started');
        } else console.log('[Sound] Load error:', e);
      });
    } catch (err) {
      console.log('[Sound] Incoming play err', err);
    }
  };

  const stopAllTones = () => {
    try {
      outgoingTone.current?.stop();
      incomingTone.current?.stop();
    } catch {}
  };

  // -------------------- SOCKET EVENTS --------------------
  useEffect(() => {
    console.log('[useCall] Initializing socket event listeners');

    socket.on('call-made', async ({from, offer, mediaType}) => {
      console.log(
        `[socket] Incoming call from: ${from}, mediaType: ${mediaType}`,
      );
      playIncomingTone();
      setIncomingCall({from, offer, mediaType});

      try {
        const CallEventEmitter =
          require('../services/CallEventEmitter').default;
        CallEventEmitter.emit('incoming-call', {from, offer, mediaType});
        console.log('[useCall] 🔔 Emitted global incoming-call event');
      } catch (err) {
        console.warn('[useCall] Failed to emit global event:', err);
      }
    });

    socket.on('answer-made', async ({from, answer}) => {
      console.log(`[socket] Answer received from: ${from}`);
      try {
        await pcRef.current?.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
        console.log('[PeerConnection] Remote description set with answer');

        for (const c of pendingCandidates.current) {
          try {
            await pcRef.current?.addIceCandidate(c);
          } catch (e) {
            console.warn('[PeerConnection] late ICE add failed', e);
          }
        }
        pendingCandidates.current = [];
      } catch (error) {
        console.error('[PeerConnection] Failed to set remote answer:', error);
      }
    });

    socket.on('ice-candidate', async ({from, candidate}) => {
      console.log(`[socket] Received ICE candidate from ${from}`);
      if (!pcRef.current || !pcRef.current.remoteDescription) {
        console.log('[PeerConnection] Queuing ICE until remoteDescription set');
        pendingCandidates.current.push(candidate);
        return;
      }
      try {
        await pcRef.current.addIceCandidate(candidate);
      } catch (err) {
        console.error('[PeerConnection] Error adding ICE candidate:', err);
      }
    });

    const handlePeerEnded = ({from}) => {
      console.log(`[socket][handlePeerEnded] Triggered by: ${from}`);
      if (from === userId) {
        console.log('[socket][handlePeerEnded] Ignored self echo');
        return;
      }
      console.log('[socket][handlePeerEnded] Running endCall() now...');
      endCall();
    };

    socket.on('call-ended', handlePeerEnded);
    socket.on('end-call', handlePeerEnded);

    socket.on('error', err => {
      console.log('[socket] Error:', err);
      endCall();
    });

    socket.on('call-rejected', ({from, reason}) => {
      console.log('[DEBUG] call-rejected received:', from, reason);
      stopAllTones(); // 🔇 stop any ringtone instantly
      InCallManager.stopRingback();
      InCallManager.stopRingtone();
      InCallManager.stop();
      setIncomingCall(null);
      endCall();
    });

    socket.on('reject-call', ({from, reason}) => {
      console.log('[DEBUG] reject-call received from peer:', from, reason);
      stopAllTones();
      InCallManager.stopRingback();
      InCallManager.stopRingtone();
      InCallManager.stop();
      setIncomingCall(null);
      endCall();
    });

    return () => {
      console.log('[useCall] Cleaning up socket listeners');
      socket.off('call-made');
      socket.off('answer-made');
      socket.off('ice-candidate');
      socket.off('call-ended', handlePeerEnded);
      socket.off('end-call', handlePeerEnded);
      socket.off('error');
      socket.off('call-rejected');
      socket.off('reject-call');
    };
  }, []);

  // -------------------- PEER CONNECTION --------------------
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
      if (['failed', 'closed'].includes(pc.connectionState)) {
        console.log(
          '[PeerConnection] Auto-ending due to state:',
          pc.connectionState,
        );
        endCall();
      } else if (pc.connectionState === 'disconnected') {
        console.log('[PeerConnection] Disconnected — waiting before ending...');
        setTimeout(() => {
          if (pc.connectionState === 'disconnected') {
            console.log('[PeerConnection] Still disconnected → ending call');
            endCall();
          }
        }, 3000); // 3s grace period
      }
    };

    return pc;
  };

  // -------------------- MEDIA ACCESS --------------------
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

  // -------------------- START CALL --------------------
  const startCall = async (to: string, mediaType: 'audio' | 'video') => {
    console.log(`[Call] Starting ${mediaType} call to: ${to}`);
    callEndedRef.current = false;
    setCurrentPeerId(to); // ✅ persist immediately

    InCallManager.start({media: mediaType});
    if (mediaType === 'video') InCallManager.setForceSpeakerphoneOn(true);
    else InCallManager.setForceSpeakerphoneOn(false);

    try {
      const stream = await getMedia(mediaType);
      playOutgoingTone();
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(to);
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      console.log('[Call] Tracks added to PeerConnection');

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('[Call] Offer created and set as local description');

      socket.emit('call-user', {to, offer, mediaType});
      await new Promise(res => setTimeout(res, 300));
      console.log('[Socket] Emitted call-user event');
      stopAllTones();
    } catch (error) {
      console.error('[Call] Error during startCall:', error);
    }
  };

  // -------------------- ANSWER CALL --------------------
  const answerCall = async () => {
    if (!incomingCall) {
      console.warn('[Answer] No incoming call to answer');
      return;
    }
    stopAllTones();

    console.log(`[Answer] Answering call from ${incomingCall.from}`);
    setCurrentPeerId(incomingCall.from); // ✅ store for cleanup consistency
    try {
      const stream = await getMedia(incomingCall.mediaType);
      localStreamRef.current = stream;
      setLocalStream(stream);

      InCallManager.start({media: incomingCall.mediaType});
      if (incomingCall.mediaType === 'video')
        InCallManager.setForceSpeakerphoneOn(true);
      else InCallManager.setForceSpeakerphoneOn(false);

      const pc = createPeerConnection(incomingCall.from);
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      console.log('[Answer] Local tracks added');

      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer),
      );

      for (const c of pendingCandidates.current) {
        try {
          await pcRef.current?.addIceCandidate(c);
        } catch (e) {
          console.warn('[PeerConnection] late ICE add failed', e);
        }
      }
      pendingCandidates.current = [];

      console.log('[Answer] Remote description set with offer');

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('[Answer] Answer created and set as local description');

      socket.emit('make-answer', {to: incomingCall.from, answer});
      console.log('[Socket] Emitted make-answer event');

      setIncomingCall(null);
    } catch (error) {
      console.error('[Answer] Error while answering call:', error);
    }
  };

  // -------------------- END CALL --------------------
  const endCall = () => {
    if (callEndedRef.current) return;
    callEndedRef.current = true;
    stopAllTones();
    InCallManager.stopRingback();
    InCallManager.stopRingtone();
    InCallManager.stop();

    console.log('[Call] Ending call');

    try {
      stopAllTones();
      InCallManager.stop();
      InCallManager.setForceSpeakerphoneOn(false);

      pcRef.current?.getSenders().forEach(s => s.track?.stop?.());
      pcRef.current?.close();

      localStreamRef.current?.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;

      setRemoteStream(null);
      setLocalStream(null);
      setTimeout(() => {
        setRemoteStream(null);
        setLocalStream(null);
      }, 300);

      const peer = currentPeerId;
      if (peer) {
        socket.emit('call-ended', {from: userId, to: peer});
        console.log('[Socket] Emitted call-ended to:', peer);
      }
    } catch (error) {
      console.warn('[Call] Error during endCall cleanup', error);
    }

    pcRef.current = null;
    setCurrentPeerId(null);
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

import React, {useEffect} from 'react';
import {Alert} from 'react-native';
import socket from '../services/socket';
import {myConsole} from '../../utils/myConsole';
import InCallManager from 'react-native-incall-manager';

type MediaType = 'audio' | 'video';

type UseCallControlsParams = {
  userId?: string;
  peerId: string | null;
  setPeerId: (id: string | null) => void;
  setIsDialing: (v: boolean) => void;
  setInCall: (v: boolean) => void;
  setIncomingCall: (v: any) => void;

  startCall: (toUserId: string, mediaType: MediaType) => Promise<void>;
  answerCall: () => Promise<void>;
  endCall: () => void;

  playOutgoingTone: () => void;
  stopOutgoingTone: () => void;
  playIncomingTone?: () => void;
  stopIncomingTone: () => void;

  incomingCall?: {from?: string; mediaType?: MediaType} | null;
};

export default function useCallControls({
  userId,
  peerId,
  setPeerId,
  setIsDialing,
  setInCall,
  setIncomingCall,
  startCall,
  answerCall,
  endCall,
  playOutgoingTone,
  stopOutgoingTone,
  stopIncomingTone,
  incomingCall,
}: UseCallControlsParams) {
  const peerIdRef = React.useRef<string | null>(null);
  const cleanedUpRef = React.useRef(false);
  const endingRef = React.useRef(false);

  // keep latest peerId reference
  useEffect(() => {
    if (peerId) peerIdRef.current = peerId;
  }, [peerId]);

  // reset guards whenever a call actually begins
  useEffect(() => {
    if (peerId) {
      cleanedUpRef.current = false;
      endingRef.current = false;
    }
  }, [peerId]);

  // -----------------------
  // Safe Cleanup
  // -----------------------
  const safeCleanup = (reason: string) => {
    if (cleanedUpRef.current) return;
    cleanedUpRef.current = true;
    // console.log('[CallEnd] cleanup reason:', reason);

    try {
      stopOutgoingTone?.();
      stopIncomingTone?.();
      endCall?.();
    } catch (err) {
      // console.warn('[CallEnd] cleanup error', err);
    }

    // reset states
    setIncomingCall(null);
    setIsDialing(false);
    setInCall(false);

    // defer reset slightly to allow outgoing events to finish
    setTimeout(() => {
      setPeerId(null);
      peerIdRef.current = null;
      setInCall(false);
    }, 400);
  };

  // -----------------------
  // Start Call
  // -----------------------
  const handleStartCall = async (toUserId: string, mediaType: MediaType) => {
    try {
      await startCall(toUserId, mediaType);
      setPeerId(toUserId);
      peerIdRef.current = toUserId; // ✅ ensure immediate reference update
      setIsDialing(true);
      playOutgoingTone();
    } catch (err) {
      Alert.alert('Call Error', `Could not start ${mediaType} call`);
      stopOutgoingTone();
    }
  };

  // -----------------------
  // Answer Call
  // -----------------------
  const handleAnswer = async () => {
    try {
      await answerCall();
      const fromId = incomingCall?.from ?? peerId ?? null;
      if (fromId) {
        setPeerId(fromId);
        peerIdRef.current = fromId;
      }
      socket.emit('call-answered', {
        to: incomingCall?.from,
        from: userId,
        mediaType: incomingCall?.mediaType,
      });
      stopIncomingTone();
      setIncomingCall(null);
      setInCall(true);
    } catch (err) {
      Alert.alert('Answer Error', 'Could not answer call');
    }
  };

  // -----------------------
  // End Call (Local)
  // -----------------------
  const handleEnd = () => {
    if (endingRef.current) {
      // console.log('[CallEnd] Skipped duplicate end');
      return;
    }
    endingRef.current = true;

    const to = peerIdRef.current || incomingCall?.from || peerId;
    // console.log('[CallEnd][Local] Button pressed. To:', to, 'UserId:', userId);

    if (to && userId) {
      // console.log('[CallEnd][Emit] Sending end-call event →', {
      //   to,
      //   from: userId,
      // });
      socket.emit('end-call', {to, from: userId});
    } else {
      // console.warn('[CallEnd][Warn] Missing peerId or userId');
    }

    safeCleanup('self-end');
  };

  // -----------------------
  // Reject Incoming Call
  // -----------------------
  const handleReject = () => {
    // 🔇 Stop ringtone instantly before cleanup
    try {
      // 🔇 stop tone instantly before emit
      stopIncomingTone?.();
      stopOutgoingTone?.();
      InCallManager.stopRingback();
      InCallManager.stopRingtone();
      InCallManager.stop();
    } catch (err) {
      // console.log('[CallReject] tone stop error', err);
    }

    if (incomingCall?.from) {
      // ✅ match backend: send 'reject-call' event, include both to/from
      socket.emit('reject-call', {
        to: incomingCall.from,
        from: userId,
        reason: 'User declined the call',
      });
    }

    safeCleanup('reject');
    stopIncomingTone?.();
  };

  // -----------------------
  // Peer Ended Listener
  // -----------------------
  useEffect(() => {
    const onPeerEnded = (payload?: any) => {
      // console.log('[Socket] peer-ended event received:', payload);
      if (cleanedUpRef.current) {
        // console.log('[CallEnd] peer-ended ignored (already cleaned)');
        return;
      }
      safeCleanup('peer-end');
    };

    socket.on('call-ended', onPeerEnded);
    socket.on('end-call', onPeerEnded);
    socket.on('call-rejected', onPeerEnded);
    socket.on('reject-call', onPeerEnded);

    return () => {
      socket.off('call-ended', onPeerEnded);
      socket.off('end-call', onPeerEnded);
      socket.off('call-rejected', onPeerEnded);
      socket.off('reject-call', onPeerEnded);
    };
  }, []);

  return {
    handleStartCall,
    handleAnswer,
    handleEnd,
    handleReject,
  };
}

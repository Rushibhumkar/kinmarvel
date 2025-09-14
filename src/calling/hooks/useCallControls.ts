// src/calling/hooks/useCallControls.ts
import React, {useEffect} from 'react';
import {Alert} from 'react-native';
import socket from '../services/socket';
import {myConsole} from '../../utils/myConsole';

type MediaType = 'audio' | 'video';

type UseCallControlsParams = {
  userId?: string;
  peerId: string | null;
  setPeerId: (id: string | null) => void;
  setIsDialing: (v: boolean) => void;
  setInCall: (v: boolean) => void;
  setIncomingCall: (v: any) => void;

  // from useCall(userId)
  startCall: (toUserId: string, mediaType: MediaType) => Promise<void>;
  answerCall: () => Promise<void>;
  endCall: () => void;

  // audio helpers
  playOutgoingTone: () => void;
  stopOutgoingTone: () => void;
  playIncomingTone?: () => void; // optional
  stopIncomingTone: () => void;

  // state needed for reject flow
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
  // -----------------------
  // Refs & Idempotency Guards
  // -----------------------
  const peerIdRef = React.useRef<string | null>(null);
  const cleanedUpRef = React.useRef(false);
  const endingRef = React.useRef(false);

  useEffect(() => {
    peerIdRef.current = peerId;
  }, [peerId]);

  // Reset guards when a new call starts (peerId switches from null -> value)
  useEffect(() => {
    if (peerId) {
      cleanedUpRef.current = false;
      endingRef.current = false;
    }
  }, [peerId]);

  myConsole('peerIdReffff', peerIdRef);
  myConsole('incomingCallll', incomingCall);

  const safeCleanup = (reason: string) => {
    if (cleanedUpRef.current) return;
    cleanedUpRef.current = true;

    console.log('[CallEnd] cleanup reason:', reason);

    try {
      stopOutgoingTone();
      stopIncomingTone();
      endCall();
    } catch {}

    setIncomingCall(null);
    setIsDialing(false);
    setInCall(false);
    setPeerId(null);
  };

  // -----------------------
  // Start Call
  // -----------------------
  const handleStartCall = async (toUserId: string, mediaType: MediaType) => {
    try {
      await startCall(toUserId, mediaType);
      setPeerId(toUserId);
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
      stopIncomingTone();
      setIncomingCall(null);
      // avoid flipping if already true
      setInCall(prev => (prev ? prev : true));
      setPeerId(incomingCall?.from ?? peerId ?? null);
    } catch (err) {
      Alert.alert('Answer Error', 'Could not answer call');
    }
  };

  // -----------------------
  // End Call (local)
  // -----------------------
  const handleEnd = () => {
    if (endingRef.current) return;
    endingRef.current = true;

    const to = peerIdRef.current || incomingCall?.from || peerId;
    if (to && userId) {
      console.log('[CallEnd] emitting end-call', {to, from: userId});
      socket.emit('end-call', {to, from: userId});
    } else {
      console.warn('[CallEnd] Skipping emit: peerId or userId missing');
    }

    safeCleanup('self-end');
  };

  // -----------------------
  // Reject Incoming
  // -----------------------
  const handleReject = () => {
    if (incomingCall?.from) {
      socket.emit('reject-call', {
        to: incomingCall.from,
        reason: 'User declined the call',
      });
    }
    safeCleanup('reject');
  };

  // -----------------------
  // Socket listeners for peer end
  // -----------------------
  const onPeerEnded = (payload?: any) => {
    if (cleanedUpRef.current) {
      console.log('[CallEnd] peer-ended ignored (already cleaned)');
      return;
    }

    if (!peerIdRef.current) {
      console.warn('[CallEnd] peer-ended but peerIdRef.current is null');
      safeCleanup('peer-end (peerId null)');
      return;
    }

    console.log('[CallEnd] peer-ended event', payload);
    safeCleanup('peer-end');
  };

  return {handleStartCall, handleAnswer, handleEnd, handleReject};
}

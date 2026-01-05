import {useEffect} from 'react';
import socket from '../services/socket';
import InCallManager from 'react-native-incall-manager';

type UseSignalingWireParams = {
  userId?: string;
  peerId: string | null;
  setPeerId: (id: string | null) => void;
  setInCall: (v: boolean) => void;
  setIsDialing: (v: boolean) => void;
  setIncomingCall: (v: any) => void;
  stopOutgoingTone: () => void;
  stopIncomingTone: () => void;
  endCall: () => void;
};

export default function useSignalingWire({
  userId,
  peerId,
  setPeerId,
  setInCall,
  setIsDialing,
  setIncomingCall,
  stopOutgoingTone,
  stopIncomingTone,
  endCall,
}: UseSignalingWireParams) {
  useEffect(() => {
    const onRejected = (payload?: any) => {
      // console.log('[SignalWire] → onRejected triggered:', payload);
      try {
        // console.log('[SignalWire] → Calling stopOutgoingTone()');
        stopOutgoingTone();
        // console.log('[SignalWire] → Calling stopIncomingTone()');
        stopIncomingTone();
        InCallManager.stopRingback();
        InCallManager.stopRingtone();
        InCallManager.stop();
      } catch (err) {
        // console.log('[SignalWire] → stopTone error', err);
      }
      // console.log('[SignalWire] → Resetting call state now');
      setIncomingCall(null);
      setIsDialing(false);
      setInCall(false);
      setPeerId(null);
      endCall();
    };

    const onAnswered = ({
      from,
      mediaType,
    }: {
      from?: string;
      mediaType?: 'audio' | 'video';
    }) => {
      stopOutgoingTone();
      setPeerId(from ?? peerId);
      setIsDialing(false);
      setIncomingCall(null);
      setInCall(true);

      // ✅ emit back to confirm answer for video
      socket.emit('call-answered', {to: from, from: userId, mediaType});
    };

    const onEnded = (payload?: {from?: string}) => {
      stopOutgoingTone();
      stopIncomingTone();
      endCall();
      setIncomingCall(null);
      setInCall(false);
      setIsDialing(false);
      setPeerId(null);
    };

    socket.on('call-rejected', onRejected);
    socket.on('call-answered', onAnswered);
    socket.on('call-ended', onEnded);
    socket.on('end-call', onEnded); // <-- ADD
    socket.on('user-disconnected', onEnded);

    return () => {
      socket.off('call-rejected', onRejected);
      socket.off('call-answered', onAnswered);
      socket.off('call-ended', onEnded);
      socket.off('end-call', onEnded); // <-- ADD
      socket.off('user-disconnected', onEnded);
      // ⛔️ No connect/disconnect here anymore
      stopOutgoingTone();
      stopIncomingTone();
    };
  }, [
    peerId,
    endCall,
    setPeerId,
    setIncomingCall,
    setIsDialing,
    setInCall,
    stopOutgoingTone,
    stopIncomingTone,
  ]);
}

import {useEffect} from 'react';
import socket from '../services/socket';

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
    const onRejected = () => {
      stopOutgoingTone();
      stopIncomingTone();
      setIncomingCall(null);
      setIsDialing(false);
      setInCall(false);
      setPeerId(null);
      endCall();
    };

    const onAnswered = ({from}: {from?: string}) => {
      stopOutgoingTone();
      setPeerId(from ?? peerId);
      setIsDialing(false);
      setInCall(true);
      setIncomingCall(null);
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

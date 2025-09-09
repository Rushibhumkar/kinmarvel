import {useEffect} from 'react';
import {getData} from '../../hooks/useAsyncStorage';
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
}: UseSignalingWireParams) {
  useEffect(() => {
    const onRejected = () => {
      stopOutgoingTone();
      stopIncomingTone();
      setIncomingCall(null);
      setIsDialing(false);
      setInCall(false);
    };

    const onAnswered = ({from}: {from?: string}) => {
      stopOutgoingTone();
      setPeerId(from ?? peerId);
      setIsDialing(false);
      setInCall(true);
    };

    const onEnded = () => {
      stopOutgoingTone();
      stopIncomingTone();
      setIncomingCall(null);
      setInCall(false);
      setIsDialing(false);
    };

    socket.on('call-rejected', onRejected);
    socket.on('call-answered', onAnswered);
    socket.on('call-ended', onEnded);

    return () => {
      socket.off('call-rejected', onRejected);
      socket.off('call-answered', onAnswered);
      socket.off('call-ended', onEnded);
      // ⛔️ No connect/disconnect here anymore
      stopOutgoingTone();
      stopIncomingTone();
    };
  }, [peerId]);
}

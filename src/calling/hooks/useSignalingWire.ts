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
    const registerSocket = async () => {
      try {
        const token = await getData('authToken');
        if (token && userId) {
          socket.auth = {token};
          socket.connect();
          socket.emit('register', userId, token);
        } else {
          console.warn('[Socket] Missing token or userId');
        }
      } catch (e) {
        console.warn('[Socket] Register error:', e);
      }
    };

    registerSocket();

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
      try {
        socket.disconnect();
      } catch {}
      stopOutgoingTone();
      stopIncomingTone();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId, userId]);
}

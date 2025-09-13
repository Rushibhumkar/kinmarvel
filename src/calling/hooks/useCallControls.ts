import {Alert} from 'react-native';
import {useEffect} from 'react';
import socket from '../services/socket';
type MediaType = 'audio' | 'video';

type UseCallControlsParams = {
  peerId: string | null;
  setPeerId: (id: string | null) => void;
  setIsDialing: (v: boolean) => void;
  setInCall: (v: boolean) => void;
  setIncomingCall: (v: any) => void;

  // from your existing useCall(userId)
  startCall: (toUserId: string, mediaType: MediaType) => Promise<void>;
  answerCall: () => Promise<void>;
  endCall: () => void;

  // audio helpers
  playOutgoingTone: () => void;
  stopOutgoingTone: () => void;
  playIncomingTone?: () => void; // optional if you call it elsewhere
  stopIncomingTone: () => void;

  // state needed for reject flow
  incomingCall?: {from?: string; mediaType?: MediaType} | null;
};

export default function useCallControls({
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

  const handleAnswer = async () => {
    try {
      await answerCall();
      stopIncomingTone();
      setIncomingCall(null);
      setInCall(true);
    } catch (err) {
      Alert.alert('Answer Error', 'Could not answer call');
    }
  };

  const handleEnd = () => {
    if (peerId) {
      socket.emit('end-call', {to: peerId});
    }
    stopOutgoingTone();
    stopIncomingTone();
    endCall();
    setIncomingCall(null);
    setIsDialing(false);
    setInCall(false);
    setPeerId(null);
  };

  const handleReject = () => {
    stopIncomingTone();
    socket.emit('reject-call', {
      to: incomingCall?.from,
      reason: 'User declined the call',
    });
    setIncomingCall(null);
    endCall();
    setIsDialing(false);
    setInCall(false);
    setPeerId(null);
  };

  useEffect(() => {
    const onPeerEnded = () => {
      stopOutgoingTone();
      stopIncomingTone();
      endCall();
      setIncomingCall(null);
      setIsDialing(false);
      setInCall(false);
      setPeerId(null);
    };
    socket.on('call-ended', onPeerEnded);
    return () => {
      socket.off('call-ended', onPeerEnded);
    };
  }, [
    endCall,
    setIncomingCall,
    setIsDialing,
    setInCall,
    setPeerId,
    stopIncomingTone,
    stopOutgoingTone,
  ]);
  return {handleStartCall, handleAnswer, handleEnd, handleReject};
}

import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, DeviceEventEmitter} from 'react-native';
import CallEventEmitter from './services/CallEventEmitter';
import useCallAudio from './hooks/useCallAudio';
import useSignalingWire from './hooks/useSignalingWire';
import IncomingCallModal from './components/IncomingCallModal';
import {useGetMyData} from '../api/profile/profileFunc';
import {callRoute} from '../screens/AuthScreens/routeName';
import {navigate} from '../navigation/NavigationRef'; // ✅ use global ref, not useNavigation
import socket from './services/socket';
import InCallManager from 'react-native-incall-manager';
import {VolumeManager} from 'react-native-volume-manager';
import {useCallContext} from './context/CallProvider';

const GlobalCallListener = React.memo(function GlobalCallListener() {
  console.log('[GlobalCallListener] Mounted ✅');
  // 🔧 Initialize VolumeManager once
  useEffect(() => {
    console.log('[VolumeListener] Initializing VolumeManager...');
    VolumeManager.showNativeVolumeUI({enabled: false}); // hide native volume popup
    VolumeManager.getVolume().then(v =>
      console.log('[VolumeListener] Current Volume on mount:', v),
    );
    return () => {
      console.log('[VolumeListener] Cleaning up VolumeManager');
    };
  }, []);
  const {data: myData} = useGetMyData();
  const userId = myData?.data?._id;

  const {incomingCall, setIncomingCall, startCall, answerCall, endCall} =
    useCallContext();

  const {
    playIncomingTone,
    stopIncomingTone,
    playOutgoingTone,
    stopOutgoingTone,
  } = useCallAudio({inCall: false});

  useSignalingWire({
    userId,
    peerId: null,
    setPeerId: () => {},
    setInCall: () => {},
    setIsDialing: () => {},
    setIncomingCall,
    stopOutgoingTone,
    stopIncomingTone,
    endCall,
  });

  const [showModal, setShowModal] = useState(false);

  // 🔔 Incoming call handler
  useEffect(() => {
    const handleGlobalIncomingCall = (payload: any) => {
      console.log('[GlobalCallListener] 🚨 Incoming call detected:', payload);
      setIncomingCall(payload);
      playIncomingTone();
      setShowModal(true);
      // ✅ start listening for volume key events to silence ringtone
      console.log('[VolumeListener] Initializing volume listener...');
      const volSub = VolumeManager.addVolumeListener(async (event: any) => {
        console.log('[VolumeListener][DEBUG] Volume event triggered:', event);
        try {
          const currentVol = event?.volume ?? 1;
          console.log('[VolumeListener][DEBUG] Current Volume:', currentVol);

          // 🔇 If volume key pressed during call, instantly mute ringtone
          if (currentVol < 1) {
            console.log('[VolumeListener][ACTION] Muting ringtone');
            await VolumeManager.setVolume(0, {type: 'music'}); // force mute system
            stopIncomingTone?.();
            InCallManager.stopRingtone();
            InCallManager.stopRingback();
          }
        } catch (err) {
          console.warn('[VolumeListener][ERROR]', err);
        }
      });

      // ✅ clean up when call ends or modal closes
      return () => {
        volSub?.remove();
      };
    };

    CallEventEmitter.on('incoming-call', handleGlobalIncomingCall);
    console.log('[GlobalCallListener] Listening for incoming-call events...');
    return () => {
      console.log('[GlobalCallListener] Cleanup listener');
      CallEventEmitter.off('incoming-call', handleGlobalIncomingCall);
    };
  }, [playIncomingTone, setIncomingCall]);

  // ✅ Accept call
  const handleAccept = useCallback(() => {
    console.log('[GlobalCallListener] ▶️ Accept pressed');
    stopIncomingTone();
    setShowModal(false);

    // ✅ Give a small delay to ensure navigation + context sync
    setTimeout(() => {
      console.log('[GlobalCallListener] Navigating to CallingMain');
      navigate('CallStack', {screen: 'CallingMain'});
    }, 300);
  }, [stopIncomingTone, incomingCall, setIncomingCall]);

  // ❌ Reject call
  const handleReject = useCallback(() => {
    console.log('[GlobalCallListener] ❌ Reject pressed');
    stopIncomingTone();

    if (incomingCall?.from && userId) {
      console.log(
        '[GlobalCallListener] 🔴 Emitting reject-call →',
        incomingCall.from,
      );
      socket.emit('reject-call', {
        to: incomingCall.from,
        from: userId,
        reason: 'User declined the call',
      });
    }
    endCall();

    setShowModal(false);
    setIncomingCall(null);
  }, [stopIncomingTone, endCall, setIncomingCall]);

  console.log('[GlobalCallListener] Render → showModal:', showModal);
  console.log('[GlobalCallListener] Render → incomingCall:', incomingCall);

  useEffect(() => {
    const handlePeerEnd = (payload?: any) => {
      console.log('[GlobalCallListener] 📴 Peer ended call:', payload);
      stopIncomingTone();
      setShowModal(false);
      setIncomingCall(null);
    };

    socket.on('end-call', handlePeerEnd);
    socket.on('call-ended', handlePeerEnd);
    socket.on('reject-call', handlePeerEnd);

    return () => {
      socket.off('end-call', handlePeerEnd);
      socket.off('call-ended', handlePeerEnd);
      socket.off('reject-call', handlePeerEnd);
    };
  }, [stopIncomingTone]);

  return (
    <View pointerEvents="box-none" style={{position: 'absolute'}}>
      {showModal && (
        <Text style={{color: 'red', position: 'absolute', top: 40, left: 10}}>
          [GlobalCallListener Active]
        </Text>
      )}

      <IncomingCallModal
        visible={showModal}
        callerId={incomingCall?.from ?? ''}
        mediaType={incomingCall?.mediaType ?? 'audio'}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    </View>
  );
});

export default GlobalCallListener;

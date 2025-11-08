// src/calling/CallingMain.tsx
import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Image,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';

import CallScreen from './components/CallScreen';
import IncomingCallModal from './components/IncomingCallModal';
import CallingUsersList from './components/CallingUsersList';

import {useGetMyData} from '../api/profile/profileFunc';

import useCallAudio from './hooks/useCallAudio';
import useSignalingWire from './hooks/useSignalingWire';
import useCallControls from './hooks/useCallControls';
import {myConsole} from '../utils/myConsole';
import CallEventEmitter from './services/CallEventEmitter';
import {useCall} from './hooks/useCall';

const CallingMain = () => {
  const route = useRoute();
  const routeIncoming = route?.params?.incomingCall;
  const navigation = useNavigation();
  const {data: myData} = useGetMyData();
  const userId = myData?.data?._id;

  const [inCall, setInCall] = useState(false);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isDialing, setIsDialing] = useState(false);
  const [noResponse, setNoResponse] = useState(false);

  const {
    localStream,
    remoteStream,
    incomingCall,
    startCall,
    answerCall,
    endCall,
    setIncomingCall,
  } = useCall(userId);

  // audio (ringtone / ringback + category switching)
  const {
    playIncomingTone,
    stopIncomingTone,
    playOutgoingTone,
    stopOutgoingTone,
  } = useCallAudio({inCall});

  // socket signaling wiring
  useSignalingWire({
    userId,
    peerId,
    setPeerId,
    setInCall,
    setIsDialing,
    setIncomingCall,
    stopOutgoingTone,
    stopIncomingTone,
    endCall,
  });

  // high-level call controls
  const {handleStartCall, handleAnswer, handleEnd, handleReject} =
    useCallControls({
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
    });

  // show modal only when NOT already in a call
  const showIncomingModal = !!incomingCall && !inCall && !isDialing;

  // ✅ Improved watcher to prevent reopening after disconnect
  useEffect(() => {
    if (!remoteStream) return;

    // Guard: ignore inactive or ended streams
    if (
      !remoteStream.active ||
      remoteStream.getTracks().every(t => t.readyState === 'ended')
    ) {
      console.log('[CallState] Ignored stale remote stream');
      return;
    }

    if (!inCall) {
      console.log('[CallState] remoteStream detected → enter inCall');
      setInCall(true);
      setIncomingCall(null);
      stopIncomingTone();
    }
  }, [remoteStream, inCall, setIncomingCall, stopIncomingTone]);

  // 🔔 Auto timeout if call not picked within 15 seconds
  useEffect(() => {
    if (isDialing && !inCall) {
      const timer = setTimeout(() => {
        setNoResponse(true);
        setIsDialing(false);
      }, 15000); // 15 seconds
      return () => clearTimeout(timer);
    } else {
      setNoResponse(false);
    }
  }, [isDialing, inCall]);
  useEffect(() => {
    if (!remoteStream && inCall) {
      console.log('[CallState] remoteStream cleared → exit inCall');
      const t = setTimeout(() => setInCall(false), 300);
      return () => clearTimeout(t);
    }
  }, [remoteStream, inCall]);

  // ensure modal closes immediately on accept/reject even if signaling is slow
  const onAcceptIncoming = React.useCallback(() => {
    stopIncomingTone();
    setIncomingCall(null);
    setIsDialing(false);
    setInCall(prev => (prev ? prev : true));
    handleAnswer();
  }, [
    handleAnswer,
    setIncomingCall,
    stopIncomingTone,
    setIsDialing,
    setInCall,
  ]);
  const onRejectIncoming = React.useCallback(() => {
    handleReject();
    setIncomingCall(null);
  }, [handleReject, setIncomingCall]);

  useEffect(() => {
    // const handleGlobalIncomingCall = (payload: any) => {
    //   console.log('[Global Incoming Call]', payload);
    //   setIncomingCall(payload);
    //   playIncomingTone();
    // };

    // CallEventEmitter.on('incoming-call', handleGlobalIncomingCall);

    // return () => {
    //   CallEventEmitter.off('incoming-call', handleGlobalIncomingCall);
    // };

    if (routeIncoming) {
      console.log('[Nav Incoming Call]', routeIncoming);
      // ✅ first set the call, then answer after slight delay
      setIncomingCall(routeIncoming);
      setTimeout(() => {
        console.log('[Nav Incoming Call] → Triggering handleAnswer after set');
        handleAnswer();
      }, 300);
    }
    // 🔔 Case 2: Event-driven (normal socket-based)
    const handleGlobalIncomingCall = (payload: any) => {
      console.log('[Global Incoming Call]', payload);
      setIncomingCall(payload);
      playIncomingTone();
    };

    CallEventEmitter.on('incoming-call', handleGlobalIncomingCall);
    return () => {
      CallEventEmitter.off('incoming-call', handleGlobalIncomingCall);
    };
  }, []);

  myConsole('inCallsss', inCall);
  return (
    <View style={styles.root}>
      {!inCall && !isDialing && (
        <>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              activeOpacity={0.7}>
              <Image
                source={require('../assets/icons/back.png')}
                style={styles.backIcon}
              />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Available Users</Text>
            <View style={{width: 40}} />
          </View>

          <CallingUsersList
            currentUserId={userId ?? ''}
            onStartCall={handleStartCall}
          />
        </>
      )}

      {(inCall || isDialing) && (
        <View style={styles.callWrapper}>
          <CallScreen
            localStream={localStream}
            remoteStream={remoteStream}
            isDialing={isDialing}
            noResponse={noResponse}
            onEndCall={handleEnd}
          />
        </View>
      )}
      <IncomingCallModal
        visible={showIncomingModal}
        callerId={incomingCall?.from ?? ''}
        mediaType={incomingCall?.mediaType ?? 'video'}
        onAccept={onAcceptIncoming}
        onReject={onRejectIncoming}
      />
    </View>
  );
};

export default CallingMain;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff', // keeps dark background
    width: '100%',
    height: '100%',
  },

  root: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },

  callWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000', // differentiate call screen visually
    zIndex: 999, // ensures it overlays the user list completely
  },
  // Top bar
  topBar: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E9E9E9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#111',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#111',
    fontSize: 17,
    fontWeight: '600',
    marginRight: 40, // balance the back button space
  },
});

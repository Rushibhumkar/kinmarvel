// src/calling/CallingMain.tsx
import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Text, TouchableOpacity, Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import CallScreen from './components/CallScreen';
import IncomingCallModal from './components/IncomingCallModal';
import CallingUsersList from './components/CallingUsersList';

import {useGetMyData} from '../api/profile/profileFunc';
import {useCall} from './hooks/useCall';

import useCallAudio from './hooks/useCallAudio';
import useSignalingWire from './hooks/useSignalingWire';
import useCallControls from './hooks/useCallControls';

const CallingMain = () => {
  const navigation = useNavigation();
  const {data: myData} = useGetMyData();
  const userId = myData?.data?._id;

  const [inCall, setInCall] = useState(false);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isDialing, setIsDialing] = useState(false);

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
  const showIncomingModal = !!incomingCall && !inCall;

  // play ring only while incoming & not connected
  useEffect(() => {
    if (incomingCall?.from && !inCall) {
      setPeerId(incomingCall.from);
      playIncomingTone();
    } else {
      stopIncomingTone();
    }
  }, [incomingCall, inCall, playIncomingTone, stopIncomingTone]);

  // ensure modal closes immediately on accept/reject even if signaling is slow
  const onAcceptIncoming = React.useCallback(() => {
    // Immediately transition UI to CallScreen
    stopIncomingTone();
    setIncomingCall(null);
    setIsDialing(false);
    setInCall(true);
    handleAnswer();
  }, [handleAnswer, setIncomingCall, stopIncomingTone]);
  const onRejectIncoming = React.useCallback(() => {
    handleReject();
    setIncomingCall(null);
  }, [handleReject, setIncomingCall]);

  useEffect(() => {
    if ((localStream || remoteStream) && !inCall) {
      setInCall(true);
      setIncomingCall(null);
      stopIncomingTone();
    }
  }, [localStream, remoteStream, inCall, setIncomingCall, stopIncomingTone]);

  return (
    <View style={styles.container}>
      {!inCall && (
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
        <CallScreen
          localStream={localStream}
          remoteStream={remoteStream}
          onEndCall={handleEnd}
        />
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
    backgroundColor: '#FFFFFF',
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

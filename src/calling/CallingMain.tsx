// src/calling/CallingMain.tsx
import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Text, TouchableOpacity, Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import CallScreen from './components/CallScreen';
import IncomingCallModal from './components/IncomingCallModal';
import CallingUsersList from './components/CallingUsersList';

import {useGetMyData} from '../api/profile/profileFunc';
import {useCall} from './hooks/useCall';

// extracted hooks
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

  // play ring when an incoming call arrives
  useEffect(() => {
    if (incomingCall?.from) {
      setPeerId(incomingCall.from);
      playIncomingTone();
    } else {
      stopIncomingTone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingCall]);

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

          {/* Users List */}
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
        visible={!!incomingCall}
        callerId={incomingCall?.from ?? ''}
        mediaType={incomingCall?.mediaType ?? 'video'}
        onAccept={handleAnswer}
        onReject={handleReject}
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

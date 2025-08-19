import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  Image,
  Vibration,
} from 'react-native';
import CallScreen from './components/CallScreen';
import IncomingCallModal from './components/IncomingCallModal';
import {useGetMyData} from '../api/profile/profileFunc';
import {getData} from '../hooks/useAsyncStorage';
import socket from './services/socket';
import {useNavigation} from '@react-navigation/native';
import Sound from 'react-native-sound';
import {useCall} from './hooks/useCall';
import CallingUsersList from './components/CallingUsersList';

const CallingMain = () => {
  const navigation = useNavigation();
  const {data: myData} = useGetMyData();
  const userId = myData?.data?._id;

  const [inCall, setInCall] = useState(false);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isDialing, setIsDialing] = useState(false);

  // ringtone / ringback refs
  const incomingToneRef = useRef<Sound | null>(null);
  const outgoingToneRef = useRef<Sound | null>(null);

  // preload sounds once
  useEffect(() => {
    Sound.setCategory('Playback', true);

    const incAsset = Image.resolveAssetSource(
      require('../assets/audio/ringtone.mp3'),
    );
    const outAsset = Image.resolveAssetSource(
      require('../assets/audio/outgoing.mp3'),
    );

    const incPath = incAsset?.uri;
    const outPath = outAsset?.uri;

    incomingToneRef.current = new Sound(
      incPath || 'ringtone.mp3',
      incPath ? undefined : Sound.MAIN_BUNDLE,
      err => {
        if (err) {
          console.log('[Sound] incoming load error:', err);
          return;
        }
        incomingToneRef.current?.setNumberOfLoops(-1);
        incomingToneRef.current?.setVolume(1);
      },
    );

    outgoingToneRef.current = new Sound(
      outPath || 'outgoing.mp3',
      outPath ? undefined : Sound.MAIN_BUNDLE,
      err => {
        if (err) {
          console.log('[Sound] outgoing load error:', err);
          return;
        }
        outgoingToneRef.current?.setNumberOfLoops(-1);
        outgoingToneRef.current?.setVolume(1);
      },
    );

    return () => {
      try {
        incomingToneRef.current?.release();
      } catch {}
      try {
        outgoingToneRef.current?.release();
      } catch {}
    };
  }, []);

  const playIncomingTone = () => {
    const s = incomingToneRef.current;
    if (!s) return;
    try {
      s.setCurrentTime?.(0);
      s.play(success => {
        if (!success) console.log('[Sound] incoming play failed');
      });
    } catch {}
    Vibration.vibrate(1000, true);
  };

  const stopIncomingTone = () => {
    const s = incomingToneRef.current;
    Vibration.cancel();
    if (!s) return;
    try {
      s.stop(() => s.setCurrentTime?.(0));
    } catch {}
  };

  const playOutgoingTone = () => {
    const s = outgoingToneRef.current;
    if (!s) return;
    try {
      s.setCurrentTime?.(0);
      s.play(success => {
        if (!success) console.log('[Sound] outgoing play failed');
      });
    } catch {}
  };

  const stopOutgoingTone = () => {
    const s = outgoingToneRef.current;
    if (!s) return;
    try {
      s.stop(() => s.setCurrentTime?.(0));
    } catch {}
  };

  const {
    localStream,
    remoteStream,
    incomingCall,
    startCall,
    answerCall,
    endCall,
    setIncomingCall,
  } = useCall(userId);

  const handleStartCall = async (
    toUserId: string,
    mediaType: 'audio' | 'video',
  ) => {
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
  };

  // adjust category while in active call
  useEffect(() => {
    try {
      Sound.setCategory(inCall ? 'PlayAndRecord' : 'Playback', true);
    } catch {}
  }, [inCall]);

  // play ring when incoming
  useEffect(() => {
    if (incomingCall?.from) {
      setPeerId(incomingCall.from);
      playIncomingTone();
    } else {
      stopIncomingTone();
    }
  }, [incomingCall]);

  // socket wiring for call state
  useEffect(() => {
    const registerSocket = async () => {
      const token = await getData('authToken');
      if (token && userId) {
        socket.auth = {token};
        socket.connect();
        socket.emit('register', userId, token);
      } else {
        console.warn('[Socket] Missing token or userId');
      }
    };

    registerSocket();

    socket.on('call-rejected', () => {
      stopOutgoingTone();
      stopIncomingTone();
      setIncomingCall(null);
      setIsDialing(false);
      setInCall(false);
    });

    socket.on('call-answered', ({from}) => {
      stopOutgoingTone();
      setPeerId(from ?? peerId);
      setIsDialing(false);
      setInCall(true);
    });

    socket.on('call-ended', () => {
      stopOutgoingTone();
      stopIncomingTone();
      setIncomingCall(null);
      setInCall(false);
      setIsDialing(false);
    });

    return () => {
      socket.off('call-rejected');
      socket.off('call-answered');
      socket.off('call-ended');
      socket.disconnect();
      stopOutgoingTone();
      stopIncomingTone();
    };
  }, [peerId, userId]);

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

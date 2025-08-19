import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useCall} from './hooks/useCall';
import CallScreen from './components/CallScreen';
import IncomingCallModal from './components/IncomingCallModal';
import {useGetMyData} from '../api/profile/profileFunc';
import {myConsole} from '../utils/myConsole';
import {useGetAllUsers} from '../api/user/userFunc';
import {getData} from '../hooks/useAsyncStorage';
import socket from './services/socket';
import {useNavigation} from '@react-navigation/native';
import {Vibration} from 'react-native';
import Sound from 'react-native-sound';

const CallingMain = () => {
  const navigation = useNavigation();
  const {data: myData} = useGetMyData();
  const userId = myData?.data?._id;

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetAllUsers();

  const users = data?.pages.flatMap(page => page.data.users) ?? [];

  const [inCall, setInCall] = useState(false);
  const [peerId, setPeerId] = useState<string | null>(null);

  // ringtone / ringback refs
  const incomingToneRef = useRef<Sound | null>(null);
  const outgoingToneRef = useRef<Sound | null>(null);
  // with other useState hooks
  const [isDialing, setIsDialing] = useState(false);

  useEffect(() => {
    Sound.setCategory('Playback', true);

    // Resolve Metro asset to a string URI (avoids passing a numeric require id)
    const incAsset = Image.resolveAssetSource(
      require('../assets/audio/ringtone.mp3'),
    );
    const outAsset = Image.resolveAssetSource(
      require('../assets/audio/outgoing.mp3'),
    );

    const incPath = incAsset?.uri; // e.g. "asset:/ringtone.mp3" or "file://..."
    const outPath = outAsset?.uri;

    incomingToneRef.current = new Sound(
      incPath || 'ringtone.mp3',
      incPath ? undefined : Sound.MAIN_BUNDLE, // fallback to MAIN_BUNDLE if you later move it to /res/raw
      err => {
        if (err) {
          console.log('[Sound] incoming load error:', err);
          return;
        }
        incomingToneRef.current?.setNumberOfLoops(-1);
        incomingToneRef.current?.setVolume(1);
        console.log('[Sound] incoming loaded');
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
        console.log('[Sound] outgoing loaded');
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
    if (!s) {
      console.log('[Sound] incoming not ready');
      return;
    }
    try {
      s.setCurrentTime?.(0);
      s.play(success => {
        if (!success) console.log('[Sound] incoming play failed');
      });
    } catch (e) {
      console.log('[Sound] incoming play error:', e);
    }
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
    if (!s) {
      console.log('[Sound] outgoing not ready');
      return;
    }
    try {
      s.setCurrentTime?.(0);
      s.play(success => {
        if (!success) console.log('[Sound] outgoing play failed');
      });
    } catch (e) {
      console.log('[Sound] outgoing play error:', e);
    }
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
      console.log('[Call] dialing → play outgoing tone');
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
      setIncomingCall(null); // hide the incoming modal after accept
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
    console.log('Reject button clicked');
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
  useEffect(() => {
    if (inCall) {
      try {
        Sound.setCategory('PlayAndRecord', true);
      } catch {}
    } else {
      try {
        Sound.setCategory('Playback', true);
      } catch {}
    }
  }, [inCall]);

  useEffect(() => {
    if (incomingCall?.from) {
      setPeerId(incomingCall.from);
      playIncomingTone();
    } else {
      stopIncomingTone();
    }
  }, [incomingCall]);

  useEffect(() => {
    const registerSocket = async () => {
      const token = await getData('authToken');
      if (token && userId) {
        socket.auth = {token};
        socket.connect();
        socket.emit('register', userId, token);
        socket.once('register', () => {
          console.log('[Socket] Registered successfully. Ready for calls.');
        });
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

    // NEW: callee accepted
    socket.on('call-answered', ({from}) => {
      stopOutgoingTone();
      setPeerId(from ?? peerId);
      setIsDialing(false);
      setInCall(true);
    });

    // NEW: remote ended
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
  }, []);

  const renderUser = ({item}: any) => {
    if (item._id === userId) return null;
    return (
      <View style={styles.userRow}>
        <Text style={styles.userText}>
          {item.firstName} ({item.phone})
        </Text>
        <View style={styles.callButtons}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleStartCall(item._id, 'video')}>
            <Text style={styles.callText}>📹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleStartCall(item._id, 'audio')}>
            <Text style={styles.callText}>📞</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <View style={styles.container}>
      {!inCall && (
        <>
          <Text
            style={{
              position: 'absolute',
              left: 8,
              padding: 12,
              backgroundColor: '#fff',
              borderRadius: 8,
            }}
            onPress={() => navigation.goBack()}>
            Back
          </Text>
          <Text style={styles.heading}>Available Users</Text>
          {isLoading ? (
            <Text style={styles.loading}>Loading users...</Text>
          ) : isError ? (
            <Text style={styles.error}>Error loading users</Text>
          ) : (
            <FlatList
              data={users}
              keyExtractor={item => item._id}
              renderItem={renderUser}
              contentContainerStyle={styles.listContainer}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                hasNextPage && isFetchingNextPage ? (
                  <ActivityIndicator size="small" color="#0f0" />
                ) : null
              }
            />
          )}
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
    backgroundColor: '#101010',
    padding: 16,
  },
  heading: {
    color: '#fff',
    fontSize: 22,
    marginBottom: 10,
    alignSelf: 'center',
  },
  loading: {
    color: '#888',
    textAlign: 'center',
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 30,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
  },
  userText: {
    color: '#fff',
    fontSize: 16,
  },
  callButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  callButton: {
    padding: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
  },
  callText: {
    color: '#0f0',
    fontSize: 16,
  },
});

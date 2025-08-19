// src/calling/CallingMain.tsx
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
  Vibration,
} from 'react-native';
import CallScreen from './components/CallScreen';
import IncomingCallModal from './components/IncomingCallModal';
import {useGetMyData} from '../api/profile/profileFunc';
import {useGetAllUsers} from '../api/user/userFunc';
import {getData} from '../hooks/useAsyncStorage';
import socket from './services/socket';
import {useNavigation} from '@react-navigation/native';
import Sound from 'react-native-sound';
import {useCall} from './hooks/useCall';

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

  const renderUser = ({item}: any) => {
    if (item._id === userId) return null;
    const fullName = [item.firstName, item.lastName].filter(Boolean).join(' ');
    return (
      <View style={styles.card}>
        <View style={{flex: 1}}>
          <Text style={styles.name} numberOfLines={1}>
            {fullName || 'User'}
          </Text>
          {!!item.phone && (
            <Text style={styles.phone} numberOfLines={1}>
              {item.phone}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.circleBtn, styles.videoBtn]}
            onPress={() => handleStartCall(item._id, 'video')}
            activeOpacity={0.85}>
            <Text style={styles.circleEmoji}>📹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.circleBtn, styles.audioBtn]}
            onPress={() => handleStartCall(item._id, 'audio')}
            activeOpacity={0.85}>
            <Text style={styles.circleEmoji}>📞</Text>
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

          {/* List / States */}
          {isLoading ? (
            <View style={styles.centerWrap}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingTxt}>Loading users…</Text>
            </View>
          ) : isError ? (
            <View style={styles.centerWrap}>
              <Text style={styles.errorTxt}>Error loading users</Text>
            </View>
          ) : (
            <FlatList
              data={users}
              keyExtractor={item => item._id}
              renderItem={renderUser}
              contentContainerStyle={styles.listContent}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              ListEmptyComponent={
                <View style={styles.centerWrap}>
                  <Text style={styles.emptyTxt}>No users found</Text>
                </View>
              }
              ListFooterComponent={
                hasNextPage && isFetchingNextPage ? (
                  <View style={styles.footerLoading}>
                    <ActivityIndicator size="small" color="#007AFF" />
                  </View>
                ) : (
                  <View style={{height: 12}} />
                )
              }
              showsVerticalScrollIndicator={false}
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

  // List
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDEDED',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
  },
  name: {color: '#111', fontSize: 15.5, fontWeight: '600'},
  phone: {color: '#777', fontSize: 13, marginTop: 2},

  actions: {flexDirection: 'row', gap: 10, marginLeft: 10},
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  videoBtn: {backgroundColor: '#E8F1FF', borderColor: '#D6E7FF'},
  audioBtn: {backgroundColor: '#E9F9EE', borderColor: '#D9F2E2'},
  circleEmoji: {fontSize: 18},

  // States
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingTxt: {color: '#666', marginTop: 8},
  errorTxt: {color: '#E03A3A', fontSize: 15, marginTop: 12},
  emptyTxt: {color: '#777', fontSize: 15},
  footerLoading: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});

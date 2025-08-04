import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
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
      setInCall(true);
    } catch (err) {
      Alert.alert('Call Error', `Could not start ${mediaType} call`);
    }
  };

  const handleAnswer = async () => {
    try {
      await answerCall();
      setInCall(true);
    } catch (err) {
      Alert.alert('Answer Error', 'Could not answer call');
    }
  };

  const handleEnd = () => {
    endCall();
    setInCall(false);
  };
  const handleReject = () => {
    console.log('Reject button clicked'); // <--- add this
    socket.emit('reject-call', {
      to: incomingCall?.from,
      reason: 'User declined the call',
    });
    setIncomingCall(null);
    endCall();
    setInCall(false);
  };

  useEffect(() => {
    const registerSocket = async () => {
      const token = await getData('authToken');

      if (token && userId) {
        console.log('[Socket] Connecting wit h token...');
        socket.auth = {token};
        socket.connect();

        socket.emit('register', userId, token);

        socket.once('register', () => {
          console.log('[Socket] Registered successfully. Ready for calls.');
          // Optionally, you can set a flag like `setIsSocketReady(true)` if needed
        });
      } else {
        console.warn('[Socket] Missing token or userId');
      }
    };

    registerSocket();
    socket.on('call-rejected', () => {
      setInCall(false);
    });

    return () => {
      socket.off('call-rejected');
      socket.disconnect();
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

      {inCall && (
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

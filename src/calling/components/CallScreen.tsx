// src/components/CallScreen.tsx

import React from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {RTCView} from 'react-native-webrtc';

type Props = {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEndCall: () => void;
};

const CallScreen: React.FC<Props> = ({
  localStream,
  remoteStream,
  onEndCall,
}) => {
  return (
    <View style={styles.container}>
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
        />
      ) : (
        <View style={styles.remoteVideoPlaceholder}>
          <Text style={styles.text}>Waiting for remote...</Text>
        </View>
      )}

      {localStream && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localVideo}
          objectFit="cover"
          zOrder={1}
        />
      )}

      <TouchableOpacity style={styles.endCallButton} onPress={onEndCall}>
        <Text style={styles.endCallText}>End Call</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CallScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  remoteVideo: {
    flex: 1,
    width: '100%',
  },
  remoteVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  localVideo: {
    position: 'absolute',
    width: 120,
    height: 180,
    top: 20,
    right: 20,
    borderRadius: 8,
    zIndex: 2,
  },
  endCallButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'red',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  endCallText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  text: {
    color: '#aaa',
    fontSize: 16,
  },
});

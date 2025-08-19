// src/calling/components/CallScreen.tsx
import React, {useMemo, useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {RTCView} from 'react-native-webrtc';

const CallScreen = ({localStream, remoteStream, onEndCall}: any) => {
  const [isMuted, setIsMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const hasRemote = !!remoteStream;
  const hasLocal = !!localStream;

  const localAudioTrack = useMemo(
    () => (hasLocal ? localStream.getAudioTracks?.()[0] : undefined),
    [hasLocal, localStream],
  );
  const localVideoTrack = useMemo(
    () => (hasLocal ? localStream.getVideoTracks?.()[0] : undefined),
    [hasLocal, localStream],
  );

  const toggleMute = () => {
    if (!localAudioTrack) return;
    const nextEnabled = !localAudioTrack.enabled;
    localAudioTrack.enabled = nextEnabled;
    setIsMuted(!nextEnabled);
  };

  const toggleVideo = () => {
    if (!localVideoTrack) return;
    const nextEnabled = !localVideoTrack.enabled;
    localVideoTrack.enabled = nextEnabled;
    setVideoOff(!nextEnabled);
  };

  const flipCamera = () => {
    // react-native-webrtc exposes _switchCamera on the video track
    // guard so it won't crash if not present (e.g., audio-only call)
    try {
      // @ts-ignore private API on native track
      localVideoTrack?._switchCamera?.();
    } catch {}
  };

  return (
    <View style={styles.container}>
      {hasRemote ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
        />
      ) : (
        <View style={styles.remoteVideoPlaceholder}>
          <Text style={styles.text}>Connecting…</Text>
        </View>
      )}

      {hasLocal && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localVideo}
          objectFit="cover"
          zOrder={1}
        />
      )}

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.ctrlBtn, isMuted && styles.ctrlBtnActive]}
          onPress={toggleMute}
          activeOpacity={0.7}>
          <Text style={styles.ctrlText}>{isMuted ? '🔇' : '🎤'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctrlBtn, videoOff && styles.ctrlBtnActive]}
          onPress={toggleVideo}
          activeOpacity={0.7}>
          <Text style={styles.ctrlText}>{videoOff ? '📵' : '🎥'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ctrlBtn}
          onPress={flipCamera}
          disabled={!localVideoTrack}
          activeOpacity={0.7}>
          <Text
            style={[styles.ctrlText, !localVideoTrack && styles.ctrlTextDim]}>
            🔄
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.endCallButton}
          onPress={onEndCall}
          activeOpacity={0.8}>
          <Text style={styles.endCallText}>End</Text>
        </TouchableOpacity>
      </View>
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

  controlsRow: {
    position: 'absolute',
    bottom: 34,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ctrlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctrlBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  ctrlText: {fontSize: 22, color: '#fff'},
  ctrlTextDim: {opacity: 0.4},

  endCallButton: {
    height: 56,
    paddingHorizontal: 22,
    borderRadius: 28,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  text: {
    color: '#aaa',
    fontSize: 16,
  },
});

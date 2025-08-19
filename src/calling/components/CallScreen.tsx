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
<<<<<<< HEAD
    try {
      // @ts-ignore native track helper (RN WebRTC)
=======
    // react-native-webrtc exposes _switchCamera on the video track
    // guard so it won't crash if not present (e.g., audio-only call)
    try {
      // @ts-ignore private API on native track
>>>>>>> 3d5f4b16b11e494635cbf9e943760cbe3fa01d35
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
<<<<<<< HEAD
          <Text style={styles.placeholderTitle}>Connecting…</Text>
          <Text style={styles.placeholderSub}>Waiting for the other user</Text>
=======
          <Text style={styles.text}>Connecting…</Text>
>>>>>>> 3d5f4b16b11e494635cbf9e943760cbe3fa01d35
        </View>
      )}

      {hasLocal && (
<<<<<<< HEAD
        <View style={styles.localPreviewWrap}>
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            zOrder={1}
          />
          {videoOff && (
            <View style={styles.localOverlay}>
              <Text style={styles.localOverlayText}>Video Off</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.bottomBar}>
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
            style={[styles.ctrlBtn, !localVideoTrack && styles.ctrlBtnDisabled]}
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
            activeOpacity={0.85}>
            <Text style={styles.endCallText}>End</Text>
          </TouchableOpacity>
        </View>
=======
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
>>>>>>> 3d5f4b16b11e494635cbf9e943760cbe3fa01d35
      </View>
    </View>
  );
};

export default CallScreen;

const BAR_BG = '#0B0B0B';
const BTN_BG = '#1F1F1F';
const BTN_BG_ACTIVE = '#343434';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // full opaque
  },

  // Remote video fills the screen
  remoteVideo: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
  },

  remoteVideoPlaceholder: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  placeholderSub: {
    color: '#B5B5B5',
    fontSize: 13,
  },

  // Local preview framed (no transparency)
  localPreviewWrap: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 130,
    height: 184,
    backgroundColor: '#000', // opaque behind local video
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
  },
<<<<<<< HEAD
  localVideo: {
    width: '100%',
    height: '100%',
  },
  localOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  localOverlayText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Bottom bar with solid background
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 22,
    paddingHorizontal: 16,
  },
  controlsRow: {
    backgroundColor: BAR_BG, // opaque bar
    borderRadius: 32,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
  },

=======

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
>>>>>>> 3d5f4b16b11e494635cbf9e943760cbe3fa01d35
  ctrlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
<<<<<<< HEAD
    backgroundColor: BTN_BG, // solid, not translucent
=======
    backgroundColor: 'rgba(255,255,255,0.14)',
>>>>>>> 3d5f4b16b11e494635cbf9e943760cbe3fa01d35
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctrlBtnActive: {
<<<<<<< HEAD
    backgroundColor: BTN_BG_ACTIVE,
  },
  ctrlBtnDisabled: {
    backgroundColor: '#2A2A2A',
  },
  ctrlText: {fontSize: 22, color: '#fff'},
  ctrlTextDim: {opacity: 0.45},
=======
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  ctrlText: {fontSize: 22, color: '#fff'},
  ctrlTextDim: {opacity: 0.4},
>>>>>>> 3d5f4b16b11e494635cbf9e943760cbe3fa01d35

  endCallButton: {
    height: 56,
    paddingHorizontal: 22,
    borderRadius: 28,
<<<<<<< HEAD
    backgroundColor: '#E53935', // solid red
=======
    backgroundColor: '#E53935',
>>>>>>> 3d5f4b16b11e494635cbf9e943760cbe3fa01d35
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallText: {
<<<<<<< HEAD
    color: '#fff',
    fontWeight: '800',
=======
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  text: {
    color: '#aaa',
>>>>>>> 3d5f4b16b11e494635cbf9e943760cbe3fa01d35
    fontSize: 16,
    letterSpacing: 0.3,
  },
});

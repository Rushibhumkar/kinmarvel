// src/calling/components/CallScreen.tsx
import React, {useMemo, useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {RTCView} from 'react-native-webrtc';

const BAR_BG = '#0B0B0B';
const BTN_BG = '#1F1F1F';
const BTN_BG_ACTIVE = '#343434';

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
    try {
      // @ts-ignore (_switchCamera is native on RNWebRTC tracks)
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
          <Text style={styles.placeholderTitle}>Connecting…</Text>
          <Text style={styles.placeholderSub}>Waiting for the other user</Text>
        </View>
      )}

      {hasLocal && (
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

      {/* Bottom controls */}
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
      </View>
    </View>
  );
};

export default CallScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // opaque background
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

  // Local preview framed (solid, not translucent)
  localPreviewWrap: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 130,
    height: 184,
    backgroundColor: '#000',
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

  // Bottom bar (solid)
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 22,
    paddingHorizontal: 16,
  },
  controlsRow: {
    backgroundColor: BAR_BG,
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

  ctrlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BTN_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctrlBtnActive: {
    backgroundColor: BTN_BG_ACTIVE,
  },
  ctrlBtnDisabled: {
    backgroundColor: '#2A2A2A',
  },
  ctrlText: {fontSize: 22, color: '#fff'},
  ctrlTextDim: {opacity: 0.45},

  endCallButton: {
    height: 56,
    paddingHorizontal: 22,
    borderRadius: 28,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
});

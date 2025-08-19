// src/calling/components/IncomingCallModal.tsx

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';

type Props = {
  visible: boolean;
  callerId: string;
  mediaType: 'audio' | 'video';
  onAccept: () => void;
  onReject: () => void;
};

const IncomingCallModal: React.FC<Props> = ({
  visible,
  callerId,
  mediaType,
  onAccept,
  onReject,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onReject}>
      <View style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="rgba(0,0,0,0.2)"
          barStyle="light-content"
        />

        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.title}>Incoming {mediaType} call</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onReject}
            hitSlop={{top: 10, left: 10, right: 10, bottom: 10}}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Center content */}
        <View style={styles.center}>
          <Text style={styles.subtext}>From</Text>
          <Text style={styles.caller}>{callerId}</Text>
          <Text style={styles.ringing}>Ringing…</Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomRow}>
          <View style={styles.action}>
            <TouchableOpacity
              style={[styles.circleBtn, styles.rejectBg]}
              onPress={onReject}
              activeOpacity={0.8}>
              <Text style={styles.btnIcon}>📵</Text>
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Reject</Text>
          </View>

          <View style={styles.action}>
            <TouchableOpacity
              style={[styles.circleBtn, styles.acceptBg]}
              onPress={onAccept}
              activeOpacity={0.8}>
              <Text style={styles.btnIcon}>📞</Text>
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Accept</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default IncomingCallModal;

const EDGE = Platform.select({ios: 24, android: 16}) as number;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0b',
    paddingTop: EDGE + 24,
    paddingHorizontal: 20,
    paddingBottom: EDGE,
  },

  // Top
  topBar: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {color: '#fff', fontSize: 18, fontWeight: '700'},
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  closeText: {fontSize: 18, color: '#fff', fontWeight: '700'},

  // Center
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtext: {color: '#aaa', fontSize: 14, marginBottom: 6},
  caller: {color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8},
  ringing: {color: '#7dd3fc', fontSize: 15},

  // Bottom
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  action: {alignItems: 'center', gap: 8},
  circleBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBg: {backgroundColor: '#22c55e'},
  rejectBg: {backgroundColor: '#ef4444'},
  btnIcon: {fontSize: 28, color: '#fff'},
  actionLabel: {color: '#e5e7eb', fontSize: 13},
});

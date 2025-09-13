// src/screens/PostStack/components/CommentSheet.tsx
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
  PanResponder,
  KeyboardAvoidingView,
} from 'react-native';
import CommentsList from './CommentsList';
import CommentComposer from './CommentComposer';

/* ===========================
   COMPONENT: Bottom Sheet for Comments
   =========================== */
const CommentSheet = ({
  visible,
  onClose,
  postId,
  onCommentCountChange,
}: any) => {
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const MIN_PCT = 0.55; // collapsed height = 55% of screen
  const MAX_PCT = 0.98; // expanded height = 98% of screen
  const INIT_PCT = 0.7; // initial height when opening

  const [heightPct, setHeightPct] = useState(INIT_PCT);
  const animatedHeight = useRef(
    new Animated.Value(SCREEN_HEIGHT * INIT_PCT),
  ).current;
  const topRadius = useMemo(() => (heightPct > 0.9 ? 18 : 16), [heightPct]);

  useEffect(() => {
    if (visible) {
      setHeightPct(INIT_PCT);
      Animated.timing(animatedHeight, {
        toValue: SCREEN_HEIGHT * INIT_PCT,
        duration: 180,
        useNativeDriver: false,
      }).start();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const panY = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panY.current = 0;
      },
      onPanResponderMove: (_evt, gesture) => {
        panY.current = gesture.dy;
        // negative dy => dragging up (increase height), positive => down (decrease)
        const current = SCREEN_HEIGHT * heightPct - gesture.dy;
        const clamped = Math.min(
          SCREEN_HEIGHT * MAX_PCT,
          Math.max(SCREEN_HEIGHT * MIN_PCT, current),
        );
        animatedHeight.setValue(clamped);
      },
      onPanResponderRelease: (_evt, gesture) => {
        // snap to closest of MIN or MAX depending on drag direction / threshold
        const goingUp = gesture.dy < 0;
        const targetPct = goingUp ? MAX_PCT : MIN_PCT;
        setHeightPct(targetPct);
        Animated.spring(animatedHeight, {
          toValue: SCREEN_HEIGHT * targetPct,
          useNativeDriver: false,
          bounciness: 4,
        }).start();
      },
    }),
  ).current;

  return (
    <Modal
      animationType={Platform.OS === 'ios' ? 'slide' : 'fade'}
      visible={visible}
      transparent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.sheet,
            {
              height: animatedHeight,
              borderTopLeftRadius: topRadius,
              borderTopRightRadius: topRadius,
            },
          ]}>
          <View style={styles.grabberWrap} {...panResponder.panHandlers}>
            <View style={styles.grabber} />
          </View>
          <View style={styles.header}>
            <Text style={styles.title}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={{flex: 1}}>
            <CommentsList postId={postId} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
            <CommentComposer
              postId={postId}
              onSubmitted={() => onCommentCountChange?.(postId, +1)}
            />
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CommentSheet;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  grabberWrap: {alignItems: 'center', paddingTop: 8},
  grabber: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
  },
  header: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {fontWeight: '700', fontSize: 16, color: '#111827'},
  closeBtn: {position: 'absolute', right: 10, top: 6, padding: 8},
  closeText: {fontSize: 16, color: '#111827'},
});

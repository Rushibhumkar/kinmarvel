// src/screens/PostStack/components/CommentActions.tsx
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/* ===========================
   COMPONENT: Comment/Reply Action Row
   =========================== */
const CommentActions = ({
  liked,
  likeCount = 0,
  onToggleLike,
  loadingLike = false,
  onReply,
  onMore, // now labeled "Edit/Delete"
  onShowReplies, // NEW: toggle nested comments
  repliesCount = 0,
  showReplyButton = true,
}: any) => {
  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.btn, liked && styles.btnActive]}
        onPress={onToggleLike}
        disabled={loadingLike}>
        {loadingLike ? (
          <ActivityIndicator size="small" />
        ) : (
          <Text style={[styles.btnText, liked && styles.btnTextActive]}>
            ❤ {likeCount}
          </Text>
        )}
      </Pressable>

      {showReplyButton ? (
        <Pressable style={styles.btn} onPress={onReply}>
          <Text style={styles.btnText}>Reply</Text>
        </Pressable>
      ) : null}

      <Pressable style={styles.btn} onPress={onMore}>
        <Text style={styles.btnText}>Edit/Delete</Text>
      </Pressable>
      {onShowReplies ? (
        <Pressable style={styles.btn} onPress={onShowReplies}>
          <Text style={styles.btnText}>
            More{repliesCount ? ` (${repliesCount})` : ''}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
};

export default CommentActions;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingLeft: 6,
    paddingTop: 4,
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  btnActive: {
    backgroundColor: '#fee2e2',
  },
  btnText: {
    color: '#111827',
    fontWeight: '600',
  },
  btnTextActive: {
    color: '#b91c1c',
  },
});

// src/screens/PostStack/components/ReplyItem.tsx
import React, {useMemo, useState} from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {myConsole} from '../../../utils/myConsole';
import {
  useLikeUnlikeReply,
  usePatchReply,
} from '../../../hooks/comments/useReplyMutations';
import CommentActions from './CommentActions';
import {color} from '../../../const/color';
import ReplyComposer from './ReplyComposer';

/* ===========================
   COMPONENT: Single Reply Row
   =========================== */
const ReplyItem = ({
  postId,
  commentId,
  reply,
  currentUser,
  onAfterEdit,
  onAfterDelete,
  onCreateNestedReply,
}: any) => {
  const initialLiked = !!reply?.isLikedByMe;
  const initialCount = reply?.likeCount ?? 0;

  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [showReplyInput, setShowReplyInput] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(reply?.content || '');

  const authorName = useMemo(() => {
    const by = reply?.by;
    if (by && typeof by === 'object') {
      return (
        by.fullName ||
        `${by?.firstName || ''} ${by?.lastName || ''}`.trim() ||
        by?.userName ||
        'User'
      );
    }
    // if API returned only an id (string) and it matches current user, use current user's name
    if (
      typeof by === 'string' &&
      currentUser &&
      (by === currentUser._id || by === currentUser.id)
    ) {
      return (
        currentUser.fullName ||
        `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() ||
        currentUser.userName ||
        'You'
      );
    }
    return 'User';
  }, [reply, currentUser]);

  const {mutateAsync: toggleLikeReq, isPending: liking} = useLikeUnlikeReply({
    postId,
  });
  const {mutateAsync: patchReplyReq, isPending: patching} = usePatchReply({
    postId,
  });

  const handleToggleLike = async () => {
    try {
      const next = liked ? 'unlike' : 'like';
      // optimistic
      setLiked(!liked);
      setLikeCount((prev: any) =>
        Math.max(0, prev + (next === 'like' ? 1 : -1)),
      );
      await toggleLikeReq({commentId, replyId: reply?._id, action: next});
    } catch (e) {
      // rollback
      setLiked(liked);
      setLikeCount(initialCount);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete reply?', 'This action cannot be undone.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await patchReplyReq({
              commentId,
              replyId: reply?._id,
              action: 'delete',
            });
            onAfterDelete?.(reply?._id);
          } catch (e) {
            // myConsole('[ReplyItem] delete error', e);
          }
        },
      },
    ]);
  };

  const openEdit = () => {
    setEditText(reply?.content || '');
    setIsEditing(true);
  };

  const submitEdit = async () => {
    if (!editText?.trim()) {
      Alert.alert('Empty reply', 'Please write something.');
      return;
    }
    try {
      const res = await patchReplyReq({
        commentId,
        replyId: reply?._id,
        action: 'edit',
        content: editText,
      });
      onAfterEdit?.(
        res?.reply || {...reply, content: editText, isEdited: true},
      );
      setIsEditing(false);
    } catch (e) {
      // myConsole('[ReplyItem] edit error', e);
    }
  };

  const renderWithMentions = (text: any) => {
    if (!text) return null;
    const parts = String(text).split(/(\B@[a-zA-Z0-9._]+)/g);
    return parts.map((part, idx) =>
      /\B@[a-zA-Z0-9._]+/.test(part) ? (
        <Text key={idx} style={styles.mention}>
          {part}
        </Text>
      ) : (
        <Text key={idx}>{part}</Text>
      ),
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.author}>{authorName}</Text>
        <Text style={styles.content}>
          {renderWithMentions(reply?.content)}
          {reply?.isEdited ? (
            <Text style={styles.edited}> (edited)</Text>
          ) : null}
        </Text>
      </View>

      <CommentActions
        liked={liked}
        likeCount={likeCount}
        onToggleLike={handleToggleLike}
        loadingLike={liking}
        onMore={() => {
          if (Platform.OS === 'ios') {
            // simple sheet alternative
            Alert.alert('Reply options', undefined, [
              {text: 'Edit', onPress: openEdit},
              {text: 'Delete', style: 'destructive', onPress: confirmDelete},
              {text: 'Cancel', style: 'cancel'},
            ]);
          } else {
            // Android fallback using same Alert
            Alert.alert('Reply options', undefined, [
              {text: 'Edit', onPress: openEdit},
              {text: 'Delete', style: 'destructive', onPress: confirmDelete},
              {text: 'Cancel', style: 'cancel'},
            ]);
          }
        }}
        onReply={() => setShowReplyInput(v => !v)}
        showReplyButton={true}
      />

      {showReplyInput ? (
        <View style={{marginTop: 6, paddingLeft: 6}}>
          <ReplyComposer
            postId={postId}
            commentId={commentId}
            replyTo={reply?.by?._id || reply?.by || null}
            replyingUser={
              typeof reply?.by === 'object'
                ? {_id: reply?.by?._id, userName: reply?.by?.userName}
                : null
            }
            onSubmitted={(res: any) => {
              const newR = res?.reply;
              if (newR) {
                onCreateNestedReply?.(newR);
              }
              setShowReplyInput(false);
            }}
          />
        </View>
      ) : null}

      {/* Inline Edit Modal */}
      <Modal animationType="fade" visible={isEditing} transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit reply</Text>
            <TextInput
              style={styles.input}
              value={editText}
              placeholderTextColor={'grey'}
              onChangeText={setEditText}
              placeholder="Update your reply"
              multiline
            />
            <View style={styles.modalRow}>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() => setIsEditing(false)}>
                <Text style={[styles.btnText, styles.btnGhostText]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.btn,
                  styles.btnPrimary,
                  patching && styles.btnDisabled,
                ]}
                onPress={submitEdit}
                disabled={patching}>
                <Text style={styles.btnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ReplyItem;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  body: {
    marginBottom: 6,
  },
  author: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  content: {
    color: '#111',
    lineHeight: 20,
  },
  edited: {
    color: '#6b7280',
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
  },
  modalTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
    color: '#111827',
  },
  mention: {color: '#3b82f6'},
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    minHeight: 60,
    textAlignVertical: 'top',
    color: color.titleColor,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  btnPrimary: {
    backgroundColor: '#111827',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
  },
  btnGhostText: {
    color: '#111827',
  },
});

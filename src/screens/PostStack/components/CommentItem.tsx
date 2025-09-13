// src/screens/PostStack/components/CommentItem.tsx
import React, {useMemo, useState} from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import CommentActions from './CommentActions';
import ReplyItem from './ReplyItem';
import ReplyComposer from './ReplyComposer';
import {
  useLikeUnlikeComment,
  usePatchComment,
} from '../../../hooks/comments/useCommentMutations';
import {useCreateReply} from '../../../hooks/comments/useReplyMutations';
import {myConsole} from '../../../utils/myConsole';
import {color} from '../../../const/color';

/* ===========================
   COMPONENT: Single Comment Row
   =========================== */
const CommentItem = ({
  postId,
  comment,
  onAfterDelete,
  onAfterReplyAdded,
}: any) => {
  const [liked, setLiked] = useState(!!comment?.isLikedByMe);
  const [likeCount, setLikeCount] = useState(comment?.likeCount ?? 0);
  const [replies, setReplies] = useState<any[]>(
    Array.isArray(comment?.replies) ? comment.replies : [],
  );
  const [replyCount, setReplyCount] = useState(
    comment?.replyCount ?? replies.length ?? 0,
  );

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment?.content || '');
  const [content, setContent] = useState(comment?.content || '');
  const [isEdited, setIsEdited] = useState(!!comment?.isEdited);

  const {mutateAsync: likeReq, isPending: liking} = useLikeUnlikeComment({
    postId,
  });
  const {mutateAsync: patchReq, isPending: patching} = usePatchComment({
    postId,
  });
  const {mutateAsync: createReplyReq, isPending: replying} = useCreateReply({
    postId,
  });
  const authorName = useMemo(() => {
    const by = comment?.by || {};
    return (
      by?.fullName ||
      `${by?.firstName || ''} ${by?.lastName || ''}`.trim() ||
      by?.userName ||
      'User'
    );
  }, [comment]);

  const toggleLike = async () => {
    try {
      const next = liked ? 'unlike' : 'like';
      // optimistic
      setLiked(!liked);
      setLikeCount((prev: any) =>
        Math.max(0, prev + (next === 'like' ? 1 : -1)),
      );
      await likeReq({commentId: comment?._id, action: next});
    } catch (e) {
      // rollback on failure
      setLiked(liked);
      setLikeCount(comment?.likeCount ?? 0);
      myConsole('[CommentItem] like error', e);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete comment?', 'This action cannot be undone.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await patchReq({commentId: comment?._id, action: 'delete'});
            onAfterDelete?.(comment?._id);
          } catch (e) {
            myConsole('[CommentItem] delete error', e);
          }
        },
      },
    ]);
  };

  const openEdit = () => {
    setEditText(content);
    setIsEditing(true);
  };

  const submitEdit = async () => {
    if (!editText?.trim()) {
      Alert.alert('Empty comment', 'Please write something.');
      return;
    }
    try {
      const res = await patchReq({
        commentId: comment?._id,
        action: 'edit',
        content: editText,
      });
      const updated = res?.comment || {content: editText, isEdited: true};
      setContent(updated?.content ?? editText);
      setIsEdited(true);
      setIsEditing(false);
    } catch (e) {
      myConsole('[CommentItem] edit error', e);
    }
  };

  const handleAddReply = async ({content: replyText, replyTo = null}: any) => {
    try {
      const res = await createReplyReq({
        commentId: comment?._id,
        content: replyText,
        replyTo,
      });
      const newReply = res?.reply;
      if (newReply) {
        setReplies(prev => [newReply, ...prev]);
        setReplyCount((prev: any) => prev + 1);
        onAfterReplyAdded?.(res);
      }
      setShowReplyInput(false);
    } catch (e) {
      myConsole('[CommentItem] add reply error', e);
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
      {/* Body */}
      <View style={styles.row}>
        <View style={{flex: 1}}>
          <Text style={styles.author}>{authorName}</Text>
          <Text style={styles.content}>
            {renderWithMentions(content)}
            {isEdited ? <Text style={styles.edited}> (edited)</Text> : null}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <CommentActions
        liked={liked}
        likeCount={likeCount}
        onToggleLike={toggleLike}
        loadingLike={liking}
        onReply={() => setShowReplyInput(v => !v)}
        onMore={() =>
          Alert.alert('Comment options', undefined, [
            {text: 'Edit', onPress: openEdit},
            {text: 'Delete', style: 'destructive', onPress: confirmDelete},
            {text: 'Cancel', style: 'cancel'},
          ])
        }
        showReplyButton
      />

      {/* Reply composer */}
      {showReplyInput ? (
        <View style={{marginTop: 6}}>
          <ReplyComposer
            postId={postId}
            commentId={comment?._id}
            replyTo={comment?.by?._id ?? null}
            replyingUser={{
              _id: comment?.by?._id,
              userName: comment?.by?.userName,
            }}
            onSubmitted={(res: any) =>
              handleAddReply({
                content: res?.reply?.content,
                replyTo: res?.reply?.replyTo ?? comment?.by?._id ?? null,
              })
            }
          />
        </View>
      ) : null}

      {/* Replies */}
      {replyCount > 0 ? (
        <View style={styles.repliesWrap}>
          {replies.map((r: any) => (
            <ReplyItem
              key={r?._id}
              postId={postId}
              commentId={comment?._id}
              reply={r}
              onAfterEdit={(updated: any) => {
                // update in-place
                setReplies(prev =>
                  prev.map(it =>
                    it?._id === (updated?._id ?? r?._id)
                      ? {...it, ...updated}
                      : it,
                  ),
                );
              }}
              onAfterDelete={(replyId: string) => {
                setReplies(prev => prev.filter(it => it?._id !== replyId));
                setReplyCount((prev: any) => Math.max(0, prev - 1));
              }}
            />
          ))}
          {replying ? (
            <View style={{paddingVertical: 6}}>
              <Text style={{color: '#6b7280'}}>Posting reply…</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Edit modal */}
      <Modal animationType="fade" visible={isEditing} transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit comment</Text>
            <TextInput
              style={styles.input}
              value={editText}
              placeholderTextColor={'grey'}
              onChangeText={setEditText}
              placeholder="Update your comment"
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

export default CommentItem;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  row: {flexDirection: 'row'},
  mention: {color: '#3b82f6'},
  author: {fontWeight: '700', color: '#111827', marginBottom: 2},
  content: {color: '#111', lineHeight: 20},
  edited: {color: '#6b7280', fontSize: 12},
  repliesWrap: {
    marginTop: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#f3f4f6',
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
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    color: color.titleColor,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    minHeight: 60,
    textAlignVertical: 'top',
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

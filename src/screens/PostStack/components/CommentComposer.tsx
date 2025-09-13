// src/screens/PostStack/components/CommentComposer.tsx
import React, {useState} from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {myConsole} from '../../../utils/myConsole';
import {useCreateComment} from '../../../hooks/comments/useCommentMutations';
import {color} from '../../../const/color';

/* ===========================
   COMPONENT: New Comment Input
   =========================== */
const CommentComposer = ({
  postId,
  limit = 10,
  onSubmitted,
  placeholder = 'Add a comment…',
  autoFocus = false,
}: any) => {
  const [text, setText] = useState('');
  const {mutateAsync: createComment, isPending} = useCreateComment({
    postId,
    limit,
  });

  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;
    try {
      const res = await createComment({content});
      myConsole('[CommentComposer] submitted', res);
      setText('');
      Keyboard.dismiss();
      onSubmitted?.(res);
    } catch (e) {
      myConsole('[CommentComposer] error', e);
    }
  };

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={text}
        placeholderTextColor={'grey'}
        onChangeText={setText}
        placeholder={placeholder}
        autoFocus={autoFocus}
        editable={!isPending}
        multiline
      />
      <Pressable
        style={[styles.sendBtn, (isPending || !text.trim()) && styles.disabled]}
        onPress={handleSend}
        disabled={isPending || !text.trim()}>
        <Text style={styles.sendText}>Send</Text>
      </Pressable>
    </View>
  );
};

export default CommentComposer;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    fontSize: 14.5,
    color: color.titleColor,
  },
  sendBtn: {
    backgroundColor: color.mainColor,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sendText: {
    color: '#fff',
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});

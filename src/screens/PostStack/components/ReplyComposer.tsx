// src/screens/PostStack/components/ReplyComposer.tsx
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
import {useCreateReply} from '../../../hooks/comments/useReplyMutations';
import {color} from '../../../const/color';

/* ===========================
   COMPONENT: New Reply Input
   =========================== */
const ReplyComposer = ({
  postId,
  commentId,
  replyTo = null,
  replyingUser = null,
  limit = 10,
  onSubmitted,
  placeholder = 'Write a reply…',
  autoFocus = false,
}: any) => {
  const [text, setText] = useState('');
  const {mutateAsync: createReply, isPending} = useCreateReply({
    postId,
    limit,
  });

  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;
    try {
      const uname = replyingUser?.userName?.trim();
      const mention = uname ? `@${uname}` : '';
      let finalContent = content;
      if (
        mention &&
        !content.toLowerCase().startsWith(`${mention.toLowerCase()}`)
      ) {
        finalContent = `${mention} ${content}`;
      }

      const res = await createReply({
        commentId,
        content: finalContent,
        replyTo: replyingUser?._id ?? replyTo,
      });
      // myConsole('[ReplyComposer] submitted', res);
      setText('');
      Keyboard.dismiss();
      onSubmitted?.(res);
    } catch (e) {
      // myConsole('[ReplyComposer] error', e);
    }
  };

  const dynamicPlaceholder = replyingUser?.userName
    ? `Reply to @${replyingUser.userName}…`
    : placeholder;

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        placeholderTextColor={'grey'}
        value={text}
        onChangeText={setText}
        placeholder={dynamicPlaceholder}
        autoFocus={autoFocus}
        editable={!isPending}
        multiline
      />
      <Pressable
        style={[styles.sendBtn, (isPending || !text.trim()) && styles.disabled]}
        onPress={handleSend}
        disabled={isPending || !text.trim()}>
        <Text style={styles.sendText}>Reply</Text>
      </Pressable>
    </View>
  );
};

export default ReplyComposer;

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
    backgroundColor: '#111827',
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

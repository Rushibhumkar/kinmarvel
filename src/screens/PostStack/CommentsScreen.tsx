// src/screens/PostStack/CommentsScreen.tsx
import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import CommentComposer from './components/CommentComposer';
import {myConsole} from '../../utils/myConsole';
import CommentsList from './components/CommentsList';

/* ===========================
   SCREEN: Full-screen Comments
   =========================== */
const CommentsScreen = (props: any) => {
  const postId =
    props?.route?.params?.postId ?? props?.postId ?? props?.route?.params?.id;
  const onCommentCountChange =
    props?.route?.params?.onCommentCountChange ?? props?.onCommentCountChange;

  const goBack =
    props?.navigation?.goBack ||
    props?.onClose ||
    (() => myConsole('[CommentsScreen] no navigation', null));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Comments</Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.body}>
        <CommentsList postId={postId} />
      </View>

      <CommentComposer
        postId={postId}
        onSubmitted={() => onCommentCountChange?.(postId, +1)}
      />
    </SafeAreaView>
  );
};

export default CommentsScreen;

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {fontSize: 20, color: '#111827'},
  title: {flex: 1, textAlign: 'center', fontWeight: '700', fontSize: 16},
  body: {flex: 1},
});

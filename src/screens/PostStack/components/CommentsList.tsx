// src/screens/PostStack/components/CommentsList.tsx
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useComments} from '../../../hooks/comments/useComments';
import EmptyComments from './EmptyComments';
import {myConsole} from '../../../utils/myConsole';
import CommentItem from './CommentItem';
import {getData} from '../../../hooks/useAsyncStorage';

/* ===========================
   COMPONENT: Comments FlatList
   =========================== */
const CommentsList = ({postId, limit = 10}: any) => {
  const {
    comments,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    fetchNextPage,
  } = useComments({postId, limit});

  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    (async () => {
      // try a few common keys; keep silent if not found
      const keys = ['user', 'currentUser', 'userInfo', 'me'];
      for (const k of keys) {
        try {
          const u = await getData(k as any);
          if (u && (u._id || u.id)) {
            setCurrentUser(u);
            break;
          }
        } catch {}
      }
    })();
  }, []);

  const [localHidden, setLocalHidden] = useState<Record<string, boolean>>({});

  const visibleComments = useMemo(
    () => comments.filter((c: any) => !localHidden[c?._id]),
    [comments, localHidden],
  );
  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const onEndReached = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const keyExtractor = useCallback((item: any) => item?._id, []);

  if (isLoading && !comments.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isLoading && visibleComments.length === 0) {
    return <EmptyComments />;
  }

  return (
    <FlatList
      data={visibleComments}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.list}
      renderItem={({item}) => (
        <CommentItem
          postId={postId}
          comment={item}
          currentUser={currentUser}
          onAfterDelete={(id: string) => {
            setLocalHidden(prev => ({...prev, [id]: true}));
          }}
          onAfterReplyAdded={(updated: any) => {
            // nothing else needed; query will be invalidated by mutation hook
          }}
        />
      )}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isFetchingNextPage}
          onRefresh={onRefresh}
        />
      }
      onEndReachedThreshold={0.4}
      onEndReached={onEndReached}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.footer}>
            <ActivityIndicator />
          </View>
        ) : (
          <View style={{height: 12}} />
        )
      }
      ListHeaderComponent={<View style={{height: 6}} />}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default CommentsList;

const styles = StyleSheet.create({
  list: {paddingBottom: 8},
  center: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
});

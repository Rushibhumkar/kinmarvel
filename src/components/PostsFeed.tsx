import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import {fetchPosts} from '../api/posts/postFunc';
import PostCard from '../screens/PostStack/components/PostCard';

type ApiPost = any; // your PostCard already expects `post` prop; keep flexible
type ApiResponse = {
  success: boolean;
  message: string;
  data: {
    posts: ApiPost[];
    pagination: {total: number; page: number; totalPages: number};
  };
};

const PostsFeed: React.FC = () => {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadPage = useCallback(
    async (nextPage: number, opts?: {refresh?: boolean}) => {
      if (nextPage > totalPages && !opts?.refresh) return;
      try {
        if (opts?.refresh) setRefreshing(true);
        else if (nextPage === 1) setInitialLoading(true);
        else setLoadingMore(true);

        const res = (await fetchPosts({
          limit: 10,
          page: nextPage,
          type: 'post',
          forceRefresh: !!opts?.refresh,
        })) as ApiResponse;

        const newPosts = res?.data?.posts ?? [];
        const newTotalPages = res?.data?.pagination?.totalPages ?? 1;

        setTotalPages(newTotalPages);
        setPosts(prev =>
          nextPage === 1
            ? newPosts
            : [
                ...prev,
                ...newPosts.filter(p => !prev.find(pp => pp._id === p._id)),
              ],
        );
        setPage(nextPage);
      } catch (e) {
        console.log('[PostsFeed] loadPage error:', e);
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [totalPages],
  );

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const onRefresh = useCallback(() => {
    loadPage(1, {refresh: true});
  }, [loadPage]);

  const onEndReached = useCallback(() => {
    if (loadingMore || initialLoading || refreshing) return;
    if (page < totalPages) loadPage(page + 1);
  }, [page, totalPages, loadingMore, refreshing, initialLoading, loadPage]);

  const keyExtractor = useCallback((item: ApiPost) => item._id, []);

  const ListFooter = useMemo(
    () =>
      loadingMore ? (
        <View style={styles.footerLoading}>
          <ActivityIndicator size="small" />
        </View>
      ) : (
        <View style={{height: 16}} />
      ),
    [loadingMore],
  );

  if (initialLoading && posts.length === 0) {
    return (
      <View style={styles.initialLoader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={keyExtractor}
      renderItem={({item}) => <PostCard post={item} />}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onEndReachedThreshold={0.4}
      onEndReached={onEndReached}
      ListFooterComponent={ListFooter}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default PostsFeed;

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 120,
    paddingTop: 10,
  },
  initialLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  footerLoading: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});

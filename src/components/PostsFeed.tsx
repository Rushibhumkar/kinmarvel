import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import {fetchPosts, likePost} from '../api/posts/postFunc';
import PostCard from '../screens/PostStack/components/PostCard';
import {myConsole} from '../utils/myConsole';
import CommentSheet from '../screens/PostStack/components/CommentSheet';

type ApiPost = any; // your PostCard already expects `post` prop; keep flexible
type ApiResponse = {
  success: boolean;
  message: string;
  data: {
    posts: ApiPost[];
    pagination: {total: number; page: number; totalPages: number};
  };
};

const PostsFeed: React.FC = ({headerComponent, onExternalRefresh}: any) => {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activePost, setActivePost] = useState<any>(null);

  const handleOpenComments = useCallback((post: ApiPost) => {
    setActivePost(post);
    myConsole('[PostsFeed] open comments for', {postId: post?._id});
  }, []);

  const handleCommentCountChange = useCallback(
    (postId: string, delta: number) => {
      setPosts(prev =>
        prev.map(p =>
          p._id === postId
            ? {...p, commentCount: Math.max(0, (p.commentCount || 0) + delta)}
            : p,
        ),
      );
    },
    [],
  );

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

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('post:added', () => {
      // pull fresh list when a new post is created
      loadPage(1, {refresh: true});
    });
    return () => sub.remove();
  }, [loadPage]);
  const onRefresh = useCallback(() => {
    try {
      onExternalRefresh?.();
    } catch {}
    loadPage(1, {refresh: true});
  }, [loadPage, onExternalRefresh]);

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

  const applyLikeLocally = useCallback((postId: string, nextLiked: boolean) => {
    setPosts(prev =>
      prev.map(p =>
        p._id === postId
          ? {
              ...p,
              isLikedByMe: nextLiked,
              likeCount: Math.max(0, (p.likeCount || 0) + (nextLiked ? 1 : -1)),
            }
          : p,
      ),
    );
  }, []);

  const handleLikeToggle = useCallback(
    async (post: any, explicitAction?: 'like' | 'unlike') => {
      const currentLiked = !!post?.isLikedByMe;
      const targetAction = explicitAction ?? (currentLiked ? 'unlike' : 'like');
      const nextLiked = targetAction === 'like';

      // optimistic update
      applyLikeLocally(post._id, nextLiked);
      try {
        await likePost(post._id, targetAction);
      } catch (e) {
        // rollback on failure
        applyLikeLocally(post._id, currentLiked);
        console.log('[PostsFeed] like toggle failed:', e);
      }
    },
    [applyLikeLocally],
  );

  if (initialLoading && posts.length === 0) {
    return (
      <View style={styles.initialLoader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <View style={{flex: 1}}>
      <FlatList
        data={posts}
        keyExtractor={keyExtractor}
        renderItem={({item}) => (
          <PostCard
            post={item}
            onOpenComments={handleOpenComments}
            onCommentCountChange={handleCommentCountChange}
            onLikePress={handleLikeToggle}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={headerComponent || null}
        onEndReachedThreshold={0.4}
        onEndReached={onEndReached}
        ListFooterComponent={ListFooter}
        showsVerticalScrollIndicator={false}
      />
      <CommentSheet
        visible={!!activePost}
        postId={activePost?._id}
        onClose={() => setActivePost(null)}
        onCommentCountChange={handleCommentCountChange}
      />
    </View>
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

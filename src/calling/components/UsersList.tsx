// src/calling/components/UsersList.tsx
import React, {memo, useCallback} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';

const UsersList = ({
  users = [],
  currentUserId,
  onStartCall,
  isLoading,
  isError,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  onRefresh,
  refreshing,
}: any) => {
  const data = Array.isArray(users)
    ? users.filter(u => u?._id !== currentUserId)
    : [];

  const keyExtractor = useCallback((item: any) => item._id, []);

  const renderItem = useCallback(
    ({item}: any) => (
      <View style={styles.userRow}>
        <Text style={styles.userText}>
          {item?.firstName || 'User'} {item?.lastName || ''}{' '}
          {item?.phone ? `(${item.phone})` : ''}
        </Text>
        <View style={styles.callButtons}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => onStartCall?.(item._id, 'video')}
            activeOpacity={0.7}>
            <Text style={styles.callText}>📹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => onStartCall?.(item._id, 'audio')}
            activeOpacity={0.7}>
            <Text style={styles.callText}>📞</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [onStartCall],
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage?.();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="small" color="#0f0" />
        <Text style={styles.loading}> Loading users…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.error}>Error loading users</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => onRefresh?.()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
      onEndReachedThreshold={0.3}
      onEndReached={handleLoadMore}
      ListEmptyComponent={
        <View style={styles.centerWrap}>
          <Text style={styles.empty}>No users found</Text>
        </View>
      }
      ListFooterComponent={
        hasNextPage && isFetchingNextPage ? (
          <View style={styles.footerLoading}>
            <ActivityIndicator size="small" color="#0f0" />
          </View>
        ) : null
      }
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    />
  );
};

export default memo(UsersList);

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 30,
    paddingHorizontal: 0,
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  loading: {color: '#888', marginTop: 8},
  error: {color: 'red', fontSize: 15, marginBottom: 8},
  empty: {color: '#aaa', fontSize: 15},
  retryBtn: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
  },
  retryText: {color: '#fff'},
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
  },
  userText: {
    color: '#fff',
    fontSize: 16,
    flexShrink: 1,
    paddingRight: 10,
  },
  callButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  callButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
  },
  callText: {color: '#0f0', fontSize: 16},
  footerLoading: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});

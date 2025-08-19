// src/calling/components/UsersList.tsx
import React, {memo, useCallback} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

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
  title = 'Available Users',
  onBack, // optional override
}: any) => {
  const navigation = useNavigation();

  const data = Array.isArray(users)
    ? users.filter(u => u?._id !== currentUserId)
    : [];

  const keyExtractor = useCallback((item: any) => item._id, []);

  const renderItem = useCallback(
    ({item}: any) => (
      <View style={styles.userRow}>
        <Text style={styles.userText} numberOfLines={1}>
          {(item?.firstName || 'User') +
            (item?.lastName ? ` ${item.lastName}` : '')}
          {item?.phone ? `  (${item.phone})` : ''}
        </Text>
        <View style={styles.callButtons}>
          <TouchableOpacity
            style={[styles.circleBtn, styles.videoBtn]}
            onPress={() => onStartCall?.(item._id, 'video')}
            activeOpacity={0.8}>
            <Text style={styles.circleEmoji}>📹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.circleBtn, styles.audioBtn]}
            onPress={() => onStartCall?.(item._id, 'audio')}
            activeOpacity={0.8}>
            <Text style={styles.circleEmoji}>📞</Text>
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

  const Header = (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => (onBack ? onBack() : navigation.goBack())}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        style={styles.backBtn}
        activeOpacity={0.7}>
        <Image
          source={require('../../assets/icons/backicon.png')}
          style={styles.backIcon}
        />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={{width: 40}} />
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerWrap]}>
        {Header}
        <ActivityIndicator
          size="small"
          color="#007AFF"
          style={{marginTop: 16}}
        />
        <Text style={styles.loading}>Loading users…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, styles.centerWrap]}>
        {Header}
        <Text style={styles.error}>Error loading users</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => onRefresh?.()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onEndReachedThreshold={0.3}
        onEndReached={handleLoadMore}
        ListHeaderComponent={Header}
        ListEmptyComponent={
          <View style={styles.centerWrap}>
            <Text style={styles.empty}>No users found</Text>
          </View>
        }
        ListFooterComponent={
          hasNextPage && isFetchingNextPage ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : (
            <View style={{height: 12}} />
          )
        }
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default memo(UsersList);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E9E9E9',
    marginBottom: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#111',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#111',
    fontSize: 17,
    fontWeight: '600',
    marginRight: 40, // balance back button space
  },

  // List
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 12,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDEDED',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
    justifyContent: 'space-between',
  },
  userText: {
    color: '#111',
    fontSize: 15.5,
    flexShrink: 1,
    paddingRight: 10,
  },

  callButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F3F3',
    borderWidth: 1,
    borderColor: '#E7E7E7',
  },
  videoBtn: {
    backgroundColor: '#E8F1FF',
    borderColor: '#D6E7FF',
  },
  audioBtn: {
    backgroundColor: '#E9F9EE',
    borderColor: '#D9F2E2',
  },
  circleEmoji: {
    fontSize: 18,
  },

  // States
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loading: {color: '#666', marginTop: 8},
  error: {color: '#E03A3A', fontSize: 15, marginTop: 12},
  retryBtn: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#111',
    borderRadius: 8,
  },
  retryText: {color: '#fff', fontWeight: '600'},
  empty: {color: '#777', fontSize: 15},

  footerLoading: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});

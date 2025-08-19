// src/calling/components/UsersList.tsx
import React, {memo, useCallback} from 'react';
import {
  ActivityIndicator,
  FlatList,
<<<<<<< HEAD
  Image,
  RefreshControl,
=======
>>>>>>> 3d5f4b16b11e494635cbf9e943760cbe3fa01d35
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
<<<<<<< HEAD
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
=======
  RefreshControl,
} from 'react-native';
>>>>>>> 3d5f4b16b11e494635cbf9e943760cbe3fa01d35

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
<<<<<<< HEAD
  title = 'Available Users',
  onBack, // optional override
}: any) => {
  const navigation = useNavigation();
=======
}: any) => {
>>>>>>> 3d5f4b16b11e494635cbf9e943760cbe3fa01d35
  const data = Array.isArray(users)
    ? users.filter(u => u?._id !== currentUserId)
    : [];

  const keyExtractor = useCallback((item: any) => item._id, []);

  const renderItem = useCallback(
    ({item}: any) => (
      <View style={styles.userRow}>
<<<<<<< HEAD
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
=======
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
>>>>>>> 3d5f4b16b11e494635cbf9e943760cbe3fa01d35
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

<<<<<<< HEAD
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
=======
  if (isLoading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="small" color="#0f0" />
        <Text style={styles.loading}> Loading users…</Text>
>>>>>>> 3d5f4b16b11e494635cbf9e943760cbe3fa01d35
      </View>
    );
  }

  if (isError) {
    return (
<<<<<<< HEAD
      <View style={[styles.container, styles.centerWrap]}>
        {Header}
=======
      <View style={styles.centerWrap}>
>>>>>>> 3d5f4b16b11e494635cbf9e943760cbe3fa01d35
        <Text style={styles.error}>Error loading users</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => onRefresh?.()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
<<<<<<< HEAD
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
=======
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
>>>>>>> 3d5f4b16b11e494635cbf9e943760cbe3fa01d35
  );
};

export default memo(UsersList);

const styles = StyleSheet.create({
<<<<<<< HEAD
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
    marginRight: 40, // to balance the back button space
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

=======
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
>>>>>>> 3d5f4b16b11e494635cbf9e943760cbe3fa01d35
  callButtons: {
    flexDirection: 'row',
    gap: 8,
  },
<<<<<<< HEAD
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

=======
  callButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
  },
  callText: {color: '#0f0', fontSize: 16},
>>>>>>> 3d5f4b16b11e494635cbf9e943760cbe3fa01d35
  footerLoading: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});

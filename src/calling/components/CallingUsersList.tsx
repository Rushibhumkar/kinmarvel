import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useGetAllUsers} from '../../api/user/userFunc';

type MediaType = 'audio' | 'video';

type Props = {
  currentUserId?: string;
  onStartCall: (toUserId: string, mediaType: MediaType) => void;
};

type User = {
  _id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

const CallingUsersList: React.FC<Props> = ({currentUserId, onStartCall}) => {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetAllUsers();

  const users: User[] = useMemo(
    () => data?.pages.flatMap((p: any) => p.data.users) ?? [],
    [data],
  );

  const filteredUsers = useMemo(
    () => users.filter(u => u._id !== currentUserId),
    [users, currentUserId],
  );

  const renderUser = ({item}: {item: User}) => {
    const fullName = [item.firstName, item.lastName].filter(Boolean).join(' ');
    return (
      <View style={styles.card}>
        <View style={{flex: 1}}>
          <Text style={styles.name} numberOfLines={1}>
            {fullName || 'User'}
          </Text>
          {!!item.phone && (
            <Text style={styles.phone} numberOfLines={1}>
              {item.phone}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.circleBtn, styles.videoBtn]}
            onPress={() => onStartCall(item._id, 'video')}
            activeOpacity={0.85}>
            <Text style={styles.circleEmoji}>📹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.circleBtn, styles.audioBtn]}
            onPress={() => onStartCall(item._id, 'audio')}
            activeOpacity={0.85}>
            <Text style={styles.circleEmoji}>📞</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingTxt}>Loading users…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.errorTxt}>Error loading users</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredUsers}
      keyExtractor={item => item._id}
      renderItem={renderUser}
      contentContainerStyle={styles.listContent}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3}
      ListEmptyComponent={
        <View style={styles.centerWrap}>
          <Text style={styles.emptyTxt}>No users found</Text>
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
      showsVerticalScrollIndicator={false}
    />
  );
};

export default CallingUsersList;

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  card: {
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
  },
  name: {color: '#111', fontSize: 15.5, fontWeight: '600'},
  phone: {color: '#777', fontSize: 13, marginTop: 2},

  actions: {flexDirection: 'row', gap: 10, marginLeft: 10},
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  videoBtn: {backgroundColor: '#E8F1FF', borderColor: '#D6E7FF'},
  audioBtn: {backgroundColor: '#E9F9EE', borderColor: '#D9F2E2'},
  circleEmoji: {fontSize: 18},

  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingTxt: {color: '#666', marginTop: 8},
  errorTxt: {color: '#E03A3A', fontSize: 15, marginTop: 12},
  emptyTxt: {color: '#777', fontSize: 15},
  footerLoading: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});

// src/calling/components/CallingUsersList.tsx
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Keyboard,
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

const DEBOUNCE_MS = 300;

const CallingUsersList: React.FC<Props> = ({currentUserId, onStartCall}) => {
  // raw input from the search field
  const [query, setQuery] = useState('');
  const canLoadMoreRef = useRef(true);

  // debounce the query so we only hit backend after a pause in typing
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // call backend with just the search value (backend handles filtering/pagination)
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetAllUsers(debouncedQuery, 10); // <-- pass search param only

  // Flatten paginated users (already filtered server-side by debouncedQuery)
  const users: User[] = useMemo(
    () => data?.pages.flatMap((p: any) => p?.data?.users ?? []) ?? [],
    [data],
  );

  // Optionally remove self locally (kept — harmless and not search-related)
  const usersToShow = useMemo(
    () => users.filter(u => u?._id !== currentUserId),
    [users, currentUserId],
  );

  const keyExtractor = useCallback((item: User) => item._id, []);

  const renderItem = useCallback(
    ({item}: {item: User}) => {
      const fullName = [item.firstName, item.lastName]
        .filter(Boolean)
        .join(' ');
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
    },
    [onStartCall],
  );

  const handleLoadMore = useCallback(() => {
    if (!canLoadMoreRef.current) return;
    if (hasNextPage && !isFetchingNextPage) {
      canLoadMoreRef.current = false;
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const clearSearch = useCallback(() => setQuery(''), []);

  const SearchHeader = (
    <View style={styles.searchWrap}>
      <View style={styles.searchField}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or phone"
          placeholderTextColor="#9AA0A6"
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
          clearButtonMode="never"
        />
        {query.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={clearSearch}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

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
      data={usersToShow}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={SearchHeader}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        <View style={styles.centerWrap}>
          <Text style={styles.emptyTxt}>
            {debouncedQuery ? 'No users match your search' : 'No users found'}
          </Text>
        </View>
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.footerLoading}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        ) : (
          <View style={{height: 12}} />
        )
      }
      onMomentumScrollBegin={() => {
        canLoadMoreRef.current = true;
      }}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default CallingUsersList;

const styles = StyleSheet.create({
  // Search
  searchWrap: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 4,
    backgroundColor: '#FFFFFF',
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    height: 44,
  },
  searchIcon: {fontSize: 16, color: '#6B7280', marginRight: 6},
  searchInput: {
    flex: 1,
    color: '#111827',
    paddingVertical: 0,
    fontSize: 15,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  clearText: {fontSize: 14, color: '#111827', fontWeight: '700'},

  // List
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

  // States
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

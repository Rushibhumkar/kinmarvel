import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomBottomModal from '../../../components/CustomBottomModal';
import CustomText from '../../../components/CustomText';
import {useInfiniteQuery} from '@tanstack/react-query';
import {color} from '../../../const/color';
import {sizes} from '../../../const';
import {getAllUsers} from '../../../api/user/userFunc';

type User = {
  _id: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
};

type ApiPage = {
  success: boolean;
  data: {
    users: User[];
    totalDocs: number;
    totalPages: number;
    page: number;
    limit: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (users: User[]) => void;
  preselectedIds?: string[];
  modalHeight?: number;
};

const PAGE_SIZE = 10;

const TagPeopleModal: React.FC<Props> = ({
  visible,
  onClose,
  onConfirm,
  preselectedIds = [],
  modalHeight = Math.min(520, sizes.height * 0.84),
}) => {
  const [search, setSearch] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  // simple debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // local selection map
  const [selectedMap, setSelectedMap] = useState<Record<string, User>>({});

  // seed preselected each time modal opens
  useEffect(() => {
    if (!visible) return;
    const next: Record<string, User> = {};
    preselectedIds.forEach(id => (next[id] = {_id: id}));
    setSelectedMap(next);
  }, [visible, preselectedIds.join('|')]);

  // infinite query using your getAllUsers(searchValue, page, limit)
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isError,
  } = useInfiniteQuery({
    queryKey: ['users-infinite', debouncedQ],
    initialPageParam: 1,
    queryFn: async ({pageParam}) => {
      const res: ApiPage = await getAllUsers(
        debouncedQ,
        pageParam as number,
        PAGE_SIZE,
      );
      return res;
    },
    getNextPageParam: (lastPage: ApiPage) =>
      lastPage?.data?.hasNextPage
        ? lastPage.data.nextPage ?? undefined
        : undefined,
  });

  const flatData: User[] = useMemo(() => {
    if (!data?.pages?.length) return [];
    return data.pages.flatMap(p => p?.data?.users ?? []);
  }, [data]);

  // hydrate usernames for preselected ids as they appear
  useEffect(() => {
    if (!flatData.length) return;
    setSelectedMap(prev => {
      const updated = {...prev};
      flatData.forEach(u => {
        if (updated[u._id]) updated[u._id] = {...updated[u._id], ...u};
      });
      return updated;
    });
  }, [flatData]);

  const toggleSelect = (user: User) => {
    setSelectedMap(prev => {
      const next = {...prev};
      if (next[user._id]) delete next[user._id];
      else next[user._id] = user;
      return next;
    });
  };

  const selectedArr = useMemo(() => Object.values(selectedMap), [selectedMap]);

  return (
    <CustomBottomModal
      visible={visible}
      onClose={onClose}
      customStyling={{paddingBottom: 12}}
      modalHeight={modalHeight}>
      <TextInput
        placeholder="Search people..."
        autoFocus
        value={search}
        onChangeText={setSearch}
        style={{
          borderWidth: 1,
          borderColor: '#e5e7eb',
          borderRadius: 12,
          paddingVertical: 10,
          paddingHorizontal: 14,
          marginBottom: 12,
          fontSize: 16,
          color: '#000',
        }}
        placeholderTextColor="#9ca3af"
        returnKeyType="search"
        onSubmitEditing={() => refetch()}
      />

      {/* Selected chips */}
      {selectedArr.length > 0 && (
        <View
          style={{flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10}}>
          {selectedArr.map(u => (
            <View
              key={u._id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 16,
                backgroundColor: '#EEF6FF',
                marginRight: 8,
                marginBottom: 8,
              }}>
              <CustomText style={{color: color.mainColor, fontWeight: '600'}}>
                @{u.userName || 'user'}
              </CustomText>
              <TouchableOpacity
                onPress={() => toggleSelect(u)}
                style={{marginLeft: 8}}>
                <Image
                  source={require('../../../assets/icons/close.png')}
                  style={{width: 8, height: 8, tintColor: color.mainColor}}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* List */}
      {isLoading && !data ? (
        <ActivityIndicator />
      ) : isError ? (
        <CustomText color="red">Failed to load users.</CustomText>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={item => item._id}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          renderItem={({item}) => {
            const checked = !!selectedMap[item._id];
            return (
              <TouchableOpacity
                onPress={() => toggleSelect(item)}
                activeOpacity={0.6}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderColor: '#eee',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <View>
                  <CustomText
                    style={{color: color.titleColor, fontWeight: '600'}}>
                    @{item.userName || 'user'}
                  </CustomText>
                  {(item.firstName || item.lastName) && (
                    <CustomText style={{color: '#6b7280', fontSize: 12}}>
                      {(item.firstName || '') + ' ' + (item.lastName || '')}
                    </CustomText>
                  )}
                </View>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    borderWidth: 1.5,
                    borderColor: checked ? color.mainColor : '#cbd5e1',
                    backgroundColor: checked ? color.mainColor : 'transparent',
                  }}
                />
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{paddingVertical: 12}}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      )}

      {/* Footer actions */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: 12,
        }}>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={onClose}
          style={{padding: 12, marginRight: 4}}>
          <CustomText style={{color: '#6b7280'}}>Cancel</CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => onConfirm(selectedArr)}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 16,
            backgroundColor: color.mainColor,
            borderRadius: 10,
          }}>
          <CustomText style={{color: '#fff', fontWeight: '700'}}>
            Done
          </CustomText>
        </TouchableOpacity>
      </View>
    </CustomBottomModal>
  );
};

export default TagPeopleModal;

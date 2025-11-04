import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {io, Socket} from 'socket.io-client';

import MainContainer from '../../components/MainContainer';
import CustomAvatar from '../../components/CustomAvatar';
import CustomErrorMessage from '../../components/CustomErrorMessage';
import LoadingCompo from '../../components/LoadingCompo/LoadingCompo';

import {chatRoute} from '../AuthScreens/routeName';
import {color} from '../../const/color';
import {sizes} from '../../const';

import {useGetMyData} from '../../api/profile/profileFunc';
import {useGetRecentChats} from '../../api/chats/chatFunc';

import {SOCKET_SERVER_URL} from '../../api/axiosInstance';
import {getData} from '../../hooks/useAsyncStorage';

import {myConsole} from '../../utils/myConsole';
import {getLastSeen} from '../../utils/commonFunction';

import type {ImageSourcePropType} from 'react-native';
// Use typed require() — most reliable with React Native Metro for static images
// eslint-disable-next-line @typescript-eslint/no-var-requires
const singleTickIcon: ImageSourcePropType = require('../../assets/icons/singleTick.png');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const doubleTickIcon: ImageSourcePropType = require('../../assets/icons/doubleTick.png');

/* ---------------------------------- Types --------------------------------- */

type UserLite = {
  _id: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  updatedAt?: string;
};

type RecentChatItem = {
  _id: string;
  sender: UserLite;
  receiver: UserLite;
  text?: string;
  isDelivered?: boolean;
  isSeen?: boolean;
  attachments?: Array<any>;
  createdAt: string; // message timestamp
  updatedAt?: string;
  isDeleted?: any[];
};

/* ------------------------------ Helper utils ------------------------------ */

// Return the other participant (peer) relative to myId
const getPeer = (chat: RecentChatItem, myId?: string) =>
  chat.sender?._id === myId ? chat.receiver : chat.sender;

// Detect if this last message is sent by me
const isOutgoing = (chat: RecentChatItem, myId?: string) =>
  chat.sender?._id === myId;

// Build a last message preview
const getPreview = (chat: RecentChatItem) => {
  const hasText = chat.text && chat.text.trim().length > 0;
  const attCount = Array.isArray(chat.attachments)
    ? chat.attachments.length
    : 0;

  if (hasText && attCount > 0) {
    return `${chat.text.trim()}  •  ${attCount} attachment${
      attCount > 1 ? 's' : ''
    }`;
  }
  if (hasText) return chat.text!.trim();
  if (attCount > 0) return `${attCount} attachment${attCount > 1 ? 's' : ''}`;
  return '…';
};

// Decide tick image for delivery/read states (for outgoing messages only)
const getTickIconSource = (delivered?: boolean, seen?: boolean) => {
  if (seen) return doubleTickIcon;
  if (delivered) return singleTickIcon;
  return null;
};
// Unread = last message from peer and not seen
const isUnread = (chat: RecentChatItem, myId?: string) =>
  !isOutgoing(chat, myId) && chat.isSeen === false;

/* -------------------------------- Component -------------------------------- */

const ChatsList = ({navigation, route}: any) => {
  const [refreshing, setRefreshing] = useState(false);
  const [socket, setSocket] = useState<Socket | undefined>(undefined);

  const {data: myData} = useGetMyData();
  const myId = myData?.data?._id as string | undefined;

  // API: recent chats
  const {
    data: recentChats,
    isLoading: recentChatsLoad,
    isError: recentChatsErr,
    refetch: recentChatsRefetch,
  } = useGetRecentChats(myId || '');

  // ---- Socket setup (register/refetch on new messages) ----
  useEffect(() => {
    let newSocket: Socket | undefined;

    const setup = async () => {
      if (!myId) return;

      newSocket = io(SOCKET_SERVER_URL, {
        transports: ['websocket'],
        query: {userId: myId},
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        myConsole('socket', 'connected');
      });

      const token = await getData('authToken');
      newSocket.emit('register', myId, token);

      // When a new message arrives, simply refetch the list so it stays canonical
      newSocket.on('getMessage', (_newMessage: any) => {
        myConsole('socket:getMessage', 'received -> refetch recent chats');
        recentChatsRefetch();
      });

      newSocket.on('error', (err: any) => {
        myConsole('socket:error', err);
      });

      newSocket.on('register', (res: any) => {
        myConsole('socket:register', res);
      });
    };

    setup();

    return () => {
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.disconnect();
      }
    };
  }, [myId, recentChatsRefetch]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    recentChatsRefetch().finally(() => setRefreshing(false));
  };

  // Refetch whenever screen focuses
  useFocusEffect(
    React.useCallback(() => {
      recentChatsRefetch();
    }, [recentChatsRefetch]),
  );

  // ------------- Auto-navigate flow (from another screen) -------------------
  const {data, isComeFromAnotherScreen = false} = route?.params || {};
  const hasNavigatedRef = useRef(false);

  // Reset guard when screen is (re)focused
  useFocusEffect(
    React.useCallback(() => {
      hasNavigatedRef.current = false;
    }, []),
  );

  useEffect(() => {
    const debug = {
      isComeFromAnotherScreen,
      recentChatsLoad: !!recentChatsLoad,
      hasChats: !!recentChats?.data?.chats?.length,
      receiverId: data?.receiverId,
      hasNavigated: hasNavigatedRef.current,
    };

    myConsole('ChatsList:navigateDebug', debug);
    const chats: RecentChatItem[] = recentChats?.data?.chats || [];

    if (
      debug.isComeFromAnotherScreen &&
      !debug.recentChatsLoad &&
      debug.hasChats &&
      debug.receiverId &&
      !debug.hasNavigated
    ) {
      const match = chats.find(
        (c: any) =>
          c?.receiver?._id === debug.receiverId ||
          c?.sender?._id === debug.receiverId,
      );

      myConsole('ChatsList:navigateMatchFound', !!match);

      hasNavigatedRef.current = true;
      navigation.navigate(chatRoute.ChattingScreen, {
        data: match ? match : {receiver: {_id: debug.receiverId}},
        ...(data?.media ? {media: data.media} : {}),
        isComeFromAnotherScreen: true,
      });
    }
  }, [isComeFromAnotherScreen, recentChatsLoad, recentChats, data, navigation]);

  // ---------------------- Derived list (sorted, decorated) -------------------
  const sortedChats: RecentChatItem[] = useMemo(() => {
    const list: RecentChatItem[] = recentChats?.data?.chats || [];

    // Primary sort by message createdAt (desc). Fallback to receiver.updatedAt if needed.
    const toTime = (c: RecentChatItem) => {
      const t1 = c?.createdAt ? new Date(c.createdAt).getTime() : 0;
      const t2 = c?.receiver?.updatedAt
        ? new Date(c.receiver.updatedAt).getTime()
        : 0;
      return Math.max(t1, t2);
    };

    return [...list].sort((a, b) => toTime(b) - toTime(a));
  }, [recentChats]);
  myConsole('recentChatssss', recentChats);
  // ------------------------------- Renderers --------------------------------
  const renderItem = ({item}: {item: RecentChatItem}) => {
    const peer = getPeer(item, myId);
    const outgoing = isOutgoing(item, myId);
    const unread = isUnread(item, myId);
    const preview = getPreview(item);
    const tickIcon = outgoing
      ? getTickIconSource(item.isDelivered, item.isSeen)
      : null;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() =>
          navigation.navigate(chatRoute.ChattingScreen, {
            data: item,
          })
        }>
        <CustomAvatar
          imgUrl={peer?.profileImageUrl}
          imgStyle={{height: 52, width: 52}}
          name={`${peer?.firstName ?? ''} ${peer?.lastName ?? ''}`.trim()}
          style={styles.avatar}
        />

        <View style={styles.chatContent}>
          <View style={styles.row}>
            <Text style={styles.chatName} numberOfLines={1}>
              {`${peer?.firstName ?? ''} ${peer?.lastName ?? ''}`.trim() ||
                'User'}
            </Text>

            {/* Time on the right using message createdAt */}
            <Text style={styles.timeText}>
              {getLastSeen(
                item?.createdAt ?? peer?.updatedAt ?? new Date().toISOString(),
              )}
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.previewWrap}>
              {/* Outgoing state ticks */}
              {tickIcon && (
                <Image
                  source={tickIcon}
                  style={[
                    styles.tickIcon,
                    {tintColor: item.isSeen ? color.mainColor : '#9aa0a6'},
                  ]}
                />
              )}

              <Text
                style={[styles.previewText, unread && styles.previewTextUnread]}
                numberOfLines={1}>
                {preview}
              </Text>
            </View>

            {/* Unread dot for incoming & unseen */}
            {unread && <View style={styles.unreadDot} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  myConsole('sortedChats', sortedChats);
  // --------------------------------- UI -------------------------------------
  return (
    <MainContainer
      title="Chats"
      bgColor={'#fff'}
      showRightIcon={[
        ...(true
          ? // ...(sortedChats.length > 0
            [
              {
                imageSource: require('../../assets/animatedIcons/search.png'),
                onPress: () => navigation.navigate(chatRoute.ChatsSearchScreen),
              },
            ]
          : []),
      ]}>
      {recentChatsLoad ? (
        <LoadingCompo minHeight={sizes.height / 1.1} />
      ) : recentChatsErr ? (
        <CustomErrorMessage
          message="Failed to fetch chats. Please try again."
          onRetry={recentChatsRefetch}
        />
      ) : sortedChats.length > 0 ? (
        <FlatList
          data={sortedChats}
          keyExtractor={item => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{paddingBottom: 20}}
          style={{backgroundColor: '#fff'}}
          renderItem={renderItem}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Image
            source={require('../../assets/icons/fired.png')}
            style={styles.noDataIcon}
            tintColor={color.placeholderColor}
          />
          <Text style={styles.noDataText}>No chats found.</Text>
        </View>
      )}
    </MainContainer>
  );
};

export default ChatsList;

/* --------------------------------- Styles --------------------------------- */

const styles = StyleSheet.create({
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  tickIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
    resizeMode: 'contain',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  chatContent: {
    flex: 1,
    marginLeft: 10,
  },
  chatName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    paddingRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#9aa0a6',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
    marginTop: 2,
    marginBottom: 2,
  },
  previewText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  previewTextUnread: {
    color: '#000',
    fontWeight: '700',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color.PRIMARY_COLOR,
    marginLeft: 8,
  },
  noDataContainer: {
    height: sizes.height,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  noDataIcon: {
    height: 40,
    width: 40,
    marginTop: -200,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
  },
});

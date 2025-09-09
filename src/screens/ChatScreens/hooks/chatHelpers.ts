import {useCallback, useEffect} from 'react';
import {Keyboard} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';

type Msg = {_id?: string; sender?: string};

export const useMarkSeenOnFocus = (
  messages: Msg[],
  senderId: string | undefined,
  socket?: {emit: (evt: string, payload: any) => void},
) => {
  useFocusEffect(
    useCallback(() => {
      if (!messages?.length || !senderId || !socket) return;
      const lastReceivedMessage = messages.find(m => m?.sender !== senderId);
      if (lastReceivedMessage?._id) {
        socket.emit('markSeenMessage', lastReceivedMessage._id);
      }
    }, [messages, senderId, socket]),
  );
};

export const useKeyboardHeight = (setKeyboardHeight: (h: number) => void) => {
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [setKeyboardHeight]);
};

type FetchMessagesArgs = {
  API_AXIOS: any;
  SOCKET_SERVER_URL: string;
  receiverId?: string;
  nextPage?: number;
  isFetching: boolean;
  setIsFetching: (v: boolean) => void;
  setMessages: (updater: any) => void;
  setFetchError: (v: string | null) => void;
  setPage: (p: number) => void;
};

export const fetchMessagesHelper = async ({
  API_AXIOS,
  SOCKET_SERVER_URL,
  receiverId,
  nextPage = 1,
  isFetching,
  setIsFetching,
  setMessages,
  setFetchError,
  setPage,
}: FetchMessagesArgs) => {
  if (isFetching || !receiverId) return;
  setIsFetching(true);
  try {
    const res = await API_AXIOS.get(
      `${SOCKET_SERVER_URL}/api/chat/${receiverId}?limit=20&page=${nextPage}`,
    );
    const newMessages = res?.data?.data?.messages ?? [];
    if (nextPage === 1) {
      setMessages(newMessages);
      setFetchError(null);
    } else {
      setMessages((prev: any[]) => [...prev, ...newMessages]);
    }
    setPage(nextPage);
  } catch (error: any) {
    if (error?.response?.status === 429) {
      setFetchError(
        'You are sending too many requests. Please wait a moment and try again.',
      );
    } else {
      setFetchError('Failed to load messages. Please try again.');
    }
  } finally {
    setIsFetching(false);
  }
};

type HandleDeleteArgs = {
  Alert: any;
  toast: {success: (m: string) => void; error: (m: string) => void};
  selectedMessages: {_id: string}[];
  deleteMessagesByIds: (ids: string[]) => Promise<any>;
  fetchMessages: (nextPage?: number) => void;
  setSelectedMessages: (v: any) => void;
};

export const handleDeleteMessagesHelper = ({
  Alert,
  toast,
  selectedMessages,
  deleteMessagesByIds,
  fetchMessages,
  setSelectedMessages,
}: HandleDeleteArgs) => {
  Alert.alert(
    'Confirm Delete',
    'Do you want to delete selected messages?',
    [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMessagesByIds(selectedMessages.map(m => m._id));
            setSelectedMessages([]);
            fetchMessages(1);
            toast.success('Message(s) are deleted successfully!');
          } catch {
            toast.error('Failed to delete messages');
          }
        },
      },
    ],
    {cancelable: true},
  );
};

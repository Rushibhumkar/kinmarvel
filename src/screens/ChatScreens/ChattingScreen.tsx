import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import MainContainer from '../../components/MainContainer';
import {useGetMyData} from '../../api/profile/profileFunc';
import {io, Socket} from 'socket.io-client';
import {API_AXIOS, SOCKET_SERVER_URL} from '../../api/axiosInstance';
import {myConsole} from '../../utils/myConsole';
import {chatScreenStyles, myStyle} from '../../sharedStyles';
import {getData} from '../../hooks/useAsyncStorage';
import LoadingCompo from '../../components/LoadingCompo/LoadingCompo';
import {attachmentList} from '../../const/data';
import {color} from '../../const/color';
import CustomModal from '../../components/CustomModal';
import CustomText from '../../components/CustomText';
import {MsgDataType} from '../../utils/typescriptInterfaces';
import MessageComponent from './components/MessageComponent';
import {CameraType} from 'react-native-camera-kit';
import RNFS from 'react-native-fs';
import {chatRoute, commonRoute} from '../AuthScreens/routeName';
import EmptyChatPlaceholder from './components/EmptyChatPlaceholder';
import MessageInputBar from './components/MessageInputBar';
import FilePreviewModal from './components/FilePreviewModal';
import CustomErrorMessage from '../../components/CustomErrorMessage';
import {pickFileHelper} from './components/pickFileHelper';
import CameraCaptureView from './components/CameraCaptureView';
import {sendCapturedImageHelper} from './components/sendCapturedImageHelper';
import {getTextWithLength} from '../../utils/commonFunction';
import {deleteMessagesByIds} from '../../api/chats/chatFunc';
import {useAppToast} from '../../components/toast/AppToast';
import {
  fetchMessagesHelper,
  handleDeleteMessagesHelper,
  useKeyboardHeight,
  useMarkSeenOnFocus,
} from './hooks/chatHelpers';

const ChattingScreen = ({navigation, route}: any) => {
  const toast = useAppToast();
  const {data, media, isComeFromAnotherScreen = false} = route.params || {};
  const inputAutoFocus = isComeFromAnotherScreen;
  // Forwarding support
  const {forwardedMessages, forwardedToUserId} = route.params || {};

  // Me
  const {data: myData} = useGetMyData();
  const senderId: string | undefined = myData?.data?._id;

  const getId = (v: any): string | undefined =>
    typeof v === 'string' ? v : v?._id;
  // Figure out who the other person is (peer user object if available)
  const peerUser = useMemo(() => {
    const s = data?.sender;
    const r = data?.receiver;
    const sId = getId(s);
    const rId = getId(r);
    if (senderId && sId === senderId)
      return typeof r === 'object' ? r : undefined;
    if (senderId && rId === senderId)
      return typeof s === 'object' ? s : undefined;
    // fallback when coming from list where only receiver is sent
    return (
      (typeof r === 'object' && r) ||
      (typeof data === 'object' ? data : undefined)
    );
  }, [data, senderId]);

  // Resolve peer id (always the other person's _id)
  const receiverId: string | undefined = useMemo(() => {
    const sId = getId(data?.sender);
    const rId = getId(data?.receiver);
    if (senderId && sId === senderId) return rId;
    if (senderId && rId === senderId) return sId;
    return rId ?? getId(data) ?? getId(data?.user);
  }, [data, senderId]);

  // UI state
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<any>>([]);
  const [attachmentsPopup, setAttachmentsPopup] = useState(false);
  const [imageViewModalVisible, setImageViewModalVisible] = useState(false);
  const [file, setFile] = useState<any>(null);
  const [contact, setContact] = useState<MsgDataType['contact'] | undefined>();
  const [location, setLocation] = useState<
    MsgDataType['location'] | undefined
  >();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.Back);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Array<any>>([]);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);

  // Keyboard & list refs
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList<any> | null>(null);
  const cameraRef = useRef(null);

  // Socket ref (avoids stale closures)
  const socketRef = useRef<Socket | null>(null);
  const forwardedOnceRef = useRef(false);

  /* ----------------------------- Hooks / Effects ---------------------------- */

  // Mark messages seen when focused (you already wrote this hook)
  useMarkSeenOnFocus(messages, senderId, socketRef.current);

  // Track keyboard height (you already wrote this hook)
  useKeyboardHeight(setKeyboardHeight);

  const isFetchingRef = useRef(false);
  useEffect(() => {
    isFetchingRef.current = isFetching;
  }, [isFetching]);
  const fetchMessages = useCallback(
    (nextPage: number = 1) => {
      if (!receiverId) return;
      return fetchMessagesHelper({
        API_AXIOS,
        SOCKET_SERVER_URL,
        receiverId,
        nextPage,
        isFetching: isFetchingRef.current,
        setIsFetching: (v: boolean) => {
          isFetchingRef.current = v;
          setIsFetching(v);
        },
        setMessages,
        setFetchError,
        setPage,
      });
    },
    [receiverId],
  );

  // Initial load + whenever chat peer changes
  useEffect(() => {
    if (!senderId || !receiverId) return;
    setMessages([]); // reset thread when switching peer
    setPage(1);
    fetchMessages(1);
  }, [senderId, receiverId, fetchMessages]);

  // Setup socket when I’m known
  useEffect(() => {
    let mounted = true;
    const setup = async () => {
      if (!senderId) return;

      const token = await getData('authToken');

      const s = io(SOCKET_SERVER_URL, {
        transports: ['websocket'],
        query: {userId: senderId},
      });
      if (!mounted) {
        s.disconnect();
        return;
      }
      socketRef.current = s;

      s.on('connect', () => {
        myConsole('socket', 'connected');
        s.emit('register', senderId, token);
      });

      // New message arrived
      s.on('getMessage', (newMessage: any) => {
        // Only append if this message belongs to *this* 1:1
        const msgSenderId = getId(newMessage?.sender);
        const msgReceiverId = getId(newMessage?.receiver);

        if (!senderId || !receiverId) return;

        const sameDyad =
          (msgSenderId === senderId && msgReceiverId === receiverId) ||
          (msgSenderId === receiverId && msgReceiverId === senderId);

        if (sameDyad) {
          setMessages(prev => [newMessage, ...prev]);
        }
      });

      s.on('error', (err: any) => myConsole('socket:error', err));
      s.on('register', (res: any) => myConsole('socket:register', res));
    };

    setup();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [senderId]);

  // Forward once if present
  useEffect(() => {
    const s = socketRef.current;
    if (!s || !senderId) return;
    if (forwardedOnceRef.current) return;

    if (forwardedMessages && forwardedToUserId) {
      forwardedMessages.forEach((msg: any) => {
        const forwardMsg: MsgDataType = {
          sender: senderId,
          receiver: forwardedToUserId,
          text: msg.text,
          ...(msg.attachments?.length ? {attachments: msg.attachments} : {}),
          ...(msg.contact ? {contact: msg.contact} : {}),
          ...(msg.location ? {location: msg.location} : {}),
        };
        s.emit('sendMessage', forwardMsg);
      });
      forwardedOnceRef.current = true;
      toast.success('Message forwarded successfully!');
    }
  }, [senderId, forwardedMessages, forwardedToUserId, toast]);

  // Auto-send when user picked contact or location (your existing pattern)
  useEffect(() => {
    if (contact) sendMessage();
  }, [contact]);

  useEffect(() => {
    if (location) sendMessage();
  }, [location]);

  /* -------------------------------- Handlers -------------------------------- */

  const sendMessage = (override?: {attachments?: any[]}): void => {
    const s = socketRef.current;
    if (!s || !senderId || !receiverId) return;
    const effectiveAttachments = override?.attachments ?? file?.attachments;
    if (!message.trim() && !effectiveAttachments && !location && !contact) {
      console.log('sendMessage:earlyReturn:noContent');
      return;
    }

    const newMessage: MsgDataType = {
      receiver: receiverId,
      text: message,
      sender: senderId,
      ...(effectiveAttachments?.length
        ? {attachments: effectiveAttachments}
        : {}),
      ...(location &&
      location.latitude !== undefined &&
      location.longitude !== undefined
        ? {
            location: {
              latitude: location.latitude,
              longitude: location.longitude,
              ...(location.name ? {name: location.name} : {}),
              ...(location.address ? {address: location.address} : {}),
            },
          }
        : {}),
      ...(contact?.name && contact?.phoneNumber
        ? {
            contact: {
              name: contact.name,
              phoneNumber: contact.phoneNumber,
              ...(contact.email ? {email: contact.email} : {}),
              ...(contact.profilePicture
                ? {profilePicture: contact.profilePicture}
                : {}),
            },
          }
        : {}),
    };
    s.emit('sendMessage', newMessage);

    // Reset composers
    setMessage('');
    if (!override?.attachments) setFile(null);
    setContact(undefined);
    setLocation(undefined);
    setImageViewModalVisible(false);
  };

  const pickFile = async () => {
    pickFileHelper({
      onStartUpload: () => {
        setAttachmentsPopup(false);
        setImageViewModalVisible(true);
      },
      onSuccess: fileData => {
        setFile(fileData);
      },
    });
  };

  const pickContact = () => {
    setAttachmentsPopup(false);
    navigation.navigate(commonRoute.CommonStack, {
      screen: commonRoute.SelectContacts,
      params: {
        onContactSelect: (selectedContact: MsgDataType['contact']) => {
          setContact(selectedContact);
        },
      },
    });
  };

  const pickLocation = () => {
    setAttachmentsPopup(false);
    navigation.navigate(chatRoute.ChatStack, {
      screen: chatRoute.MapScreen,
      params: {
        onLocationSelect: (selectedLocation: MsgDataType['location']) => {
          setLocation(selectedLocation);
        },
      },
    });
  };

  const setCamera = () => {
    console.log('UI:Camera:openPressed');
    setAttachmentsPopup(false);
    setCameraVisible(true);
  };

  const switchCamera = () => {
    setCameraType(prev =>
      prev === CameraType.Back ? CameraType.Front : CameraType.Back,
    );
  };

  const handleCapturedImage = async (uri: string) => {
    try {
      if (uri.startsWith('file://')) {
        const filePath = uri.replace('file://', '');
        const fileName = filePath.split('/').pop() || `IMG_${Date.now()}.jpg`;
        const destFilePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
        await RNFS.moveFile(filePath, destFilePath);
        setCapturedImage(`file://${destFilePath}`);
        const finalUri = `file://${destFilePath}`;
        setCapturedImage(finalUri);
      } else {
        setCapturedImage(uri);
        setCapturedImage(uri);
      }
    } catch (error) {}
  };

  const sendCapturedImage = async (uri: string | null) => {
    if (!uri) return;
    sendCapturedImageHelper({
      uri,
      onSuccess: fileData => {
        setCameraVisible(false);
        setCapturedImage(null);
        // send immediately with attachments override to avoid state update race
        sendMessage({attachments: fileData?.attachments || []});
      },
      onError: () => {
        myConsole('sendCapturedImage:onError', 'helper failed');
      },
    });
  };

  const handleDeleteMessages = () =>
    handleDeleteMessagesHelper({
      Alert: require('react-native').Alert,
      toast,
      selectedMessages,
      deleteMessagesByIds,
      fetchMessages,
      setSelectedMessages,
    });

  const copyMessageToClipboard = () => {
    if (selectedMessages.length === 1) {
      // Lazy import to keep top imports tidy
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      Clipboard.setString(selectedMessages[0]?.text || '');
      toast.success('Copied to clipboard!');
    }
  };

  /* --------------------------------- Render --------------------------------- */

  const userFullName = `${peerUser?.firstName || ''} ${
    peerUser?.lastName || ''
  }`.trim();

  const endReachedTsRef = useRef(0);

  const selectedSet = useMemo(
    () => new Set(selectedMessages.map(m => m._id)),
    [selectedMessages],
  );

  const handleToggleSelect = useCallback((msg: any) => {
    setSelectedMessages(prev =>
      prev.some(m => m._id === msg._id)
        ? prev.filter(m => m._id !== msg._id)
        : [...prev, msg],
    );
  }, []);

  const renderItem = useCallback(
    ({item}: {item: any}) => (
      <MessageComponent
        data={item}
        senderId={senderId}
        isSelected={selectedSet.has(item?._id)}
        onToggleSelect={handleToggleSelect}
        isComeFromAnotherScreen={isComeFromAnotherScreen}
        media={media}
      />
    ),
    [handleToggleSelect, senderId, selectedSet],
  );
  myConsole('rrrr', data?.receiver);
  return (
    <MainContainer
      title={
        selectedMessages.length > 0
          ? ''
          : getTextWithLength(userFullName, 14) || 'Chat'
      }
      // showAvatar={selectedMessages.length > 0 ? '' : !!userFullName}
      showRightTxt={
        selectedMessages.length > 0 ? String(selectedMessages.length) : ''
      }
      showRightIcon={
        selectedMessages.length > 0
          ? [
              {
                imageSource: require('../../assets/animatedIcons/deleteAni.png'),
                onPress: handleDeleteMessages,
                size: 22,
              },
              ...(selectedMessages.length === 1
                ? [
                    {
                      imageSource: require('../../assets/animatedIcons/copyAni.png'),
                      onPress: copyMessageToClipboard,
                      size: 22,
                    },
                  ]
                : []),
              {
                imageSource: require('../../assets/animatedIcons/forwardAni.png'),
                onPress: () => navigation.navigate(null, {selectedMessages}),
                size: 22,
              },
            ]
          : [
              {
                imageSource: require('../../assets/icons/video-call.png'),
                onPress: () => {
                  const phoneNumber = data?.receiver?.phone;
                  if (!phoneNumber) return;

                  if (Platform.OS === 'ios') {
                    const facetimeUrl = `facetime:${phoneNumber}`;
                    Linking.openURL(facetimeUrl).catch(err =>
                      console.error('Failed to open FaceTime:', err),
                    );
                  } else {
                    // Android: fallback (here just open dialer for now)
                    const telUrl = `tel:${phoneNumber}`;
                    Linking.openURL(telUrl).catch(err =>
                      console.error('Failed to open dialer:', err),
                    );
                  }
                },
                size: 28,
              },
              {
                imageSource: require('../../assets/icons/call.png'),
                onPress: () => {
                  const phoneNumber = data?.receiver?.phone;
                  if (phoneNumber) {
                    const telUrl = `tel:${phoneNumber}`;
                    Linking.openURL(telUrl).catch(err =>
                      console.error('Failed to open dialer:', err),
                    );
                  }
                },
                color: color.mainColor,
                size: 20,
              },
              // {
              //   imageSource: require('../../assets/icons/verThreeDots.png'),
              //   onPress: () => null,
              //   color: color.mainColor,
              // },
            ]
      }
      isBack={() => {
        if (isComeFromAnotherScreen) {
          navigation.navigate(chatRoute.ChatsList, {
            isComeFromAnotherScreen: false,
          });
        } else {
          navigation.pop();
        }
      }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={
          Platform.OS === 'ios' ? 90 : Math.max(0, keyboardHeight / 2 - 44)
        }
        style={chatScreenStyles.container}>
        {fetchError ? (
          <CustomErrorMessage
            message={fetchError}
            onRetry={() => fetchMessages(1)}
          />
        ) : messages.length === 0 && !isFetching ? (
          <EmptyChatPlaceholder
            onEmojiPress={() => setMessage(prev => prev + '😊')}
            onSendHi={() => {
              setMessage('Hi');
              sendMessage();
            }}
          />
        ) : isFetching && messages.length === 0 ? (
          <LoadingCompo />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            inverted
            keyExtractor={(item, index) => item?._id ?? `local-${index}`}
            contentContainerStyle={[
              chatScreenStyles.chatArea,
              {paddingBottom: keyboardHeight || 20},
            ]}
            keyboardShouldPersistTaps="handled"
            renderItem={renderItem}
            extraData={selectedMessages}
            ListFooterComponent={
              <View
                style={{height: keyboardHeight ? keyboardHeight + 20 : 20}}
              />
            }
            onEndReached={() => {
              const now = Date.now();
              if (isFetchingRef.current || now - endReachedTsRef.current < 800)
                return;
              endReachedTsRef.current = now;
              fetchMessages(page + 1);
            }}
            onMomentumScrollBegin={() => {
              endReachedTsRef.current = 0;
            }}
            onEndReachedThreshold={0.8}
          />
        )}

        {!fetchError && (
          <MessageInputBar
            message={message}
            onChangeMessage={setMessage}
            onSendMessage={sendMessage}
            onAttachmentPress={() => setAttachmentsPopup(!attachmentsPopup)}
            autoFocus={inputAutoFocus}
          />
        )}

        {!isComeFromAnotherScreen && (
          <FilePreviewModal
            visible={imageViewModalVisible}
            onClose={() => setImageViewModalVisible(false)}
            file={file}
            message={message}
            onChangeMessage={setMessage}
            onSend={sendMessage}
            keyboardHeight={keyboardHeight}
            toggleAttachmentPopup={() => setAttachmentsPopup(!attachmentsPopup)}
          />
        )}

        {cameraVisible && (
          <CameraCaptureView
            cameraRef={cameraRef}
            cameraType={cameraType}
            switchCamera={switchCamera}
            onBack={() => setCameraVisible(false)}
            onCaptured={handleCapturedImage}
          />
        )}

        {/* Captured image confirm/send */}
        <CustomModal
          visible={!!capturedImage}
          onClose={() => setCapturedImage(null)}>
          <View style={{alignItems: 'center'}}>
            {capturedImage ? (
              <Image
                source={{uri: capturedImage}}
                style={{width: 220, height: 220}}
              />
            ) : null}
            <View style={[myStyle.rowAround, {marginTop: 12, width: '100%'}]}>
              <TouchableOpacity onPress={() => setCapturedImage(null)}>
                <CustomText style={{color: color.blockRed, fontWeight: '700'}}>
                  Discard
                </CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sendCapturedImage(capturedImage)}>
                <CustomText
                  style={{color: color.bluTextColor, fontWeight: '700'}}>
                  Send
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </CustomModal>

        <CustomModal
          visible={attachmentsPopup}
          onClose={() => setAttachmentsPopup(false)}
          containerStyle={chatScreenStyles.attachmentContStyle}
          customBgStyle={{justifyContent: 'flex-end'}}>
          <View style={myStyle.rowAround}>
            {attachmentList.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={chatScreenStyles.attachmentItem}
                onPress={() => {
                  if (item.label === 'Camera') setCamera();
                  else if (item.label === 'Gallery') pickFile();
                  else if (item.label === 'Location') pickLocation();
                  else if (item.label === 'Contact') pickContact();
                }}>
                <Image
                  source={item.icon}
                  style={chatScreenStyles.attachmentIcon}
                />
                <CustomText style={chatScreenStyles.attachmentText}>
                  {item.label}
                </CustomText>
              </TouchableOpacity>
            ))}
          </View>
        </CustomModal>
      </KeyboardAvoidingView>
    </MainContainer>
  );
};

export default ChattingScreen;

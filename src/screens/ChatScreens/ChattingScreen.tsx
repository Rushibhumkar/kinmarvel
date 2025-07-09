import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Text,
  Modal,
} from 'react-native';
import MainContainer from '../../components/MainContainer';
import {useGetMyData} from '../../api/profile/profileFunc';
import io, {Socket} from 'socket.io-client';
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
import {useFocusEffect} from '@react-navigation/native';
import {showErrorToast} from '../../utils/toastModalFunction';
import MessageComponent from './components/MessageComponent';
import {Camera, CameraType} from 'react-native-camera-kit';
import RNFS from 'react-native-fs';
import {chatRoute, commonRoute} from '../AuthScreens/routeName';
import EmptyChatPlaceholder from './components/EmptyChatPlaceholder';
import MessageInputBar from './components/MessageInputBar';
import FilePreviewModal from './components/FilePreviewModal';
import CustomErrorMessage from '../../components/CustomErrorMessage';
import {pickFileHelper} from './components/pickFileHelper';
import CameraCaptureView from './components/CameraCaptureView';
import {sendCapturedImageHelper} from './components/sendCapturedImageHelper';
import CapturedImagePreviewModal from './components/CapturedImagePreviewModal';
import CallModalBase, {callstyles} from './components/CallModalBase';
import {sizes} from '../../const';
import CustomAvatar from '../../components/CustomAvatar';
import {getTextWithLength} from '../../utils/commonFunction';

const ChattingScreen = ({navigation, route}: any) => {
  const {data} = route.params;
  const {data: myData} = useGetMyData();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<any>>([]);
  const [attachmentsPopup, setAttachmentsPopup] = useState(false);
  const [socket, setSocket] = useState<Socket>();
  const [messageLoad, setMessageLoad] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [imageViewModalVisible, setImageViewModalVisible] = useState(false);
  const [file, setFile] = useState<any>(null);
  const [sendCapturedImgLoad, setSendCapturedImgLoad] = useState(false);
  const [contact, setContact] = useState<MsgDataType['contact'] | undefined>();
  const [location, setLocation] = useState<
    MsgDataType['location'] | undefined
  >();

  const [cameraVisible, setCameraVisible] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.Back);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [callingModal, setCallingModal] = useState<boolean>(false);
  const [videoCallModal, setVideoCallModal] = useState<boolean>(false);
  const [selectedMessages, setSelectedMessages] = useState<Array<string>>([]);
  const cameraRef = useRef(null); // Reference to the camera
  useFocusEffect(
    useCallback(() => {
      if (messages.length > 0) {
        const lastReceivedMessage = messages.find(
          msg => msg.sender !== senderId,
        );
        // myConsole('lastReceivedMessage', lastReceivedMessage);
        if (lastReceivedMessage && socket) {
          socket.emit('markSeenMessage', lastReceivedMessage._id);
        }
      }
    }, [messages, socket]),
  );
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      event => {
        setKeyboardHeight(event.endCoordinates.height);
        // console.log('Keyboard Height:', event.endCoordinates.height);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      },
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const senderId = myData?.data?._id;
  const receiverId = data?._id;
  useEffect(() => {
    fetchMessages();
    socketSetup();
    // return () => {
    //   if (socket) socket.disconnect();
    //   console.log('socket is disconnected');
    // };
  }, []);

  const flatListRef = useRef(null);

  const socketSetup = async () => {
    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      query: {userId: senderId}, // Send userId when connecting
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });

    const token = await getData('authToken');
    newSocket.emit('register', senderId, token);

    newSocket.on('getMessage', (newMessage: any) => {
      setMessages((prevMessages: any) => [newMessage, ...prevMessages]);
    });

    newSocket.emit('markSeenMessage', messages[0]?._id);

    newSocket.on('error', (newMessage: any) => {
      console.log({event: 'error', message: newMessage});
    });
    newSocket.on('register', (newMessage: any) => {
      console.log({event: 'register', message: newMessage});
    });
  };

  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);

  const fetchMessages = async (nextPage = 1) => {
    if (isFetching) return;
    setIsFetching(true);

    try {
      const response = await API_AXIOS.get(
        `${SOCKET_SERVER_URL}/api/chat/${receiverId}?limit=20&page=${nextPage}`,
      );
      const newMessages = response.data.data.messages ?? [];
      if (nextPage === 1) {
        setMessages(newMessages);
        setFetchError(null);
      } else {
        setMessages(prevMessages => [...prevMessages, ...newMessages]);
      }

      setPage(nextPage);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setFetchError('Failed to load messages. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  const sendMessage = (): void => {
    if (!message.trim() && !file && !location && !contact) return;
    // myConsole('sldfjldksf', file);
    const newMessage: MsgDataType = {
      receiver: receiverId,
      text: message,
      sender: senderId,
      ...(file?.attachments && file.attachments.length > 0
        ? {attachments: file.attachments}
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
      ...(contact && contact.name && contact.phoneNumber
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

    if (socket) {
      socket.emit('sendMessage', newMessage);
    }
    setMessage('');
    setFile(null);
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
          // myConsole('Returned contact: ', selectedContact);
          setContact(selectedContact);
        },
      },
    });
  };

  const pickCamera = () => {
    setAttachmentsPopup(false);
    setCameraVisible(true); // Open the camera when this option is selected
  };

  const switchCamera = () => {
    setCameraType(prevType =>
      prevType === CameraType.Back ? CameraType.Front : CameraType.Back,
    );
  };

  const handleCapturedImage = async (uri: any) => {
    if (uri.startsWith('file://')) {
      const filePath = uri.replace('file://', '');
      const pathSegments = filePath.split('/');
      const fileName = pathSegments[pathSegments.length - 1];

      const destFilePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

      try {
        await RNFS.moveFile(filePath, destFilePath);
        const updatedUri = `file://${destFilePath}`;
        setCapturedImage(updatedUri); // Store the captured image URI
      } catch (error) {
        console.error('Error saving captured image:', error);
      }
    }
  };

  const sendCapturedImage = async (uri: string) => {
    sendCapturedImageHelper({
      uri,
      onSuccess: fileData => {
        setFile(fileData);
        setCameraVisible(false);
        setCapturedImage(null);
        sendMessage();
      },
      onError: () => {
        // optionally reset any states here
      },
    });
  };

  // myConsole('fielssss', file);
  const pickLocation = () => {
    setAttachmentsPopup(false);
    navigation.navigate(chatRoute.ChatStack, {
      screen: chatRoute.MapScreen,
      params: {
        onLocationSelect: (selectedLocation: MsgDataType['location']) => {
          // myConsole('Returned location: ', selectedLocation);
          setLocation(selectedLocation);
        },
      },
    });
  };

  useEffect(() => {
    if (contact) {
      sendMessage();
    }
  }, [contact]);

  useEffect(() => {
    if (location) {
      sendMessage();
    }
  }, [location]);
  const userFullName = `${data?.receiver?.firstName || data?.firstName || ''} ${
    data?.receiver?.lastName || data?.lastName || ''
  }`;
  myConsole('selectedMessages', selectedMessages);
  myConsole('messages', messages);
  return (
    <MainContainer
      title={getTextWithLength(userFullName.trim(), 14) || 'Chat'}
      showAvatar={
        (data?.receiver?.firstName || data?.firstName) && userFullName
      }
      showRightIcon={
        selectedMessages.length > 0
          ? [
              {
                imageSource: require('../../assets/icons/delete.png'),
                onPress: () => {},
                size: 22,
              },
              ...(selectedMessages.length === 1
                ? [
                    {
                      imageSource: require('../../assets/icons/copy.png'),
                      onPress: () => {},
                      size: 22,
                    },
                  ]
                : []),
              {
                imageSource: require('../../assets/icons/forward.png'),
                onPress: () => {}, // Optional future action
                size: 22,
              },
            ]
          : [
              {
                imageSource: require('../../assets/icons/video-call.png'),
                onPress: () => {
                  setVideoCallModal(true);
                },
                size: 28,
              },
              {
                imageSource: require('../../assets/icons/call.png'),
                onPress: () => {
                  setCallingModal(true);
                },
                color: color.mainColor,
                size: 20,
              },
              {
                imageSource: require('../../assets/icons/verThreeDots.png'),
                onPress: () => null,
                color: color.mainColor,
              },
            ]
      }
      isBack>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={
          Platform.OS === 'ios' ? 90 : keyboardHeight / 2 - 44
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
        ) : messageLoad ? (
          <LoadingCompo />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            inverted
            keyExtractor={item => item?._id ?? 'defaultKey'} // Use a default key if item or item._id is null/undefined
            contentContainerStyle={[
              chatScreenStyles.chatArea,
              {paddingBottom: keyboardHeight || 20},
            ]}
            keyboardShouldPersistTaps="handled"
            renderItem={({item}) =>
              item ? (
                <MessageComponent
                  data={item}
                  senderId={senderId}
                  selectedMessages={selectedMessages}
                  onToggleSelect={(msgId: any) => {
                    setSelectedMessages(prev =>
                      prev.includes(msgId)
                        ? prev.filter(id => id !== msgId)
                        : [...prev, msgId],
                    );
                  }}
                />
              ) : (
                <View>
                  <CustomText>No message</CustomText>
                </View>
              )
            }
            ListFooterComponent={
              <View
                style={{height: keyboardHeight ? keyboardHeight + 20 : 20}}
              />
            }
            onEndReached={() => fetchMessages(page + 1)}
            onEndReachedThreshold={0.8}
          />
        )}
        {!fetchError && (
          <MessageInputBar
            message={message}
            onChangeMessage={setMessage}
            onSendMessage={sendMessage}
            onAttachmentPress={() => setAttachmentsPopup(!attachmentsPopup)}
          />
        )}

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

        {cameraVisible && (
          <CameraCaptureView
            cameraRef={cameraRef}
            cameraType={cameraType}
            switchCamera={switchCamera}
            onBack={() => setCameraVisible(false)}
            onCaptured={handleCapturedImage}
          />
        )}

        <CapturedImagePreviewModal
          visible={!!capturedImage}
          imageUri={capturedImage || ''}
          onClose={() => setCapturedImage(null)}
          onSend={() => sendCapturedImage(capturedImage)}
          isSending={sendCapturedImgLoad}
        />
        <CallModalBase
          visible={videoCallModal}
          onClose={() => setVideoCallModal(false)}
          userName={userFullName}
          avatarUrl={data?.profilePicture}
          showVideoToggle={true}
        />

        <CallModalBase
          visible={callingModal}
          onClose={() => setCallingModal(false)}
          userName={userFullName}
          avatarUrl={data?.profilePicture}
          showVideoToggle={false}
        />
        {videoCallModal && (
          <View
            style={{
              backgroundColor: 'black',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 999,
            }}>
            <Text style={{color: '#fff', fontSize: 20, marginBottom: 20}}>
              📹 Video Calling...
            </Text>
            <TouchableOpacity
              style={{padding: 12, backgroundColor: '#fff', borderRadius: 8}}
              onPress={() => setVideoCallModal(false)}>
              <Text style={{color: 'red'}}>End Video Call</Text>
            </TouchableOpacity>
          </View>
        )}

        {callingModal && (
          <View
            style={{
              backgroundColor: '#222',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 999,
            }}>
            <Text style={{color: '#fff', fontSize: 20, marginBottom: 20}}>
              📞 Voice Calling...
            </Text>
            <TouchableOpacity
              style={{padding: 12, backgroundColor: '#fff', borderRadius: 8}}
              onPress={() => setCallingModal(false)}>
              <Text style={{color: 'red'}}>End Call</Text>
            </TouchableOpacity>
          </View>
        )}

        <CustomModal
          visible={attachmentsPopup}
          onClose={() => setAttachmentsPopup(false)}
          containerStyle={chatScreenStyles.attachmentContStyle}
          customBgStyle={{
            justifyContent: 'flex-end',
          }}>
          <View style={myStyle.rowAround}>
            {attachmentList.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={chatScreenStyles.attachmentItem}
                onPress={() => {
                  if (item.label === 'Camera')
                    pickCamera(); // Open camera when clicked
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

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Text,
  Modal,
  ActivityIndicator,
} from 'react-native';
import MainContainer from '../../components/MainContainer';
import {useGetMyData} from '../../api/profile/profileFunc';
import io, {Socket} from 'socket.io-client';
import {
  API_AXIOS,
  fileViewURL,
  SOCKET_SERVER_URL,
} from '../../api/axiosInstance';
import {myConsole} from '../../utils/myConsole';
import {myStyle, shadow} from '../../sharedStyles';
import {getData} from '../../hooks/useAsyncStorage';
import LoadingCompo from '../../components/LoadingCompo/LoadingCompo';
import {sizes} from '../../const';
import {attachmentList} from '../../const/data';
import {color} from '../../const/color';
import {launchImageLibrary} from 'react-native-image-picker';
import CustomModal from '../../components/CustomModal';
import CustomText from '../../components/CustomText';
import {MsgDataType} from '../../utils/typescriptInterfaces';
import {useFocusEffect} from '@react-navigation/native';
import {showErrorToast} from '../../utils/toastModalFunction';
import MessageComponent from './components/MessageComponent';
import {Camera, CameraType} from 'react-native-camera-kit';
import RNFS from 'react-native-fs';
import Video from 'react-native-video';
import {
  chatRoute,
  commonRoute,
  homeRoute,
  profileRoute,
} from '../AuthScreens/routeName';

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
        console.log('Keyboard Height:', event.endCoordinates.height);
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
      } else {
        setMessages(prevMessages => [...prevMessages, ...newMessages]);
      }

      setPage(nextPage);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
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
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed', // 'mixed' allows both images and videos
        includeBase64: false,
        selectionLimit: 1,
      });

      if (result.didCancel) return;

      if (result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        // myConsole('Selected file', selectedFile);

        // Set modal visibility
        setImageViewModalVisible(true);
        setAttachmentsPopup(false);

        // Prepare form data for upload
        const formData = new FormData();
        formData.append('files', {
          uri: selectedFile.uri,
          type: selectedFile.type,
          name: selectedFile.fileName || 'upload.jpg',
        });

        const {data} = await API_AXIOS.post('/file/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (data?.success && data?.data?.files?.length > 0) {
          const uploadedFilePath = data.data.files[0];

          const attachment = {
            path: uploadedFilePath, // File path from API response
            size: selectedFile.fileSize?.toString() || '',
            mimeType: selectedFile.type || '',
            fileName: selectedFile.fileName || 'upload.jpg',
          };

          setFile({
            ...selectedFile,
            attachments: [attachment],
          });
        }
      }
    } catch (error) {
      console.error('Error picking or uploading file:', error);
      showErrorToast({description: 'Failed to pick or upload the file.'});
    }
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

  const sendCapturedImage = async (uri: any) => {
    // setSendCapturedImgLoad(true);
    if (uri.startsWith('file://')) {
      const filePath = uri.replace('file://', '');
      const pathSegments = filePath.split('/');
      const fileName = pathSegments[pathSegments.length - 1];

      // Save to the Downloads folder
      const destFilePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      try {
        // Move the captured file to Downloads folder
        await RNFS.moveFile(filePath, destFilePath);
        const updatedUri = `file://${destFilePath}`;
        setCapturedImage(updatedUri); // Store the captured image URI

        // Create FormData for uploading the image
        const formData = new FormData();
        formData.append('files', {
          uri: updatedUri,
          type: 'image/jpeg', // Adjust MIME type as per your image
          name: fileName,
        });

        // Upload the image to the server
        const {data} = await API_AXIOS.post('/file/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (data?.success && data?.data?.files?.length > 0) {
          const uploadedFilePath = data.data.files[0];

          const attachment = {
            path: uploadedFilePath,
            size: 'unknown', // Size logic can be added here
            mimeType: 'image/jpeg', // Adjust MIME type if necessary
            fileName,
          };
          setFile({
            attachments: [attachment],
          });
          setCameraVisible(false);
          setCapturedImage(null);
          sendMessage();
          // Optionally update state or notify the user of success
        } else {
          showErrorToast({description: 'Failed to upload the image.'});
        }
      } catch (error) {
        console.error('Error saving or uploading captured image:', error);
        showErrorToast({
          description: 'Error while saving or uploading the image.',
        });
      }
    }
    // setSendCapturedImgLoad(false);
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

  return (
    <MainContainer
      title={
        `${data?.receiver?.firstName || data?.firstName || ''} ${
          data?.receiver?.lastName || data?.lastName || ''
        }`.trim() || 'Chat'
      }
      isBack>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={
          Platform.OS === 'ios' ? 90 : keyboardHeight / 2 - 44
        }
        style={styles.container}>
        {messages.length === 0 && !isFetching ? (
          <View style={myStyle.flexCenter}>
            <CustomText style={{fontSize: 16, marginBottom: 10}}>
              No messages yet
            </CustomText>
            <TouchableOpacity onPress={() => setMessage(prev => prev + '😊')}>
              <Image
                source={require('../../assets/icons/emoji.png')}
                style={{width: 40, height: 40, marginBottom: 10}}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sendHiMsg}
              onPress={() => {
                setMessage('Hi');
                sendMessage();
              }}>
              <CustomText style={{color: '#FFF', fontSize: 16}}>
                Send Hi
              </CustomText>
            </TouchableOpacity>
          </View>
        ) : messageLoad ? (
          <LoadingCompo />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            inverted
            keyExtractor={item => item?._id ?? 'defaultKey'} // Use a default key if item or item._id is null/undefined
            contentContainerStyle={[
              styles.chatArea,
              {paddingBottom: keyboardHeight || 20},
            ]}
            keyboardShouldPersistTaps="handled"
            renderItem={({item}) =>
              item ? (
                <MessageComponent data={item} senderId={senderId} />
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
        <View style={styles.inputContainer}>
          <View style={styles.mainInputCont}>
            <TextInput
              style={styles.input}
              placeholder="Enter text..."
              placeholderTextColor="#999"
              value={message}
              onChangeText={setMessage}
            />

            <TouchableOpacity
              onPress={() => setAttachmentsPopup(!attachmentsPopup)}>
              <Image
                source={require('../../assets/icons/attachments.png')}
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={sendMessage}
            // disabled={!message.trim()}
          >
            <Image
              tintColor={'#fff'}
              source={require('../../assets/icons/sent.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
        <CustomModal
          visible={imageViewModalVisible}
          onClose={() => setImageViewModalVisible(false)}
          containerStyle={{
            height: keyboardHeight ? sizes.height / 2.5 : sizes.height / 1.2,
            marginTop: 40,
            width: sizes.width / 1.1,
          }}>
          <View style={{flex: 1, alignItems: 'center'}}>
            <CustomText style={styles.fileName}>
              {file?.fileName || 'Selected File'}
            </CustomText>

            {file?.attachments[0]?.mimeType?.includes('video') ? (
              // Display video if it's a video file
              <Video
                source={{
                  uri: `${fileViewURL}${file?.attachments[0]?.path}`,
                }} // Use the correct file URI for video source
                style={[
                  styles.viewImg,
                  {
                    width: sizes.width / 1.2,
                    height: keyboardHeight ? 180 : 400,
                  },
                ]}
                onError={() => console.log('Error loading video thumbnail')}
                resizeMode="contain"
                // onLoad={() => setLoading(false)} // On video load, stop the loading spinner
                // onError={() => {
                //   setLoading(false);
                //   setLoadError(true);
                // }}
                // paused={isPaused} // Play or pause the video based on the state
                repeat={false} // Set to true if you want the video to loop
              />
            ) : (
              // Handle non-video files (e.g., images)
              <Image
                source={{uri: file?.uri}}
                style={[
                  styles.viewImg,
                  {
                    width: sizes.width / 1.2,
                    height: keyboardHeight ? 180 : 600,
                  },
                ]}
                resizeMode="contain"
              />
            )}

            {/* Handle Input and Message Sending */}
            <View
              style={[styles.inputContainer, {paddingHorizontal: 0, gap: 2}]}>
              <View style={styles.mainInputCont}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter text..."
                  placeholderTextColor="#999"
                  value={message}
                  onChangeText={setMessage}
                />
                <TouchableOpacity
                  onPress={() => setAttachmentsPopup(!attachmentsPopup)}>
                  <Image
                    source={require('../../assets/icons/attachments.png')}
                    style={styles.icon}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.sendBtn, {marginLeft: 4}]}
                onPress={sendMessage}>
                <Image
                  tintColor={'#fff'}
                  source={require('../../assets/icons/sent.png')}
                  style={styles.icon}
                />
              </TouchableOpacity>
            </View>
          </View>
        </CustomModal>

        {cameraVisible && (
          <View style={styles.viewCamMainView}>
            <Camera
              ref={cameraRef}
              cameraType={cameraType}
              flashMode="auto"
              style={{flex: 1}}
              onCapture={async event => {
                const {uri} = event;
                setCapturedImage(uri); // Store the captured image URI
                setCameraVisible(false); // Close the camera after capture
                handleCapturedImage(uri); // Handle the captured image (upload/send)
              }}
            />

            <TouchableOpacity
              style={styles.camBackBtn}
              onPress={() => setCameraVisible(false)}>
              <CustomText
                style={{color: '#000', fontSize: 16, fontWeight: '400'}}>
                Back
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                const {uri} = await cameraRef.current.capture();
                setCapturedImage(uri);
                // setCameraVisible(false);
                handleCapturedImage(uri);
              }}
              style={styles.captureCamBtn}>
              <Image
                source={require('../../assets/icons/capture-camera.png')}
                height={12}
                width={12}
                style={{height: 32, width: 32}}
                tintColor={'#fff'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.switchCamBtn}
              onPress={switchCamera}>
              <Image
                source={require('../../assets/icons/switch-camera.png')}
                height={12}
                width={12}
                style={{height: 32, width: 32}}
                tintColor={'#fff'}
              />
            </TouchableOpacity>
          </View>
        )}

        {capturedImage && (
          <Modal
            visible={true}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setCapturedImage(null)}>
            <View style={styles.modalContainer}>
              <Image
                source={{uri: capturedImage}}
                style={styles.capturedImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                onPress={() => setCapturedImage(null)}
                style={styles.closeButton}>
                <Text style={{color: '#fff'}}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sendCapturedImage(capturedImage)}
                style={styles.sendButton}
                // disabled={sendCapturedImgLoad}
              >
                {/* {sendCapturedImgLoad ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{color: '#fff'}}>Send</Text>
                )} */}
                <Text style={{color: '#fff'}}>Send</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        )}

        <CustomModal
          visible={attachmentsPopup}
          onClose={() => setAttachmentsPopup(false)}
          containerStyle={styles.attachmentContStyle}
          customBgStyle={{
            justifyContent: 'flex-end',
          }}>
          <View style={myStyle.rowAround}>
            {attachmentList.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.attachmentItem}
                onPress={() => {
                  if (item.label === 'Camera')
                    pickCamera(); // Open camera when clicked
                  else if (item.label === 'Gallery') pickFile();
                  else if (item.label === 'Location') pickLocation();
                  else if (item.label === 'Contact') pickContact();
                }}>
                <Image source={item.icon} style={styles.attachmentIcon} />
                <CustomText style={styles.attachmentText}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  attachmentContStyle: {
    minHeight: null,
    minWidth: null,
    width: sizes.width,
  },
  viewImg: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  chatArea: {
    flexGrow: 1,
    padding: 10,
    justifyContent: 'flex-end',
    paddingTop: 100,
  },
  popupMenu: {
    position: 'absolute',
    right: 10,
    top: 50,
    backgroundColor: color.smoothBg,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  messageText: {
    fontSize: 16,
  },
  sendBtn: {
    paddingLeft: 6,
    paddingRight: 4,
    borderRadius: 50,
    backgroundColor: color.mainColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentPopup: {
    position: 'absolute',
    marginBottom: 8,
    bottom: 60,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: color.smoothBg,
    borderRadius: 16,
    paddingVertical: 10,
  },
  attachmentItem: {
    alignItems: 'center',
  },
  attachmentIcon: {
    width: 28,
    height: 28,
    marginBottom: 5,
    tintColor: color.mainColor,
  },
  attachmentText: {
    fontSize: 12,
    color: color.mainColor,
  },
  mainInputCont: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  inputContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    justifyContent: 'space-between',
  },
  icon: {
    width: 24,
    height: 24,
    marginHorizontal: 6,
  },
  emojiContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: sizes.height / 1.4,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    padding: 10,
  },

  fileName: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  image: {
    // width: 200,
    height: 400,
    marginTop: 10,
    borderRadius: 8,
  },
  sendHiMsg: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginVertical: 5,
  },
  customEmojiBgStyle: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 100,
    paddingBottom: 0,
  },
  viewCamMainView: {
    flex: 1,
    height: sizes.height,
    width: sizes.width,
    position: 'absolute',
    top: 0,
  },
  switchCamBtn: {
    position: 'absolute',
    bottom: 100,
    right: '10%',
    backgroundColor: '#00000040',
    padding: 8,
    borderRadius: 50,
  },
  captureCamBtn: {
    position: 'absolute',
    bottom: 100,
    left: '44%',
    backgroundColor: '#00000040',
    borderRadius: 50,
    padding: 10,
  },
  retakeCamBtn: {
    position: 'absolute',
    bottom: 100,
    left: '10%',
    backgroundColor: '#00000040',
    padding: 8,
    borderRadius: 50,
  },
  camBackBtn: {
    position: 'absolute',
    top: 20,
    left: '4%',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    borderRadius: 50,
    paddingHorizontal: 16,
    ...shadow,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent background
  },
  capturedImage: {
    width: '90%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
    backgroundColor: '#00000080',
    borderRadius: 20,
  },
  sendButton: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    marginLeft: -35,
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 50,
  },
});

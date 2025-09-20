import {
  StyleSheet,
  View,
  Image,
  Linking,
  TouchableOpacity,
  Modal,
} from 'react-native';
import React, {useState} from 'react';
import {myConsole} from '../../../utils/myConsole';
import {formatTime24Hour} from '../../../utils/commonFunction';
import CustomText from '../../../components/CustomText';
import {color} from '../../../const/color';
import CustomAvatar from '../../../components/CustomAvatar';
import MessageStatusTicks from './MessageStatusTicks';
import {fileViewURL} from '../../../api/axiosInstance';
import Video from 'react-native-video';
import {sizes} from '../../../const';

const MessageComponent = ({
  senderId,
  data,
  isSelected,
  onToggleSelect,
  isComeFromAnotherScreen,
  media,
}: any) => {
  const [viewFullImg, setViewFullImg] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isPaused, setIsPaused] = useState(false);
  const [loadError, setLoadError] = useState(false);
  myConsole('iscomeddd', isComeFromAnotherScreen);
  myConsole('imedd', media);
  const handleImageClick = (uri: string) => {
    setSelectedImage(uri);
    setViewFullImg(true);
    setIsPaused(false);
  };

  const hasText = !!(data.text && String(data.text).trim().length > 0);
  const hasAttachments =
    Array.isArray(data.attachments) && data.attachments.length > 0;
  const hasContact =
    data.contact &&
    typeof data.contact === 'object' &&
    data.contact.name &&
    data.contact.phoneNumber;
  const hasLocation =
    data.location &&
    typeof data.location === 'object' &&
    data.location.latitude !== undefined &&
    data.location.longitude !== undefined;

  const isSender =
    (typeof data?.sender === 'string' ? data.sender : data?.sender?._id) ===
    senderId;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        if (isSelected) onToggleSelect(data);
      }}
      onLongPress={() => onToggleSelect(data)}
      style={[
        isSender && data.attachments?.length > 0
          ? styles.myMsgAttachment
          : isSender
          ? styles.myMessageContainer
          : styles.otherMessageContainer,
        {
          alignSelf: isSender ? 'flex-end' : 'flex-start',
          backgroundColor: isSelected
            ? '#B2DFDB'
            : isSender
            ? color.mainColorFade
            : '#E0E0E0',
        },
      ]}
      key={data?._id}>
      {/* Attachments */}
      {hasAttachments &&
        data.attachments.map((attachment: any, index: number) => {
          const isVideo = String(attachment.mimeType || '').includes('video');
          const uri = `${fileViewURL}${attachment.path}`;

          return (
            <View
              key={`${data?._id || 'att'}-${index}`}
              style={{position: 'relative', marginBottom: 6}}>
              <TouchableOpacity
                onPress={() => {
                  if (isSelected) onToggleSelect(data);
                  else handleImageClick(uri);
                }}
                onLongPress={() => onToggleSelect(data)}>
                {isVideo ? (
                  <View style={{position: 'relative'}}>
                    <Video
                      source={{uri}}
                      style={{height: 220, width: 220}}
                      resizeMode="cover"
                      paused={true}
                      poster={uri}
                      onError={(error: any) =>
                        myConsole('Error loading video:', error)
                      }
                    />
                    <View
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: [{translateX: -20}, {translateY: -20}],
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        padding: 10,
                        borderRadius: 30,
                      }}>
                      <Image
                        source={require('../../../assets/icons/play.png')}
                        style={{width: 30, height: 30, tintColor: '#fff'}}
                      />
                    </View>
                  </View>
                ) : (
                  <Image
                    source={{uri}}
                    style={{height: 220, width: 220}}
                    resizeMode="cover"
                    onError={error => myConsole('Error loading image:', error)}
                  />
                )}
              </TouchableOpacity>

              {/* Time + ticks over media */}
              <View style={styles.attachmentTickTime}>
                <CustomText style={{color: '#fff', fontSize: 10}}>
                  {formatTime24Hour(data.createdAt)}
                </CustomText>
                <MessageStatusTicks
                  isSeen={data.isSeen}
                  isDelivered={data.isDelivered}
                  isSender={isSender}
                />
              </View>
            </View>
          );
        })}

      {/* Full-screen viewer (image or video) */}
      {viewFullImg && (
        <Modal visible transparent onRequestClose={() => setViewFullImg(false)}>
          <View style={styles.fullViewBackdrop}>
            {selectedImage.endsWith('.mp4') ? (
              <Video
                source={{uri: selectedImage}}
                style={{width: sizes.width, height: sizes.height}}
                resizeMode="contain"
                paused={isPaused}
                onError={() => setLoadError(true)}
                onEnd={() => setViewFullImg(false)}
              />
            ) : (
              <Image
                source={{uri: selectedImage}}
                style={{width: sizes.width, height: sizes.height}}
                resizeMode="contain"
              />
            )}

            <TouchableOpacity
              style={styles.fullViewBackBtn}
              activeOpacity={0.6}
              onPress={() => setViewFullImg(false)}>
              <Image
                source={require('../../../assets/icons/back.png')}
                style={{height: 32, width: 32, tintColor: '#fff'}}
              />
            </TouchableOpacity>

            {loadError && (
              <CustomText style={styles.fullViewError}>
                Failed to load video
              </CustomText>
            )}

            {selectedImage.endsWith('.mp4') && (
              <TouchableOpacity
                onPress={() => setIsPaused(!isPaused)}
                style={styles.fullViewPlayPause}>
                <Image
                  source={
                    isPaused
                      ? require('../../../assets/icons/play.png')
                      : require('../../../assets/icons/pause.png')
                  }
                  style={{width: 30, height: 30}}
                />
              </TouchableOpacity>
            )}
          </View>
        </Modal>
      )}

      {/* Contact card */}
      {hasContact && (
        <View>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <CustomAvatar
              imgUrl={data.contact.profilePicture}
              name={String(data.contact.name ?? '')}
              imgStyle={{height: 32, width: 32}}
            />
            <CustomText
              style={isSender ? styles.myMessageText : styles.otherMessageText}>
              {data.contact.name}
            </CustomText>
          </View>
          <CustomText
            style={isSender ? styles.myMsgNumber : styles.otherMsgNumber}>
            {data.contact.phoneNumber}
          </CustomText>
          {data.contact.email && (
            <CustomText
              style={isSender ? styles.myMsgNumber : styles.otherMsgNumber}>
              {data.contact.email}
            </CustomText>
          )}
          <View style={styles.timeTickView}>
            <CustomText
              style={isSender ? styles.myMsgTime : styles.otherMsgTime}>
              {formatTime24Hour(data.createdAt)}
            </CustomText>
            <MessageStatusTicks
              isSeen={data.isSeen}
              isDelivered={data.isDelivered}
              isSender={isSender}
            />
          </View>
        </View>
      )}

      {/* Location card */}
      {hasLocation && (
        <View>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <Image
              source={require('../../../assets/icons/location.png')}
              style={{
                height: 20,
                width: 20,
                tintColor: isSender ? '#fff' : '#000',
              }}
            />
            <CustomText
              style={isSender ? styles.myMessageText : styles.otherMessageText}>
              Location
            </CustomText>
          </View>
          {data.location.name && data.location.address && (
            <CustomText
              style={[
                isSender ? styles.myLocTxt : styles.otherLocTxt,
                {marginLeft: 4},
              ]}>
              {data.location.name || ''}
              {', '}
              {data.location.address || ''}
            </CustomText>
          )}
          <View style={styles.locationNameView}>
            <CustomText
              style={styles.seeLocBtn}
              onPress={() => {
                const {latitude, longitude} = data.location;
                const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
                Linking.openURL(url);
              }}>
              See on Map
            </CustomText>
            <View style={styles.seeMapBelowViewStyle}>
              <CustomText
                style={isSender ? styles.myMsgTime : styles.otherMsgTime}>
                {formatTime24Hour(data.createdAt)}
              </CustomText>
              <MessageStatusTicks
                isSeen={data.isSeen}
                isDelivered={data.isDelivered}
                isSender={isSender}
              />
            </View>
          </View>
        </View>
      )}

      {/* Plain text */}
      {hasText && !hasAttachments && !hasContact && !hasLocation && (
        <View style={styles.textWithTimestamp}>
          <CustomText
            style={isSender ? styles.myMessageText : styles.otherMessageText}>
            {data.text}
          </CustomText>
          <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 4}}>
            <CustomText
              style={isSender ? styles.myMsgTime : styles.otherMsgTime}>
              {formatTime24Hour(data.createdAt)}
            </CustomText>
            <MessageStatusTicks
              isSeen={data.isSeen}
              isDelivered={data.isDelivered}
              isSender={isSender}
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default React.memo(
  MessageComponent,
  (prev, next) =>
    prev.senderId === next.senderId &&
    prev.isSelected === next.isSelected &&
    prev.data?._id === next.data?._id &&
    prev.data?.updatedAt === next.data?.updatedAt &&
    prev.data?.isSeen === next.data?.isSeen &&
    prev.data?.isDelivered === next.data?.isDelivered,
);

const styles = StyleSheet.create({
  myMessageContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
    backgroundColor: color.mainColorFade,
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    maxWidth: '70%',
    gap: 8,
    flexWrap: 'wrap',
  },
  locationNameView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    justifyContent: 'space-between',
  },
  myMsgAttachment: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
    backgroundColor: color.mainColorFade,
    borderRadius: 10,
    padding: 4,
    marginVertical: 5,
    maxWidth: '70%',
    gap: 8,
    flexWrap: 'wrap',
  },
  otherMessageContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    backgroundColor: '#E0E0E0',
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: '70%',
    gap: 8,
    flexWrap: 'wrap',
  },
  timeTickView: {
    alignSelf: 'flex-end',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  textWithTimestamp: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
  },
  myMessageText: {
    fontSize: 16,
    color: '#fff',
    flexShrink: 1,
  },
  otherMessageText: {
    fontSize: 16,
    color: '#000',
    flexShrink: 1,
  },
  myLocTxt: {
    marginTop: 4,
    fontSize: 14,
    color: '#ffffffb3',
    flexShrink: 1,
  },
  otherLocTxt: {
    fontSize: 14,
    color: 'grey',
    flexShrink: 1,
  },
  otherMsgTime: {
    fontSize: 12,
    color: 'grey',
    marginLeft: 5,
    alignSelf: 'flex-end',
  },
  myMsgTime: {
    fontSize: 12,
    color: '#fff',
    alignSelf: 'flex-end',
    marginLeft: 5,
  },
  otherMsgNumber: {
    fontSize: 14,
    color: 'grey',
    alignSelf: 'flex-end',
  },
  myMsgNumber: {
    fontSize: 14,
    color: '#fff',
    alignSelf: 'flex-end',
  },
  seeLocBtn: {
    textDecorationLine: 'underline',
    color: color.bluTextColor,
    fontWeight: '800',
  },
  seeMapBelowViewStyle: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attachmentTickTime: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  fullViewBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  fullViewBackBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    padding: 12,
  },
  fullViewError: {
    color: 'red',
    position: 'absolute',
    bottom: 20,
    zIndex: 20,
  },
  fullViewPlayPause: {
    position: 'absolute',
    top: '50%',
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 50,
  },
});

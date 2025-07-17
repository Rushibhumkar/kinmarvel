import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import CustomAvatar from '../../../components/CustomAvatar';
import CustomText from '../../../components/CustomText';

const {width: screenWidth} = Dimensions.get('window');

const PostCard = ({post}: any) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: '#fff',
            borderTopWidth: 0.8,
            borderColor: '#ddd',
          },
        ]}>
        <CustomAvatar name={'lksjd'} />
        <CustomText style={styles.username}>{post.user.name}</CustomText>
        <CustomText style={styles.mention}> @{post.mention}</CustomText>
        <TouchableOpacity
          style={styles.dots}
          onPress={() => setShowOptions(true)}>
          <Image
            source={require('../../../assets/icons/verThreeDots.png')}
            style={{height: 20, width: 20}}
            tintColor={'grey'}
          />
        </TouchableOpacity>
      </View>

      {/* MEDIA CAROUSEL */}
      <Carousel
        data={post.media}
        width={screenWidth}
        height={360}
        pagingEnabled
        onSnapToItem={index => setActiveIndex(index)}
        renderItem={({item}) => (
          <Image
            source={{uri: item.uri}}
            style={styles.media}
            resizeMode="cover"
          />
        )}
      />

      {/* PAGINATION & SPEAKER */}
      <View style={styles.bottomOverlay}>
        <View style={styles.dotsRow}>
          {post.media.map((_: any, i: number) => (
            <View
              key={i}
              style={[styles.dot, {opacity: i === activeIndex ? 1 : 0.3}]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={() => setSoundOn(!soundOn)}>
          <Image
            source={
              soundOn
                ? require('../../../assets/icons/speakerOn.png')
                : require('../../../assets/icons/speakerOff.png')
            }
            style={styles.speakerIcon}
          />
        </TouchableOpacity>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity>
          <Image
            source={require('../../../assets/icons/heartOutline.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={require('../../../assets/icons/message.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={require('../../../assets/icons/share.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity style={{marginLeft: 'auto'}}>
          <Image
            source={require('../../../assets/icons/save.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>

      <Modal visible={showOptions} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
          <View style={styles.modal}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalBox}>
                <TouchableOpacity style={{padding: 12}}>
                  <CustomText>About this account</CustomText>
                </TouchableOpacity>
                <TouchableOpacity style={{padding: 12}}>
                  <CustomText>Report</CustomText>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default PostCard;

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  username: {
    fontWeight: '600',
    marginLeft: 10,
    fontSize: 14,
  },
  mention: {
    marginLeft: 4,
    color: 'gray',
    fontSize: 13,
  },
  dots: {
    marginLeft: 'auto',
    padding: 5,
  },
  media: {
    width: screenWidth,
    height: 360,
  },
  bottomOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -30,
    paddingHorizontal: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  speakerIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
  },
  footer: {
    flexDirection: 'row',
    padding: 10,
    gap: 16,
    marginTop: 12,
  },
  icon: {
    width: 24,
    height: 24,
  },
  modal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000070',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});

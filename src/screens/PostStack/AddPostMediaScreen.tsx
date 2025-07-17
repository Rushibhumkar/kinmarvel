import React, {useState} from 'react';
import {TouchableOpacity, View, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import HeaderBar from './components/HeaderBar';
import MediaPicker from './components/MediaPicker';
import {myConsole} from '../../utils/myConsole';
import CustomText from '../../components/CustomText';
import {shadow} from '../../sharedStyles';

type RootStackParamList = {
  ComposePost: {media: {uri: string; type: string}[]};
};

const AddPostMediaScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedMedia, setSelectedMedia] = useState<
    {uri: string; type: string}[]
  >([]);
  const [mediaSizeMode, setMediaSizeMode] = useState<
    'portrait' | 'square' | 'mixed'
  >('portrait');

  return (
    <View style={styles.screen}>
      <HeaderBar
        title="New post"
        leftIcon={require('../../assets/icons/close.png')}
        leftIconColor="#000"
        onLeftPress={() => {
          setSelectedMedia([]);
          navigation.navigate('HomeStack');
        }}
        rightText="Next"
        onRightPress={() =>
          navigation.navigate('ComposePost', {media: selectedMedia})
        }
      />

      <MediaPicker
        media={selectedMedia}
        onMediaSelected={setSelectedMedia}
        sizeMode={mediaSizeMode}
      />

      {selectedMedia.length > 0 && (
        <TouchableOpacity
          style={styles.portraitBtn}
          onPress={() => {
            const nextMode =
              mediaSizeMode === 'portrait'
                ? 'square'
                : mediaSizeMode === 'square'
                ? 'mixed'
                : 'portrait';
            setMediaSizeMode(nextMode);
          }}>
          <CustomText style={{color: '#000'}}>
            {mediaSizeMode.charAt(0).toUpperCase() + mediaSizeMode.slice(1)}
          </CustomText>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default AddPostMediaScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#fff',
  },
  portraitBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    zIndex: 10,
    ...shadow,
  },
  modeBtnWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    gap: 10,
    zIndex: 10,
  },
});

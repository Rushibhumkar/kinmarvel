import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Image,
  ImageStyle,
} from 'react-native';
import {myConsole} from '../utils/myConsole';
import OnlyLoader from './LoadingCompo/OnlyLoader';
import {fileViewURL} from '../api/axiosInstance';

interface CustomAvatarProps {
  name: string;
  imgUrl?: string;
  mb?: number;
  style?: StyleProp<ViewStyle>;
  imgStyle?: StyleProp<ImageStyle>;
  disabled?: boolean;
  onPress?: any;
  imgLoader?: any;
}

// Function to generate a random color
const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const CustomAvatar: React.FC<CustomAvatarProps> = ({
  name,
  imgUrl,
  mb = 0,
  style,
  disabled = false,
  onPress,
  imgLoader,
  imgStyle,
}) => {
  const [bgColor, setBgColor] = useState<string>(getRandomColor());
  const getInitial = (name: string): string => {
    return name?.charAt(0).toUpperCase() || '';
  };
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      style={{marginBottom: mb}}
      disabled={disabled}>
      {imgLoader ? (
        <View style={styles.loadCenter}>
          <OnlyLoader />
        </View>
      ) : imgUrl ? (
        <Image
          source={{uri: imgUrl}}
          style={[styles.image, {height: 100, width: 100}, imgStyle]}
        />
      ) : (
        <View style={[styles.avatar, {backgroundColor: bgColor}, style]}>
          <Text style={styles.name}>{getInitial(name)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  image: {
    width: 28,
    height: 28,
    borderRadius: 50,
  },
  loadCenter: {
    height: 100,
    width: 100,
    justifyContent: 'center',
    borderRadius: 50,
    alignItems: 'center',
  },
});

export default CustomAvatar;

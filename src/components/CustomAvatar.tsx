import React from 'react';
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
import OnlyLoader from './LoadingCompo/OnlyLoader';

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

// Fixed color mapping for alphabets with matching text color
const colorMapping: {[key: string]: {bg: string; text: string}} = {
  A: {bg: '#F44336', text: '#FFCDD2'},
  B: {bg: '#E91E63', text: '#F8BBD0'},
  C: {bg: '#9C27B0', text: '#E1BEE7'},
  D: {bg: '#673AB7', text: '#D1C4E9'},
  E: {bg: '#3F51B5', text: '#C5CAE9'},
  F: {bg: '#2196F3', text: '#BBDEFB'},
  G: {bg: '#03A9F4', text: '#B3E5FC'},
  H: {bg: '#00BCD4', text: '#B2EBF2'},
  I: {bg: '#009688', text: '#B2DFDB'},
  J: {bg: '#4CAF50', text: '#C8E6C9'},
  K: {bg: '#8BC34A', text: '#DCEDC8'},
  L: {bg: '#CDDC39', text: '#F0F4C3'},
  M: {bg: '#FFC107', text: '#FFECB3'},
  N: {bg: '#FF9800', text: '#FFE0B2'},
  O: {bg: '#FF5722', text: '#FFCCBC'},
  P: {bg: '#795548', text: '#D7CCC8'},
  Q: {bg: '#9E9E9E', text: '#E0E0E0'},
  R: {bg: '#607D8B', text: '#CFD8DC'},
  S: {bg: '#F06292', text: '#F8BBD0'},
  T: {bg: '#BA68C8', text: '#E1BEE7'},
  U: {bg: '#4DB6AC', text: '#B2DFDB'},
  V: {bg: '#81C784', text: '#C8E6C9'},
  W: {bg: '#FFD54F', text: '#FFF9C4'},
  X: {bg: '#FFB74D', text: '#FFE0B2'},
  Y: {bg: '#A1887F', text: '#D7CCC8'},
  Z: {bg: '#90A4AE', text: '#CFD8DC'},
};

// Fixed color for numbers and symbols
const numberSymbolColor = {bg: '#546E7A', text: '#CFD8DC'};

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
  const getInitial = (name: string): string => {
    return name?.charAt(0).toUpperCase() || '';
  };

  const initial = getInitial(name);
  const isAlphabet = /^[A-Z]$/.test(initial);

  const {bg, text} = isAlphabet ? colorMapping[initial] : numberSymbolColor;

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
        <View style={[styles.avatar, {backgroundColor: bg}, style]}>
          <Text style={[styles.name, {color: text}]}>{initial}</Text>
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

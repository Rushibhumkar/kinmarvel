import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  ViewStyle,
} from 'react-native';
import {color} from '../const/color';
import CustomText from './CustomText';

interface CustomCheckboxProps {
  label?: string;
  onChange: (checked: boolean) => void;
  checked: boolean;
  checkBoxStyle?: ViewStyle;
  containerStyle?: ViewStyle;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  label,
  onChange,
  checked,
  checkBoxStyle,
  containerStyle,
}) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (checked) {
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(animation, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [checked]);

  const handlePress = () => {
    onChange(!checked);
  };

  const tickStyle = {
    transform: [
      {
        scale: animation.interpolate({
          inputRange: [0, 2],
          outputRange: [0, 2], // scale animation from 0 to 1
        }),
      },
    ],
  };

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      style={[styles.container, containerStyle]}
      onPress={handlePress}>
      <View style={[styles.checkbox, checkBoxStyle]}>
        {checked && (
          <Animated.View style={tickStyle}>
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/128/5291/5291032.png',
              }}
              height={12}
              width={12}
              tintColor={color.mainColor}
            />
          </Animated.View>
        )}
      </View>
      {label && <CustomText style={styles.label}>{label}</CustomText>}
    </TouchableOpacity>
  );
};

export default CustomCheckbox;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  label: {
    marginLeft: 8,
    fontSize: 16,
  },
});

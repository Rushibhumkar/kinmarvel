import {ActivityIndicator, StyleSheet, View, ViewStyle} from 'react-native';
import React from 'react';
import {color} from '../../const/color';
import {sizes} from '../../const';

interface LoadingCompoProps {
  minHeight?: number;
  loaderSize?: 'large' | 'small';
  backgroundColor?: string;
  style?: ViewStyle;
}

const LoadingCompo: React.FC<LoadingCompoProps> = ({
  minHeight = sizes.width,
  loaderSize = 'large',
  backgroundColor = 'transparent',
  style,
}) => {
  return (
    <View style={[styles.container, {minHeight, backgroundColor}, style]}>
      <ActivityIndicator color={color.mainColor} size={loaderSize} />
    </View>
  );
};

export default LoadingCompo;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});

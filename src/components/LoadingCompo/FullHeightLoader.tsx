import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {color} from '../../const/color';

const FullHeightLoader = () => {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color={color.mainColor} />
    </View>
  );
};

export default FullHeightLoader;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// src/screens/PostStack/components/EmptyComments.tsx
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

/* ===========================
   COMPONENT: Empty Comments State
   =========================== */
const EmptyComments = ({
  message = 'No comments yet. Be the first to comment!',
}: any) => {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

export default EmptyComments;

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#6b7280',
    fontSize: 14,
  },
});

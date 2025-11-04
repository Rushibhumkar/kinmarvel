import React from 'react';
import {Text, Linking, StyleProp, TextStyle} from 'react-native';

export function renderTextWithLinks(
  text: string,
  options?: {
    linkColor?: string; // default: blue
    isClickable?: boolean; // default: true
    textStyle?: StyleProp<TextStyle>;
  },
) {
  if (!text) return null;
  const {linkColor = 'blue', isClickable = true, textStyle} = options || {};

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <Text style={textStyle}>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          return (
            <Text
              key={`link-${index}`}
              style={{color: linkColor}}
              onPress={() => {
                if (isClickable) Linking.openURL(part).catch(() => {});
              }}>
              {part}
            </Text>
          );
        }
        return <Text key={`text-${index}`}>{part}</Text>;
      })}
    </Text>
  );
}

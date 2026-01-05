import React from 'react';
import {Text, Linking, StyleProp, TextStyle} from 'react-native';

export function renderTextWithLinks(
  text: string,
  options?: {
    linkColor?: string; // default: blue
    isClickable?: boolean; // default: true
    textStyle?: StyleProp<TextStyle>;
    numberOfLines?: number;
    ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  },
) {
  if (!text) return null;
  const {linkColor = 'blue', isClickable = true, textStyle} = options || {};

  const urlRegex = /(https?:\/\/[^\s]+)/;
  const parts = text.split(urlRegex);

  return (
    <Text style={textStyle}>
      {parts.map((part, index) => {
        const isLink =
          part.startsWith('http://') || part.startsWith('https://');
        if (isLink) {
          return (
            <Text
              key={`link-${index}`}
              style={[{color: linkColor}, textStyle]}
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

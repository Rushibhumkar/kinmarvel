import {
  FlexAlignType,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ViewStyle,
} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {myConsole} from '../utils/myConsole';
import CustomText from './CustomText';
import {color} from '../const/color';
import CustomAvatar from './CustomAvatar';
import {SPSheet} from 'react-native-popup-confirm-toast';
import CustomFilterComp from './CustomFilterComp';
import {sizes} from '../const';

export type HeaderObjType = {
  isBack?: boolean | (() => void);
  title?: string;
  titleAlign?: 'flex-end' | 'flex-start' | 'center' | 'baseline' | 'stretch';
  showAvatar?: any;
  showRightIcon?: Array<{
    imageSource: any;
    onPress: () => void;
    size?: number;
  }>;
  searchProps?: {
    showSearchBar: boolean;
    onSearch: (text: string) => void;
  };
  children?: React.ReactNode;
  removeFlexProp?: Boolean;
  showFilterBtn?: Boolean;
  filterOnpress?: any;
  bgColor?: any;
  titleOnpress?: any;
  customStyle?: ViewStyle;
};
const noop = () => {};

const MainContainer: React.FC<HeaderObjType> = ({
  isBack,
  title = '',
  titleAlign = 'flex-start',
  showRightIcon = [],
  searchProps,
  filterOnpress,
  children,
  removeFlexProp,
  showFilterBtn,
  showAvatar,
  bgColor,
  customStyle,
}) => {
  const navigation = useNavigation();
  const handleBackPress = () => {
    if (typeof isBack === 'function') {
      isBack();
    } else {
      navigation.goBack();
    }
  };

  const openFilterModal = () => {
    const spSheet = SPSheet;
    spSheet.show({
      component: () => <CustomFilterComp />,
      height: sizes.height / 1.1,
      keyboardHeightAdjustment: false,
      buttonEnabled: false,
      dragTopOnly: true,
      closeOnPressMask: true,
      onClose: () => spSheet.close(),
    });
  };

  return (
    <View style={[styles.container, customStyle]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.headerContainer}>
        {isBack && (
          <TouchableOpacity
            onPress={handleBackPress}
            activeOpacity={0.6}
            style={styles.backIcon}>
            <Image
              source={require('../assets/icons/back.png')}
              style={styles.backImage}
            />
          </TouchableOpacity>
        )}
        {showAvatar && (
          <CustomAvatar name="Rushi" style={{height: 34, width: 34}} />
        )}
        <View
          style={[
            styles.titleContainer,
            {
              alignItems: titleAlign as FlexAlignType,
              marginLeft: isBack && titleAlign === 'center' ? -36 : 8,
            },
          ]}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
        {showFilterBtn && (
          <TouchableOpacity
            style={styles.filterView}
            activeOpacity={0.6}
            onPress={() => openFilterModal()}>
            <Image
              source={require('../assets/icons/linesSetting.png')}
              style={{height: 20, width: 20}}
            />
            <CustomText
              style={{color: '#000', fontSize: 16, fontWeight: '500'}}>
              Filter
            </CustomText>
          </TouchableOpacity>
        )}
        <View style={styles.rightIconsContainer}>
          {Array.isArray(showRightIcon) &&
            showRightIcon.map((icon, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.6}
                onPress={icon.onPress}
                style={styles.profileIcon}>
                <Image
                  source={icon.imageSource}
                  style={{
                    width: icon?.size || 24,
                    height: icon?.size || 24,
                    resizeMode: 'contain',
                  }}
                />
              </TouchableOpacity>
            ))}
        </View>
      </View>
      <View
        style={{
          backgroundColor: bgColor || '#F5F5F5',
          flex: removeFlexProp ? undefined : 1,
        }}>
        {children}
      </View>
    </View>
  );
};

export default MainContainer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backIcon: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  rightIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    paddingHorizontal: 10,
  },
  filterView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: `${color.mainColor}40`,
    borderWidth: 0.8,
    borderColor: 'lightgrey',
    marginRight: 4,
  },
});

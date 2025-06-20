import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import CustomText from '../../components/CustomText';
import CustomListing from './components/CustomListing';
import {color} from '../../const/color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {showErrorToast, showSuccessToast} from '../../utils/toastModalFunction';
import {commonRoute, profileRoute} from '../AuthScreens/routeName';
import {useQueryClient} from '@tanstack/react-query';
import {myStyle} from '../../sharedStyles';
import {sizes} from '../../const';

const ProfileMain: React.FC = ({navigation}: any) => {
  const queryClient = useQueryClient();
  const isNewUpdate = false;
  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      showSuccessToast({description: 'Logged out successfully'});

      queryClient.invalidateQueries({queryKey: ['myData']});
      navigation.reset({
        index: 0,
        routes: [{name: 'Auth'}],
      });
    } catch (error) {
      console.error('Error logging out:', error);
      showErrorToast({description: 'Error logging out. Please try again.'});
    }
  };
  return (
    <View style={styles.container}>
      <View style={[myStyle.row, styles.headerView]}>
        <CustomText style={styles.headerText}>Account</CustomText>
        <TouchableOpacity style={{padding: 4}} onPress={handleLogout}>
          <Image
            source={require('../../assets/animatedIcons/user-logout.png')}
            style={{height: 32, width: 32}}
          />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{paddingBottom: 40}}>
        <CustomListing
          showAvatar
          avatarName={'Rushi'}
          title="Profile"
          onPress={() => navigation.navigate(profileRoute.AccountDetails)}
        />
        {/* <CustomListing
          icon={require('../../assets/icons/report.png')}
          title="Activity/History"
          onPress={() =>
         null
          }
        /> */}
        <CustomListing
          icon={require('../../assets/animatedIcons/hierarchy-structure.png')}
          title="Family hierarchy"
          onPress={() =>
            navigation.navigate(profileRoute.ProfileStack, {
              screen: profileRoute.Hierarchy,
            })
          }
        />
        {/* <CustomListing
          icon={require('../../assets/icons/bell.png')}
          title="Notifications"
          onPress={() =>
            navigation.navigate(commonRoute.CommonStack, {
              screen: commonRoute.AllNotifications,
            })
          }
        /> */}
        <CustomListing
          icon={require('../../assets/animatedIcons/like.png')}
          title="Rate us"
          onPress={() => navigation.navigate(profileRoute.RateUs)}
        />
        <CustomListing
          icon={require('../../assets/animatedIcons/share.png')}
          title="Share app"
          onPress={() => null}
        />
        <CustomListing
          icon={require('../../assets/animatedIcons/blockRed.png')}
          title="Blocked"
          onPress={() => navigation.navigate(profileRoute.Blocked)}
        />
        {/* <CustomListing
          icon={require('../../assets/icons/earth.png')}
          title="App language"
          onPress={() => null}
        /> */}
      </ScrollView>
      <View style={styles.bottomView}>
        <TouchableOpacity activeOpacity={0.6}>
          {isNewUpdate ? (
            <CustomText style={{color: color.mainColor}}>
              New update available
            </CustomText>
          ) : null}
        </TouchableOpacity>
        <CustomText style={{color: 'grey', textAlign: 'right'}}>
          version 2.0.1
        </CustomText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  logoutBtn: {
    backgroundColor: color.mainColor,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  bottomView: {
    flexDirection: 'row',
    // alignItems: 'center',
    justifyContent: 'space-between',
    // backgroundColor: 'red',
    backgroundColor: color.smoothBg,
    width: sizes.width,
    marginLeft: -12,
    marginBottom: -14,
    paddingVertical: 4,
    paddingRight: 24,
    paddingLeft: 12,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 8,
  },
  headerView: {
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
});

export default ProfileMain;

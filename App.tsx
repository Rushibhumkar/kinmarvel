import React, {useEffect, useState} from 'react';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import RootNavigator from './src/navigation/RootNavigator';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Root as PopupRootProvider} from 'react-native-popup-confirm-toast';
// import firebase from '@react-native-firebase/app';
import {
  ActivityIndicator,
  Alert,
  Image,
  LogBox,
  PermissionsAndroid,
  View,
} from 'react-native';
import {getData} from './src/hooks/useAsyncStorage';
import AuthStack from './src/navigation/AuthStack';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
// import messaging from '@react-native-firebase/messaging';
import {registerDevice} from './src/api/notification/notificationFunc';
import {myConsole} from './src/utils/myConsole';
// import notifee from '@notifee/react-native';
import {sizes} from './src/const';

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator();

const AppStack = ({userToken}: any) => {
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName={userToken ? 'Main' : 'Auth'}>
      <Stack.Screen name="Main" component={RootNavigator} />
      <Stack.Screen name="Auth" component={AuthStack} />
    </Stack.Navigator>
  );
};

const App = () => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await getData('authToken');
        setUserToken(token);
      } catch (error) {
        console.log('Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // useEffect(() => {
  //   reqPermissionAndroid();
  // }, []);

  // const reqPermissionAndroid = async () => {
  //   const granted = await PermissionsAndroid.request(
  //     PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  //   );
  //   if (granted === PermissionsAndroid.RESULTS.GRANTED) {
  //     getFCMToken(); // Get FCM token after permission is granted
  //   } else {
  //     Alert.alert('Permission Denied');
  //   }
  // };

  // useEffect(() => {
  //   const unsubscribe = messaging().onMessage(async remoteMessage => {
  //     console.log('Foreground message:', remoteMessage);
  //     // onDisplayNotification(remoteMessage); // Call the notification display function
  //     // Navigate based on notification event
  //     const {event} = remoteMessage.data;
  //     //
  //     // myConsole('eventttt', event);
  //   });
  //   return unsubscribe;
  // }, []);

  // useEffect(() => {
  //   const unsubscribe = messaging().setBackgroundMessageHandler(
  //     async remoteMessage => {
  //       console.log('Background message:', remoteMessage);
  //       // onDisplayNotification(remoteMessage); // Display notification
  //     },
  //   );
  //   return unsubscribe;
  // }, []);

  // const onDisplayNotification = async (remoteMessage: any) => {
  //   // await notifee.requestPermission()

  //   // Create a channel (required for Android)
  //   const channelId = await notifee.createChannel({
  //     id: 'default',
  //     name: 'Default Channel',
  //   });

  //   // Display a notification
  //   await notifee.displayNotification({
  //     title: remoteMessage.notification.title,
  //     body: remoteMessage.notification.body,
  //     android: {
  //       channelId,
  //       smallIcon: 'name-of-a-small-icon', // optional, defaults to 'ic_launcher'.
  //       // pressAction is needed if you want the notification to open the app when pressed
  //       pressAction: {
  //         id: 'default',
  //       },
  //     },
  //   });
  // };

  // const onDisplayNotification = async (remoteMessage: any) => {
  //   const channelId = await notifee.createChannel({
  //     id: 'default',
  //     name: 'Default Channel',
  //   });

  //   await notifee.displayNotification({
  //     title: remoteMessage.notification.title,
  //     body: remoteMessage.notification.body,
  //     android: {
  //       channelId,
  //       smallIcon: 'name-of-a-small-icon',
  //       pressAction: {
  //         id: 'default',
  //       },
  //     },
  //   });
  // };

  // const getFCMToken = async () => {
  //   if (userToken) {
  //     const fcmToken = await messaging().getToken();
  //     // myConsole('fcmTokenssss', fcmToken);
  //     if (fcmToken) {
  //       const platform = 'android'; // Or dynamically set this
  //       await registerDevice(fcmToken, platform); // Register the device
  //     }
  //   }
  // };

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Image
          source={require('./src/assets/images/splashscreen.png')}
          style={{width: sizes.width, height: sizes.height + 54}}
        />
        {/* <ActivityIndicator size="large" /> */}
      </View>
    );
  }

  LogBox.ignoreAllLogs(true);

  return (
    <GestureHandlerRootView style={{flex: 1, backgroundColor: '#fff'}}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <PopupRootProvider>
            <AppStack userToken={userToken} />
          </PopupRootProvider>
        </NavigationContainer>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
};

export default App;

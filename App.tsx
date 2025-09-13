import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import RootNavigator from './src/navigation/RootNavigator';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Root as PopupRootProvider} from 'react-native-popup-confirm-toast';
import DeviceInfo from 'react-native-device-info';
import {
  Alert,
  Image,
  LogBox,
  PermissionsAndroid,
  Platform,
  StatusBar,
  View,
  AppState,
} from 'react-native';
import {getData} from './src/hooks/useAsyncStorage';
import AuthStack from './src/navigation/AuthStack';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import {registerDevice} from './src/api/notification/notificationFunc';
import {myConsole} from './src/utils/myConsole';
import {sizes} from './src/const';
import socket from './src/calling/services/socket';
import {ToastProvider} from 'react-native-toast-notifications';

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator();

const AppStack = ({userToken}: any) => (
  <Stack.Navigator
    screenOptions={{headerShown: false}}
    initialRouteName={userToken ? 'Main' : 'Auth'}>
    <Stack.Screen name="Main" component={RootNavigator} />
    <Stack.Screen name="Auth" component={AuthStack} />
  </Stack.Navigator>
);

const App = () => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ------- Auth & token boot -------
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await getData('authToken');
        setUserToken(token);
        if (token) {
          await getFCMToken();
        }
      } catch (error) {
        console.log('[AUTH] Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkLoginStatus();
  }, []);

  // ------- Device ID (optional debug) -------
  useEffect(() => {
    const fetchDeviceId = async () => {
      try {
        const uniqueId = await DeviceInfo.getUniqueId();
        console.log('[DEVICE] Unique ID:', uniqueId);
      } catch (error) {
        console.error('[DEVICE] Error getting Device ID:', error);
      }
    };
    fetchDeviceId();
  }, []);

  // ------- Android 13+ notification permission -------
  useEffect(() => {
    reqPermissionAndroid();
  }, []);

  const reqPermissionAndroid = async () => {
    try {
      if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        console.log('[PERM] POST_NOTIFICATIONS:', granted);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Notification permission denied');
        }
      }
    } catch (e) {
      console.log('[PERM] request error:', e);
    }
  };

  // ------- Disconnect call socket when app backgrounds -------
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'inactive' || state === 'background') {
        try {
          socket.disconnect();
          console.log('[APPSTATE] Disconnected call socket on background');
        } catch (e) {
          console.log('[APPSTATE] Socket disconnect error:', e);
        }
      }
    });
    return () => sub.remove();
  }, []);

  // ------- Get FCM token & register with backend -------
  const getFCMToken = async () => {
    try {
      const fcmToken = await messaging().getToken();
      myConsole('fcmToken', fcmToken);
      console.log('[FCM] token:', fcmToken);
      if (fcmToken) {
        await registerDevice(fcmToken, 'android');
      }
    } catch (error) {
      console.error('[FCM] Error getting token:', error);
    }
  };

  // Keep backend updated on token refresh
  useEffect(() => {
    const unsubscribe = messaging().onTokenRefresh(async newToken => {
      console.log('[FCM] token refreshed:', newToken);
      try {
        await registerDevice(newToken, 'android');
      } catch (e) {
        console.log('[FCM] registerDevice refresh failed:', e);
      }
    });
    return unsubscribe;
  }, []);

  // ------- Foreground FCM messages -------
  useEffect(() => {
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('[FG] message:', JSON.stringify(remoteMessage));
      await onDisplayNotification(remoteMessage);
      const event = remoteMessage?.data?.event;
      if (event) myConsole('[FG] event', event);
    });
    return () => {
      unsubscribeForeground();
    };
  }, []);

  // ❗ Background handler is in index.js (setBackgroundMessageHandler). Do NOT add it here.

  // ------- When user opens the app via a notification -------
  useEffect(() => {
    const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(
      remoteMessage => {
        console.log('[OPENED from background]:', JSON.stringify(remoteMessage));
        // TODO: navigate based on remoteMessage?.data if needed
      },
    );

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('[OPENED from quit]:', JSON.stringify(remoteMessage));
          // TODO: navigate based on remoteMessage?.data if needed
        }
      });

    return () => {
      unsubscribeNotificationOpened();
    };
  }, []);

  // ------- Notifee foreground events (tap, etc.) -------
  useEffect(() => {
    const sub = notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS) {
        console.log('[NOTIF] pressed:', JSON.stringify(detail?.notification));
        // TODO: navigate based on detail.notification?.data
      }
    });
    return () => sub();
  }, []);

  // ------- Show a local notification with Notifee -------
  const onDisplayNotification = async (remoteMessage: any) => {
    try {
      await notifee.requestPermission();

      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH, // heads-up
      });

      const title =
        remoteMessage?.notification?.title ||
        remoteMessage?.data?.title ||
        'Notification';

      const body =
        remoteMessage?.notification?.body ||
        remoteMessage?.data?.body ||
        'You have a new message.';

      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          pressAction: {id: 'default'},
        },
        data: remoteMessage?.data || {},
      });
    } catch (error) {
      console.error('[NOTIF] display error:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <StatusBar barStyle={'dark-content'} backgroundColor={'#fff'} />
        <Image
          source={require('./src/assets/images/splashscreen.png')}
          style={{width: sizes.width, height: sizes.height + 54}}
        />
      </View>
    );
  }

  LogBox.ignoreAllLogs(true);

  return (
    <GestureHandlerRootView style={{flex: 1, backgroundColor: '#fff'}}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <ToastProvider
            placement="top"
            offset={16}
            duration={2500}
            swipeEnabled>
            <PopupRootProvider>
              <AppStack userToken={userToken} />
            </PopupRootProvider>
          </ToastProvider>
        </NavigationContainer>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
};

export default App;

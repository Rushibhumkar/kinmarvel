import React, {useEffect, useState} from 'react';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
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
import CallEventEmitter from './src/calling/services/CallEventEmitter';
import GlobalCallListener from './src/calling/GlobalCallListener';
import {navigationRef} from './src/navigation/NavigationRef';
import {CallProvider} from './src/calling/context/CallProvider';

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

  // Auth & token boot
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

  // Device ID (optional debug)
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

  // Android 13+ notification permission
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

  // Disconnect call socket when app backgrounds
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

  // Get FCM token & register with backend
  const getFCMToken = async () => {
    try {
      const fcmToken = await messaging().getToken();
      myConsole('fcmTokennn', fcmToken);
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

  // Foreground FCM messages
  useEffect(() => {
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      const event = remoteMessage?.data?.event;

      if (event === 'CALL_RECEIVED') {
        // Suppress local notification, show call modal instead
        CallEventEmitter.emit('incoming-call', remoteMessage.data);
      } else {
        await onDisplayNotification(remoteMessage);
      }
    });
    return () => unsubscribeForeground();
  }, []);

  // When user opens app via notification
  useEffect(() => {
    const unsubscribeOpened = messaging().onNotificationOpenedApp(
      remoteMessage => {
        if (remoteMessage?.data?.event === 'CALL_RECEIVED') {
          navigationRef.current?.navigate('CallStack');

          setTimeout(() => {
            CallEventEmitter.emit('incoming-call', remoteMessage.data);
          }, 200);
        }
      },
    );

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage?.data?.event === 'CALL_RECEIVED') {
          navigationRef.current?.navigate('CallStack');

          setTimeout(() => {
            CallEventEmitter.emit('incoming-call', remoteMessage.data);
          }, 200);
        }
      });

    return () => unsubscribeOpened();
  }, []);

  // Notifee foreground events (tap, etc.)
  useEffect(() => {
    const sub = notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS) {
        console.log('[NOTIF] pressed:', JSON.stringify(detail?.notification));
        // TODO: navigate based on detail.notification?.data
      }
    });
    return () => sub();
  }, []);

  useEffect(() => {
    if (!userToken) return;

    socket.on('incoming-call', payload => {
      myConsole('[Socket] Incoming Call Event:', payload);
      setTimeout(() => {
        CallEventEmitter.emit('incoming-call', payload);
      }, 300);
    });

    return () => {
      socket.off('incoming-call');
    };
  }, [userToken]);

  // Show local notification with Notifee
  const onDisplayNotification = async (remoteMessage: any) => {
    try {
      await notifee.requestPermission();

      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      const title =
        remoteMessage?.notification?.title ||
        remoteMessage?.data?.title ||
        'Notification';

      const body =
        remoteMessage?.notification?.body ||
        remoteMessage?.data?.body ||
        'You have a new message.';

      const event = remoteMessage?.data?.event;

      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          sound:
            event === 'CALL_RECEIVED' ? 'default_ringtone' : 'message_tone',
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
        <CallProvider userId={userToken}>
          <NavigationContainer ref={navigationRef}>
            <GlobalCallListener />
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
        </CallProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
};

export default App;

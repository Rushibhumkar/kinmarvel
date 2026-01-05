/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

import './src/polyfills/backHandler';
import 'react-native-get-random-values';

import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  try {
    // console.log('[BG] FCM message:', JSON.stringify(remoteMessage));

    // Create (or reuse) a high-importance channel for heads-up notifications
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
  } catch (e) {
    // console.log('[BG] display error:', e);
  }
});

AppRegistry.registerComponent(appName, () => App);

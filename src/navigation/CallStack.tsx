import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import CallingMain from '../calling/CallingMain';
import {callRoute} from '../screens/AuthScreens/routeName';

const Stack = createNativeStackNavigator();

const CallStack = () => {
  return (
    <Stack.Navigator
      initialRouteName={callRoute.CallingMain}
      screenOptions={{
        headerShown: false,
        statusBarStyle: 'dark',
        statusBarBackgroundColor: '#fff',
      }}>
      <Stack.Screen name={'CallingMain'} component={CallingMain} />
    </Stack.Navigator>
  );
};

export default CallStack;

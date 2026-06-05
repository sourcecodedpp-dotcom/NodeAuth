import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppStore } from './src/store';
import { seedDemoData } from './src/lib/db';
import { RootStackParamList } from './src/types';
import { SplashScreen } from './src/screens/SplashScreen';
import { SupervisorLoginScreen } from './src/screens/SupervisorLoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { FaceScanScreen } from './src/screens/FaceScanScreen';
import { LivenessScreen } from './src/screens/LivenessScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

// Suppress harmless development warnings for the hackathon presentation
LogBox.ignoreLogs([
  'The kernel', // TensorFlow hot-reload kernel registration warnings
  'Platform browser has already been set', // TensorFlow platform warning
  '"shadow*" style props are deprecated', // React Native Web shadow deprecation
]);

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    seedDemoData().catch(console.error);
    const unsubscribe = NetInfo.addEventListener(state => {
      useAppStore.getState().setOnlineStatus(!!state.isConnected);
    });
    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="SupervisorLogin" component={SupervisorLoginScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="FaceScan" component={FaceScanScreen} />
          <Stack.Screen name="Liveness" component={LivenessScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

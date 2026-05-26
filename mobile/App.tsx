import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStackParamList } from './src/types';
import { SplashScreen } from './src/screens/SplashScreen';
import { SupervisorLoginScreen } from './src/screens/SupervisorLoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { FaceScanScreen } from './src/screens/FaceScanScreen';
import { LivenessScreen } from './src/screens/LivenessScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
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

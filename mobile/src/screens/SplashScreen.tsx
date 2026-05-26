import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export function SplashScreen() {
  const navigation = useNavigation<Nav>();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('SupervisorLogin');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        {/* Logo mark */}
        <View style={styles.logoContainer}>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Text style={styles.logoIcon}>⬡</Text>
            </View>
          </View>
        </View>
        <Text style={styles.title}>NHAI</Text>
        <Text style={styles.subtitle}>FaceGuard</Text>
        <Text style={styles.tagline}>Secure Offline Facial Authentication</Text>
      </Animated.View>
      <Text style={styles.version}>v1.0.0 · Hackathon Build</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 28,
  },
  logoRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 36,
    color: '#fff',
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 4,
    marginTop: 4,
  },
  tagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 20,
    letterSpacing: 0.5,
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 1,
  },
});
